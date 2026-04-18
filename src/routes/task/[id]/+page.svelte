<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { getTask, updateTask, type Task } from '$lib/firebase';
	import { currentUser, completeTask, removeTask } from '$lib/stores';
	import { writeNFCTag, isNFCSupported, playSuccessSound } from '$lib/nfc';
	import { generateTaskQR } from '$lib/qr';
	import { Timestamp } from 'firebase/firestore';

	const taskId = $derived($page.params.id as string);

	let task     = $state<Task | null>(null);
	let loading  = $state(true);
	let editing  = $state(false);
	let saving   = $state(false);
	let nfcWriting = $state(false);
	let nfcMsg   = $state('');
	let qrUrl    = $state('');
	let showQR   = $state(false);

	let editForm = $state({
		title: '', description: '', priority: 'medium' as Task['priority'],
		category: '', dueDate: ''
	});

	onMount(async () => {
		if (!$currentUser) { goto(resolve('/')); return; }
		const data = await getTask(taskId);
		if (!data || data.userId !== $currentUser.uid) { goto(resolve('/')); return; }
		task = data;
		loading = false;
	});

	function startEdit() {
		if (!task) return;
		editForm = {
			title: task.title,
			description: task.description,
			priority: task.priority,
			category: task.category,
			dueDate: task.dueDate ? task.dueDate.toDate().toISOString().slice(0, 16) : ''
		};
		editing = true;
	}

	async function saveEdit() {
		if (!task?.id) return;
		saving = true;
		try {
			const updates: Partial<Task> = {
				title: editForm.title,
				description: editForm.description,
				priority: editForm.priority,
				category: editForm.category,
				dueDate: editForm.dueDate ? Timestamp.fromDate(new Date(editForm.dueDate)) : null
			};
			await updateTask(task.id, updates);
			task = { ...task, ...updates };
			editing = false;
		} finally {
			saving = false;
		}
	}

	async function handleComplete() {
		if (!task?.id) return;
		await completeTask(task.id);
		task = { ...task, status: 'completed' };
	}

	async function handleDelete() {
		if (!task?.id || !confirm('タスクを削除しますか?')) return;
		await removeTask(task.id);
		goto(resolve('/'));
	}

	async function handleNFCWrite() {
		if (!task?.id) return;
		nfcWriting = true;
		nfcMsg = 'NFCタグをデバイスに近づけてください...';
		try {
			await writeNFCTag(task.id);
			playSuccessSound();
			nfcMsg = '書き込み完了!';
			await updateTask(task.id, { nfcTagId: task.id });
			task = { ...task, nfcTagId: task.id };
		} catch (err) {
			nfcMsg = `エラー: ${(err as Error).message}`;
		} finally {
			nfcWriting = false;
			setTimeout(() => (nfcMsg = ''), 4000);
		}
	}

	async function handleShowQR() {
		if (!task?.id) return;
		if (!qrUrl) qrUrl = await generateTaskQR(task.id);
		showQR = !showQR;
	}

	async function toggleSubtask(index: number) {
		if (!task?.id) return;
		const subtasks = task.subtasks.map((s, i) => i === index ? { ...s, checked: !s.checked } : s);
		await updateTask(task.id, { subtasks });
		task = { ...task, subtasks };
	}

	const PRIO_COLOR: Record<Task['priority'], string> = {
		low: '#10B981', medium: '#F59E0B', high: '#EF4444'
	};
	const PRIO_LABEL: Record<Task['priority'], string> = { low: '低', medium: '中', high: '高' };

	function formatDate(ts: Timestamp | null) {
		if (!ts) return '期限なし';
		return ts.toDate().toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="detail">
	<!-- 戻るボタン -->
	<div class="detail-nav">
		<button class="icon-btn" onclick={() => goto(resolve('/'))} aria-label="戻る">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
		</button>
		{#if !loading && task && !editing}
			<div class="detail-nav-right">
				<button class="icon-btn" onclick={handleNFCWrite} disabled={!isNFCSupported || nfcWriting} title="NFCに書き込む">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M4 9c4-4 12-4 16 0M7 12c3-2 7-2 10 0M10 15c1-1 3-1 4 0"/><circle cx="12" cy="18" r="1.3" fill="var(--primary)" stroke="none"/>
					</svg>
				</button>
				<button class="icon-btn" onclick={startEdit} title="編集">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/></svg>
				</button>
				<button class="icon-btn" onclick={handleDelete} title="削除" style="color:var(--danger)">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
				</button>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="detail-loading">読み込み中...</div>
	{:else if !task}
		<div class="detail-loading">タスクが見つかりません</div>
	{:else if editing}
		<!-- 編集フォーム -->
		<div class="card edit-card">
			<h2 class="edit-title">タスクを編集</h2>
			<div class="edit-form">
				<div class="form-group">
					<label for="e-title" class="form-label">タイトル</label>
					<input id="e-title" bind:value={editForm.title} class="form-input" />
				</div>
				<div class="form-group">
					<label for="e-desc" class="form-label">説明</label>
					<textarea id="e-desc" bind:value={editForm.description} rows="4" class="form-input form-textarea"></textarea>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label for="e-prio" class="form-label">優先度</label>
						<select id="e-prio" bind:value={editForm.priority} class="form-input">
							<option value="high">高</option><option value="medium">中</option><option value="low">低</option>
						</select>
					</div>
					<div class="form-group">
						<label for="e-cat" class="form-label">カテゴリ</label>
						<input id="e-cat" bind:value={editForm.category} class="form-input" />
					</div>
				</div>
				<div class="form-group">
					<label for="e-due" class="form-label">期限</label>
					<input id="e-due" type="datetime-local" bind:value={editForm.dueDate} class="form-input" />
				</div>
				<div class="form-row" style="margin-top:4px">
					<button class="btn-ghost" onclick={() => (editing = false)}>キャンセル</button>
					<button class="btn-primary" onclick={saveEdit} disabled={saving}>
						{saving ? '保存中...' : '保存する'}
					</button>
				</div>
			</div>
		</div>
	{:else}
		<!-- タスク詳細 -->
		<div class="card task-detail-card">
			<!-- タイトル行 -->
			<div class="td-title-row">
				<div class="td-check-wrap">
					<button
						class="td-check {task.status === 'completed' ? 'td-check-done' : ''}"
						onclick={handleComplete}
						aria-label="完了にする"
					>
						{#if task.status === 'completed'}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>
						{/if}
					</button>
				</div>
				<div class="td-title-body">
					<h1 class="td-title {task.status === 'completed' ? 'td-title-done' : ''}">{task.title}</h1>
					{#if task.nfcTagId}
						<div class="td-nfc-hint">
							<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round"><path d="M4 9c4-4 12-4 16 0M7 12c3-2 7-2 10 0M10 15c1-1 3-1 4 0"/><circle cx="12" cy="18" r="1.3" fill="var(--primary)" stroke="none"/></svg>
							NFCタグ登録済み
						</div>
					{/if}
				</div>
			</div>

			<!-- メタグリッド -->
			<div class="meta-grid">
				<div class="meta-field">
					<div class="meta-label">期限</div>
					<div class="meta-value">
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
						{formatDate(task.dueDate)}
					</div>
				</div>
				<div class="meta-field">
					<div class="meta-label">優先度</div>
					<div class="meta-value">
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="{PRIO_COLOR[task.priority]}" stroke-width="2" stroke-linecap="round"><path d="M4 21V4h13l-2 4 2 4H4"/></svg>
						<span style="color:{PRIO_COLOR[task.priority]}">{PRIO_LABEL[task.priority]}</span>
					</div>
				</div>
				{#if task.category}
					<div class="meta-field" style="grid-column: span 2">
						<div class="meta-label">カテゴリ</div>
						<div class="meta-value">{task.category}</div>
					</div>
				{/if}
			</div>

			<!-- 説明 -->
			{#if task.description}
				<div class="td-section">
					<div class="td-section-label">説明</div>
					<p class="td-desc">{task.description}</p>
				</div>
			{/if}

			<!-- サブタスク -->
			{#if task.subtasks?.length}
				<div class="td-section">
					<div class="td-section-label">
						サブタスク
						<span class="subtask-count">{task.subtasks.filter(s => s.checked).length}/{task.subtasks.length}</span>
					</div>
					<div class="subtask-list">
						{#each task.subtasks as st, i (i)}
							<div class="subtask-row2">
								<button
									class="st-check {st.checked ? 'st-check-done' : ''}"
									onclick={() => toggleSubtask(i)}
									aria-label="サブタスク: {st.text}"
								>
									{#if st.checked}
										<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>
									{/if}
								</button>
								<span class="st-text {st.checked ? 'st-done' : ''}">{st.text}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- NFC / QR セクション -->
		<div class="card nfc-section">
			<div class="nfc-sec-header">
				<div class="nfc-sec-title">NFCタグ / QRコード</div>
				<div class="nfc-sec-status {task.nfcTagId ? 'nfc-linked' : 'nfc-unlinked'}">
					{task.nfcTagId ? '登録済み' : '未登録'}
				</div>
			</div>

			{#if nfcMsg}
				<p class="nfc-msg">{nfcMsg}</p>
			{/if}

			<div class="nfc-actions">
				{#if isNFCSupported}
					<button class="btn-primary" style="flex:1" onclick={handleNFCWrite} disabled={nfcWriting || task.status === 'completed'}>
						{nfcWriting ? '書き込み中...' : 'NFCに書き込む'}
					</button>
				{/if}
				<button class="btn-ghost" style="flex:1" onclick={handleShowQR}>
					{showQR ? 'QRを閉じる' : 'QR表示'}
				</button>
			</div>

			{#if showQR && qrUrl}
				<div class="qr-wrap">
					<img src={qrUrl} alt="タスクQRコード" class="qr-img" />
					<p class="qr-hint">スキャンするとこのタスクを開けます</p>
				</div>
			{/if}
		</div>

		<!-- 完了ボタン -->
		{#if task.status !== 'completed'}
			<button class="btn-primary" style="width:100%" onclick={handleComplete}>
				完了にする
			</button>
		{:else}
			<div class="done-banner">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>
				このタスクは完了済みです
			</div>
		{/if}
	{/if}
</div>

<style>
.detail { display: flex; flex-direction: column; gap: 14px; }

.detail-nav {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.detail-nav-right { display: flex; gap: 8px; }
.detail-loading { text-align: center; color: var(--text-muted); padding: 60px 0; }

/* Edit form */
.edit-card  { padding: 20px; }
.edit-title { font-size: 18px; font-weight: 700; color: var(--text); margin: 0 0 16px; }
.edit-form  { display: flex; flex-direction: column; gap: 14px; }

/* Detail card */
.task-detail-card { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.td-title-row { display: flex; align-items: flex-start; gap: 12px; }
.td-check-wrap { padding-top: 4px; }
.td-check {
	width: 26px; height: 26px; border-radius: 9999px;
	border: 2px solid var(--surface2);
	background: transparent;
	display: flex; align-items: center; justify-content: center;
	cursor: pointer;
	transition: border-color 0.2s, background 0.2s;
}
.td-check:hover  { border-color: var(--success); }
.td-check-done   { border-color: var(--success); background: var(--success); }

.td-title-body { flex: 1; }
.td-title {
	font-size: 22px;
	font-weight: 700;
	letter-spacing: -0.3px;
	color: var(--text);
	line-height: 1.25;
	margin: 0;
}
.td-title-done { text-decoration: line-through; opacity: 0.5; }
.td-nfc-hint {
	display: flex;
	align-items: center;
	gap: 5px;
	font-size: 12px;
	color: var(--primary);
	margin-top: 6px;
	font-weight: 500;
}

/* Meta grid */
.meta-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 10px;
}
.meta-field { display: flex; flex-direction: column; gap: 6px; }
.meta-label {
	font-size: 10px;
	font-weight: 600;
	color: var(--text-muted);
	text-transform: uppercase;
	letter-spacing: 1px;
}
.meta-value {
	padding: 10px 12px;
	border-radius: 12px;
	background: var(--bg);
	border: 1px solid var(--line);
	font-size: 13px;
	font-weight: 600;
	color: var(--text);
	display: flex;
	align-items: center;
	gap: 6px;
}

/* Sections */
.td-section      { display: flex; flex-direction: column; gap: 8px; }
.td-section-label {
	font-size: 10px;
	font-weight: 600;
	color: var(--text-muted);
	text-transform: uppercase;
	letter-spacing: 1px;
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.subtask-count {
	font-size: 11px;
	color: var(--primary);
	font-weight: 600;
}
.td-desc { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin: 0; }

/* Subtasks */
.subtask-list { background: var(--bg); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
.subtask-row2 {
	padding: 12px 14px;
	display: flex;
	align-items: center;
	gap: 10px;
	border-bottom: 1px solid var(--line);
}
.subtask-row2:last-child { border-bottom: none; }
.st-check {
	width: 18px; height: 18px;
	border-radius: 9999px;
	border: 1.6px solid var(--surface2);
	background: transparent;
	display: flex; align-items: center; justify-content: center;
	cursor: pointer; flex-shrink: 0;
	transition: border-color 0.2s, background 0.2s;
}
.st-check-done  { border-color: var(--success); background: var(--success); }
.st-text  { font-size: 13px; color: var(--text); flex: 1; }
.st-done  { text-decoration: line-through; color: var(--text-muted); }

/* NFC section */
.nfc-section { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
.nfc-sec-header { display: flex; align-items: center; justify-content: space-between; }
.nfc-sec-title  { font-size: 14px; font-weight: 600; color: var(--text); }
.nfc-sec-status { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 9999px; }
.nfc-linked   { background: rgba(16,185,129,0.15); color: var(--success); }
.nfc-unlinked { background: var(--surface2); color: var(--text-muted); }
.nfc-msg      { font-size: 13px; color: var(--neon); margin: 0; }
.nfc-actions  { display: flex; gap: 10px; }

.qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.qr-img  { width: 160px; height: 160px; border-radius: 12px; }
.qr-hint { font-size: 12px; color: var(--text-muted); margin: 0; }

/* Done banner */
.done-banner {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 14px;
	border-radius: 16px;
	background: rgba(16,185,129,0.1);
	border: 1px solid rgba(16,185,129,0.2);
	font-size: 14px;
	font-weight: 600;
	color: var(--success);
}

/* Shared form styles (copied here for scoping) */
.form-group   { display: flex; flex-direction: column; gap: 6px; }
.form-row     { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-label   { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; }
.form-input   {
	height: 42px; border: 1px solid var(--line);
	border-radius: var(--r-input);
	background: var(--bg); color: var(--text);
	font-size: 14px; font-family: var(--font); padding: 0 12px;
	transition: border-color 0.15s; width: 100%;
}
.form-input:focus  { outline: none; border-color: var(--primary); }
.form-textarea { height: auto; padding: 10px 12px; resize: vertical; }
</style>
