<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { tasks, editTask } from '$lib/stores';
	import { writeNFCTag, isNFCSupported, playSuccessSound } from '$lib/nfc';
	import { generateTaskQR } from '$lib/qr';
	import type { Task } from '$lib/firebase';

	const taggedTasks   = $derived($tasks.filter((t) => t.nfcTagId));
	const untaggedTasks = $derived(
		$tasks.filter((t) => !t.nfcTagId && t.status !== 'completed' && t.status !== 'archived')
	);

	let writingId    = $state<string | null>(null);
	let writeMessage = $state<Record<string, string>>({});
	let qrMap        = $state<Record<string, string>>({});
	let showQRId     = $state<string | null>(null);

	async function handleWrite(task: Task) {
		if (!task.id || !isNFCSupported) return;
		writingId = task.id;
		writeMessage = { ...writeMessage, [task.id]: 'NFCタグをかざしてください...' };
		try {
			await writeNFCTag(task.id);
			playSuccessSound();
			await editTask(task.id, { nfcTagId: task.id });
			writeMessage = { ...writeMessage, [task.id]: '書き込み完了!' };
		} catch (err) {
			writeMessage = { ...writeMessage, [task.id]: `エラー: ${(err as Error).message}` };
		} finally {
			writingId = null;
			setTimeout(() => { writeMessage = { ...writeMessage, [task.id!]: '' }; }, 3000);
		}
	}

	async function handleUnlink(taskId: string) {
		if (!confirm('このタスクからNFCタグの登録を解除しますか?')) return;
		await editTask(taskId, { nfcTagId: undefined });
	}

	async function toggleQR(task: Task) {
		if (!task.id) return;
		if (showQRId === task.id) { showQRId = null; return; }
		if (!qrMap[task.id]) {
			qrMap = { ...qrMap, [task.id]: await generateTaskQR(task.id) };
		}
		showQRId = task.id;
	}

	const PRIO_LABEL: Record<Task['priority'], string> = { high: '高', medium: '中', low: '低' };
	const PRIO_CLASS: Record<Task['priority'], string> = { high: 'prio-high', medium: 'prio-med', low: 'prio-low' };
</script>

<div class="tags-page">
	<!-- ページヘッダー -->
	<div class="page-header">
		<h1 class="page-title">NFCタグ管理</h1>
		<p class="page-sub">タスクとNFCタグ / QRコードの紐付けを管理します</p>
	</div>

	<!-- 統計バー -->
	<div class="stats-row">
		<div class="stat-card card">
			<span class="stat-num">{taggedTasks.length}</span>
			<span class="stat-label">登録済み</span>
		</div>
		<div class="stat-card card">
			<span class="stat-num">{untaggedTasks.length}</span>
			<span class="stat-label">未登録</span>
		</div>
		<div class="stat-card card">
			<span class="stat-num">{$tasks.length}</span>
			<span class="stat-label">合計</span>
		</div>
	</div>

	<!-- 登録済みセクション -->
	<section>
		<div class="section-head">
			<span class="section-dot dot-blue"></span>
			<span class="section-title">登録済みタグ</span>
			<span class="section-count">{taggedTasks.length}</span>
		</div>

		{#if taggedTasks.length === 0}
			<div class="empty-card card">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted);margin-bottom:8px">
					<path d="M4 9c4-4 12-4 16 0M7 12c3-2 7-2 10 0M10 15c1-1 3-1 4 0"/>
					<circle cx="12" cy="18" r="1.3" fill="currentColor" stroke="none"/>
				</svg>
				<p class="empty-text">まだタグが登録されていません</p>
			</div>
		{:else}
			<ul class="task-list">
				{#each taggedTasks as task (task.id)}
					<li class="task-item card">
						<div class="task-top">
							<div class="task-info">
								<span class="task-title">{task.title}</span>
								{#if task.category}
									<span class="pill category-pill">{task.category}</span>
								{/if}
							</div>
							<span class="pill {PRIO_CLASS[task.priority]}">{PRIO_LABEL[task.priority]}</span>
						</div>

						<!-- NFC バッジ -->
						<div class="nfc-badge">
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9c4-4 12-4 16 0M7 12c3-2 7-2 10 0M10 15c1-1 3-1 4 0"/><circle cx="12" cy="18" r="1.3" fill="currentColor" stroke="none"/></svg>
							登録済み
						</div>

						{#if writeMessage[task.id!]}
							<p class="write-msg">{writeMessage[task.id!]}</p>
						{/if}

						<div class="task-actions">
							<button class="btn-ghost action-btn" onclick={() => goto(resolve('/task/[id]', { id: task.id || '' }))}>詳細</button>
							{#if isNFCSupported}
								<button class="btn-ghost action-btn" onclick={() => handleWrite(task)} disabled={writingId === task.id}>
									{writingId === task.id ? '書き込み中...' : '上書き'}
								</button>
							{/if}
							<button class="btn-ghost action-btn" onclick={() => toggleQR(task)}>
								QR {showQRId === task.id ? '閉じる' : '表示'}
							</button>
							<button class="btn-danger action-btn" onclick={() => handleUnlink(task.id!)}>解除</button>
						</div>

						{#if showQRId === task.id && qrMap[task.id!]}
							<div class="qr-box">
								<img src={qrMap[task.id!]} alt="QRコード" class="qr-img" />
								<p class="qr-caption">このQRでタスクを開けます</p>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- 未登録セクション -->
	{#if untaggedTasks.length > 0}
		<section>
			<div class="section-head">
				<span class="section-dot dot-muted"></span>
				<span class="section-title">タグ未登録</span>
				<span class="section-count">{untaggedTasks.length}</span>
			</div>
			<ul class="task-list">
				{#each untaggedTasks as task (task.id)}
					<li class="task-item card task-item-compact">
						<span class="task-title">{task.title}</span>

						{#if writeMessage[task.id!]}
							<p class="write-msg">{writeMessage[task.id!]}</p>
						{/if}

						<div class="task-actions">
							{#if isNFCSupported}
								<button class="btn-primary action-btn" onclick={() => handleWrite(task)} disabled={writingId === task.id}>
									{writingId === task.id ? '書き込み中...' : 'NFCに登録'}
								</button>
							{/if}
							<button class="btn-ghost action-btn" onclick={() => toggleQR(task)}>
								QR {showQRId === task.id ? '閉じる' : '表示'}
							</button>
						</div>

						{#if showQRId === task.id && qrMap[task.id!]}
							<div class="qr-box">
								<img src={qrMap[task.id!]} alt="QRコード" class="qr-img" />
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<!-- 非対応バナー -->
	{#if !isNFCSupported}
		<div class="unsupported-banner card">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="color:var(--warning);flex-shrink:0">
				<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
			</svg>
			<div>
				<p class="banner-title">Web NFC 非対応</p>
				<p class="banner-sub">Android Chrome 89 以降でご利用ください。QRコードで代替できます。</p>
			</div>
		</div>
	{/if}
</div>

<style>
.tags-page {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

/* ヘッダー */
.page-header { display: flex; flex-direction: column; gap: 4px; }
.page-title  { font-size: 22px; font-weight: 700; color: var(--text); margin: 0; }
.page-sub    { font-size: 13px; color: var(--text-muted); margin: 0; }

/* 統計 */
.stats-row {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 10px;
}
.stat-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
	padding: 14px 8px;
}
.stat-num   { font-size: 22px; font-weight: 700; color: var(--text); }
.stat-label { font-size: 11px; color: var(--text-muted); }

/* セクションヘッド */
.section-head {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 10px;
}
.section-dot  { width: 8px; height: 8px; border-radius: 9999px; flex-shrink: 0; }
.dot-blue     { background: var(--primary); box-shadow: 0 0 6px var(--primary); }
.dot-muted    { background: var(--text-muted); }
.section-title { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
.section-count { font-size: 11px; color: var(--text-muted); background: var(--surface2); padding: 2px 8px; border-radius: 9999px; }

/* 空状態 */
.empty-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 32px 16px;
}
.empty-text { font-size: 13px; color: var(--text-muted); margin: 0; }

/* タスクリスト */
.task-list {
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	flex-direction: column;
	gap: 10px;
}
.task-item {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 14px 16px;
}
.task-item-compact { gap: 8px; }

.task-top {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 10px;
}
.task-info  { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
.task-title { font-size: 14px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.category-pill {
	background: rgba(59,130,246,0.15);
	color: var(--primary);
	border: 1px solid rgba(59,130,246,0.2);
	width: fit-content;
}

/* NFC バッジ */
.nfc-badge {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	font-size: 11px;
	font-weight: 600;
	color: var(--success);
	background: rgba(16,185,129,0.12);
	border: 1px solid rgba(16,185,129,0.25);
	padding: 3px 10px;
	border-radius: 9999px;
	width: fit-content;
}

/* 書き込みメッセージ */
.write-msg {
	font-size: 12px;
	color: var(--neon);
	margin: 0;
}

/* アクションボタン群 */
.task-actions {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}
.action-btn {
	font-size: 12px;
	padding: 6px 14px;
}
.btn-danger {
	font-size: 13px;
	font-weight: 600;
	padding: 6px 14px;
	border-radius: var(--r-input);
	border: 1px solid rgba(239,68,68,0.3);
	background: rgba(239,68,68,0.1);
	color: var(--danger);
	cursor: pointer;
	transition: background 0.15s;
}
.btn-danger:hover { background: rgba(239,68,68,0.2); }

/* QR */
.qr-box     { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.qr-img     { width: 140px; height: 140px; border-radius: 12px; background: #fff; padding: 6px; }
.qr-caption { font-size: 11px; color: var(--text-muted); margin: 0; }

/* 非対応バナー */
.unsupported-banner {
	display: flex;
	align-items: flex-start;
	gap: 12px;
	padding: 14px 16px;
	border-color: rgba(245,158,11,0.25) !important;
}
.banner-title { font-size: 13px; font-weight: 600; color: var(--warning); margin: 0 0 4px; }
.banner-sub   { font-size: 12px; color: var(--text-muted); margin: 0; line-height: 1.5; }
</style>
