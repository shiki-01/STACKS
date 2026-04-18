<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		currentUser,
		filteredTasks,
		tasksLoading,
		filter,
		sortBy,
		tasks,
		addTask,
		editTask,
		completeTask,
		removeTask
	} from '$lib/stores';
	import type { Task } from '$lib/firebase';
	import { getFirebaseErrorMessage } from '$lib/firebase';
	import { isNFCSupported, writeNFCTag, playSuccessSound } from '$lib/nfc';
	import { Timestamp } from 'firebase/firestore';

	// --- 統計 ---
	const totalActive = $derived($tasks.filter((t) => t.status !== 'archived').length);
	const doneCount = $derived($tasks.filter((t) => t.status === 'completed').length);
	const inProgCount = $derived($tasks.filter((t) => t.status === 'in_progress').length);

	// SVGドーナツ用
	const R = 42,
		C = $derived(2 * Math.PI * R);
	const donePct = $derived(totalActive ? doneCount / totalActive : 0);
	const progPct = $derived(totalActive ? inProgCount / totalActive : 0);

	// --- 優先度 ---
	const PRIO_LABEL: Record<Task['priority'], string> = { low: '低', medium: '中', high: '高' };
	const PRIO_CLASS: Record<Task['priority'], string> = {
		low: 'prio-low',
		medium: 'prio-medium',
		high: 'prio-high'
	};
	function formatDate(ts: import('firebase/firestore').Timestamp | null) {
		if (!ts) return '期限なし';
		return ts.toDate().toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
	}

	// --- タスク作成モーダル ---
	let showModal = $state(false);
	let form = $state({
		title: '',
		description: '',
		priority: 'medium' as Task['priority'],
		category: '',
		dueDate: '',
		subtasks: [] as { text: string; checked: boolean }[]
	});
	let newSubtask = $state('');
	let saving = $state(false);
	let createMessage = $state('');

	function resetForm() {
		form = {
			title: '',
			description: '',
			priority: 'medium',
			category: '',
			dueDate: '',
			subtasks: []
		};
		newSubtask = '';
		createMessage = '';
	}

	function addSubtask() {
		if (!newSubtask.trim()) return;
		form.subtasks = [...form.subtasks, { text: newSubtask.trim(), checked: false }];
		newSubtask = '';
	}

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!form.title.trim() || !$currentUser) return;
		saving = true;
		createMessage = '';
		try {
			const taskId = await addTask({
				userId: $currentUser.uid,
				title: form.title.trim(),
				description: form.description.trim(),
				priority: form.priority,
				category: form.category.trim(),
				dueDate: form.dueDate ? Timestamp.fromDate(new Date(form.dueDate)) : null,
				status: 'pending',
				subtasks: form.subtasks
			});
			if (isNFCSupported) {
				createMessage = 'NFCタグをデバイスに近づけてください...';
				try {
					await writeNFCTag(taskId);
					playSuccessSound();
					await editTask(taskId, { nfcTagId: taskId });
				} catch {
					// NFCなしで続行
				}
			}
			showModal = false;
			resetForm();
		} catch (error) {
			createMessage = getFirebaseErrorMessage(error);
		} finally {
			saving = false;
		}
	}
</script>

<div class="dash">
	<!-- ── サマリーカード ── -->
	<div class="summary-card card">
		<!-- グロー -->
		<div class="glow-blob"></div>

		<!-- ドーナツ -->
		<div class="donut-wrap">
			<svg width="108" height="108" viewBox="0 0 108 108" style="transform:rotate(-90deg)">
				<circle cx="54" cy="54" r={R} fill="none" stroke="var(--surface2)" stroke-width="10" />
				<circle
					cx="54"
					cy="54"
					r={R}
					fill="none"
					stroke="var(--success)"
					stroke-width="10"
					stroke-dasharray="{C * donePct} {C}"
					stroke-linecap="round"
				/>
				<circle
					cx="54"
					cy="54"
					r={R}
					fill="none"
					stroke="var(--primary)"
					stroke-width="10"
					stroke-dasharray="{C * progPct} {C}"
					stroke-dashoffset={-C * donePct}
					stroke-linecap="round"
				/>
			</svg>
			<div class="donut-center">
				<div class="donut-main">{doneCount}<span class="donut-total">/{totalActive}</span></div>
				<div class="donut-label">完了</div>
			</div>
		</div>

		<!-- 凡例 -->
		<div class="legend">
			<div class="legend-title">今日のフォーカス</div>
			{#each [{ color: 'var(--success)', label: '完了', n: doneCount }, { color: 'var(--primary)', label: '進行中', n: inProgCount }, { color: 'var(--text-muted)', label: '未着手', n: Math.max(0, totalActive - doneCount - inProgCount) }] as row, i (i)}
				<div class="legend-row">
					<span class="legend-dot" style="background:{row.color}"></span>
					<span class="legend-name">{row.label}</span>
					<span class="legend-num">{row.n}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- ── クイックアクション ── -->
	<div class="quick-actions">
		<button class="qa-btn qa-primary" onclick={() => (showModal = true)}>
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.4"
				stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg
			>
			新規タスク
		</button>
		<a href={resolve('/nfc')} class="qa-btn qa-neon">
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M4 9c4-4 12-4 16 0M7 12c3-2 7-2 10 0M10 15c1-1 3-1 4 0" />
				<circle cx="12" cy="18" r="1.3" fill="currentColor" stroke="none" />
			</svg>
			NFCスキャン
		</a>
	</div>

	<!-- ── フィルター ── -->
	<div class="filter-row">
		<select bind:value={$filter.status} class="filter-sel">
			<option value="all">すべて</option>
			<option value="pending">未着手</option>
			<option value="in_progress">進行中</option>
			<option value="completed">完了</option>
		</select>
		<select bind:value={$filter.priority} class="filter-sel">
			<option value="all">優先度: 全</option>
			<option value="high">高</option>
			<option value="medium">中</option>
			<option value="low">低</option>
		</select>
		<select bind:value={$sortBy} class="filter-sel">
			<option value="createdAt">作成順</option>
			<option value="dueDate">期限順</option>
			<option value="priority">優先度順</option>
		</select>
		<input bind:value={$filter.search} placeholder="検索..." class="filter-search" />
	</div>

	<!-- ── タスクリスト ── -->
	{#if $tasksLoading}
		<div class="empty-state">読み込み中...</div>
	{:else if $filteredTasks.length === 0}
		<div class="empty-state">
			<div class="empty-icon">📋</div>
			<div>タスクがありません</div>
		</div>
	{:else}
		<ul class="task-list">
			{#each $filteredTasks as task (task.id)}
				<li class="task-card card {task.status === 'completed' ? 'task-done' : ''}">
					<!-- チェックボックス -->
					<button
						class="task-check {task.status === 'completed' ? 'task-check-done' : ''}"
						onclick={() => task.status !== 'completed' && completeTask(task.id!)}
						aria-label="完了にする"
					>
						{#if task.status === 'completed'}
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="white"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"><path d="M5 12l4 4 10-10" /></svg
							>
						{/if}
					</button>

					<!-- 本文 -->
					<div
						class="task-body"
						role="button"
						tabindex="0"
						onclick={() => goto(resolve('/task/[id]', { id: task.id || '' }))}
						onkeydown={(e) =>
							e.key === 'Enter' && goto(resolve('/task/[id]', { id: task.id || '' }))}
					>
						<div class="task-title {task.status === 'completed' ? 'task-title-done' : ''}">
							{task.title}
						</div>
						<div class="task-meta">
							<span class="pill {PRIO_CLASS[task.priority]}">
								<span class="prio-dot"></span>{PRIO_LABEL[task.priority]}
							</span>
							{#if task.category}
								<span class="pill" style="color:var(--text-muted);background:var(--surface2)"
									>{task.category}</span
								>
							{/if}
							<span class="meta-text">
								<svg
									width="11"
									height="11"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg
								>
								{formatDate(task.dueDate)}
							</span>
							{#if task.nfcTagId}
								<span class="nfc-badge">
									<svg
										width="11"
										height="11"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										><path d="M4 9c4-4 12-4 16 0M7 12c3-2 7-2 10 0M10 15c1-1 3-1 4 0" /><circle
											cx="12"
											cy="18"
											r="1.3"
											fill="currentColor"
											stroke="none"
										/></svg
									>
								</span>
							{/if}
						</div>
					</div>

					<!-- 削除 -->
					<button class="task-del" onclick={() => removeTask(task.id!)} aria-label="削除">
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"><path d="M6 6l12 12M18 6l-12 12" /></svg
						>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<!-- FAB -->
<button class="fab" onclick={() => (showModal = true)} aria-label="新規タスク">
	<svg
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.4"
		stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg
	>
</button>

<!-- タスク作成モーダル -->
{#if showModal}
	<div
		class="modal-overlay"
		onclick={() => (showModal = false)}
		onkeydown={(e) => e.key === 'Escape' && (showModal = false)}
		role="button"
		tabindex="-1"
	>
		<div
			class="modal-card card"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
			role="dialog"
			tabindex="0"
			aria-modal="true"
			aria-label="新しいタスク"
		>
			<div class="modal-header">
				<h2 class="modal-title">新しいタスク</h2>
				<button class="icon-btn" onclick={() => (showModal = false)} aria-label="閉じる">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"><path d="M6 6l12 12M18 6l-12 12" /></svg
					>
				</button>
			</div>

			<form onsubmit={handleCreate} class="modal-form">
				{#if createMessage}
					<div class="modal-msg">{createMessage}</div>
				{/if}

				<div class="form-group">
					<label for="t-title" class="form-label"
						>タイトル <span style="color:var(--danger)">*</span></label
					>
					<input
						id="t-title"
						bind:value={form.title}
						required
						placeholder="タスクのタイトル"
						class="form-input"
					/>
				</div>
				<div class="form-group">
					<label for="t-desc" class="form-label">説明</label>
					<textarea
						id="t-desc"
						bind:value={form.description}
						rows="3"
						placeholder="詳細メモ"
						class="form-input form-textarea"
					></textarea>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label for="t-prio" class="form-label">優先度</label>
						<select id="t-prio" bind:value={form.priority} class="form-input">
							<option value="high">高</option>
							<option value="medium">中</option>
							<option value="low">低</option>
						</select>
					</div>
					<div class="form-group">
						<label for="t-cat" class="form-label">カテゴリ</label>
						<input
							id="t-cat"
							bind:value={form.category}
							placeholder="仕事 / 個人..."
							class="form-input"
						/>
					</div>
				</div>
				<div class="form-group">
					<label for="t-due" class="form-label">期限</label>
					<input id="t-due" type="datetime-local" bind:value={form.dueDate} class="form-input" />
				</div>

				<!-- サブタスク -->
				<div class="form-group">
					<label for="t-subtask" class="form-label">サブタスク</label>
					<div class="subtask-row">
						<input
							id="t-subtask"
							bind:value={newSubtask}
							placeholder="追加..."
							class="form-input"
							style="flex:1"
							onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
						/>
						<button
							type="button"
							class="btn-ghost"
							style="height:40px;padding:0 14px;font-size:13px"
							onclick={addSubtask}>追加</button
						>
					</div>
					{#each form.subtasks as st, i (i)}
						<div class="subtask-item">
							<span style="font-size:13px;color:var(--text);flex:1">{st.text}</span>
							<button
								type="button"
								onclick={() => {
									form.subtasks = form.subtasks.filter((_, j) => j !== i);
								}}
								style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:16px"
								>✕</button
							>
						</div>
					{/each}
				</div>

				<div class="modal-actions">
					<button type="button" class="btn-ghost" style="flex:1" onclick={() => (showModal = false)}
						>キャンセル</button
					>
					<button type="submit" class="btn-primary" style="flex:1" disabled={saving}>
						{saving ? '作成中...' : '作成する'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	/* ── Dashboard ── */
	.dash {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	/* Summary card */
	.summary-card {
		padding: 20px;
		display: flex;
		align-items: center;
		gap: 18px;
		position: relative;
		overflow: hidden;
	}
	.glow-blob {
		position: absolute;
		top: -40px;
		right: -30px;
		width: 140px;
		height: 140px;
		background: radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent 70%);
		filter: blur(4px);
		pointer-events: none;
	}
	.donut-wrap {
		position: relative;
		width: 108px;
		height: 108px;
		flex-shrink: 0;
	}
	.donut-center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.donut-main {
		font-size: 26px;
		font-weight: 700;
		letter-spacing: -0.5px;
		color: var(--text);
	}
	.donut-total {
		font-size: 16px;
		font-weight: 500;
		color: var(--text-muted);
	}
	.donut-label {
		font-size: 10px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.8px;
		margin-top: -2px;
	}

	.legend {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.legend-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--text);
		margin-bottom: 2px;
	}
	.legend-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
	}
	.legend-dot {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	.legend-name {
		flex: 1;
		color: var(--text-muted);
	}
	.legend-num {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--text);
	}

	/* Quick actions */
	.quick-actions {
		display: flex;
		gap: 10px;
	}
	.qa-btn {
		flex: 1;
		height: 52px;
		border-radius: 16px;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-size: 14px;
		font-weight: 600;
		font-family: var(--font);
		cursor: pointer;
		text-decoration: none;
		transition:
			opacity 0.15s,
			transform 0.15s;
	}
	.qa-btn:active {
		transform: scale(0.97);
	}
	.qa-primary {
		background: linear-gradient(135deg, var(--primary), var(--primary-deep));
		color: #fff;
		box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
	}
	.qa-neon {
		background: var(--surface);
		border: 1px solid rgba(34, 211, 238, 0.3);
		color: var(--neon);
		box-shadow: 0 0 20px rgba(34, 211, 238, 0.12);
	}

	/* Filters */
	.filter-row {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		padding-bottom: 2px;
	}
	.filter-sel,
	.filter-search {
		height: 36px;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--surface);
		color: var(--text);
		font-size: 12px;
		font-family: var(--font);
		padding: 0 10px;
		white-space: nowrap;
	}
	.filter-search {
		flex: 1;
		min-width: 80px;
	}
	.filter-sel:focus,
	.filter-search:focus {
		outline: none;
		border-color: var(--primary);
	}

	/* Task list */
	.task-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.task-card {
		padding: 12px 14px;
		display: flex;
		align-items: flex-start;
		gap: 12px;
		border-radius: 16px;
		transition: opacity 0.2s;
	}
	.task-done {
		opacity: 0.5;
	}

	.task-check {
		width: 22px;
		height: 22px;
		border-radius: 9999px;
		border: 1.8px solid var(--surface2);
		background: transparent;
		flex-shrink: 0;
		margin-top: 1px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition:
			border-color 0.2s,
			background 0.2s;
	}
	.task-check:hover {
		border-color: var(--success);
	}
	.task-check-done {
		border-color: var(--success);
		background: var(--success);
	}

	.task-body {
		flex: 1;
		min-width: 0;
		cursor: pointer;
	}
	.task-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.task-title-done {
		text-decoration: line-through;
		color: var(--text-muted);
	}

	.task-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 6px;
		flex-wrap: wrap;
	}
	.meta-text {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: 11px;
		color: var(--text-muted);
	}

	.prio-dot {
		width: 5px;
		height: 5px;
		border-radius: 9999px;
		background: currentColor;
	}
	.nfc-badge {
		display: inline-flex;
		align-items: center;
		width: 20px;
		height: 20px;
		border-radius: 9999px;
		background: rgba(59, 130, 246, 0.15);
		justify-content: center;
		color: var(--primary);
	}

	.task-del {
		background: none;
		border: none;
		color: var(--text-dim);
		cursor: pointer;
		padding: 4px;
		border-radius: 6px;
		opacity: 0;
		transition:
			opacity 0.15s,
			color 0.15s;
	}
	.task-card:hover .task-del {
		opacity: 1;
	}
	.task-del:hover {
		color: var(--danger);
	}

	/* Empty */
	.empty-state {
		text-align: center;
		color: var(--text-muted);
		padding: 48px 0;
	}
	.empty-icon {
		font-size: 40px;
		margin-bottom: 8px;
	}

	/* FAB */
	.fab {
		position: fixed;
		bottom: 92px;
		right: 18px;
		width: 54px;
		height: 54px;
		border-radius: 9999px;
		background: linear-gradient(135deg, var(--primary), var(--violet));
		color: #fff;
		border: none;
		cursor: pointer;
		box-shadow:
			0 10px 30px rgba(59, 130, 246, 0.5),
			inset 0 0 0 1px rgba(255, 255, 255, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s;
	}
	.fab:hover {
		transform: scale(1.08);
	}
	.fab:active {
		transform: scale(0.95);
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 80;
		padding: 0 12px 12px;
	}
	.modal-card {
		width: 100%;
		max-width: 520px;
		max-height: 90dvh;
		overflow-y: auto;
		border-radius: 24px;
	}
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 20px 0;
	}
	.modal-title {
		font-size: 18px;
		font-weight: 700;
		color: var(--text);
		margin: 0;
	}
	.modal-form {
		padding: 16px 20px 20px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.modal-msg {
		font-size: 13px;
		color: var(--warning);
		background: rgba(245, 158, 11, 0.1);
		border: 1px solid rgba(245, 158, 11, 0.2);
		border-radius: 10px;
		padding: 10px 14px;
	}
	.modal-actions {
		display: flex;
		gap: 10px;
		margin-top: 4px;
	}

	/* Form */
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	.form-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.8px;
	}
	.form-input {
		height: 42px;
		border: 1px solid var(--line);
		border-radius: var(--r-input);
		background: var(--bg);
		color: var(--text);
		font-size: 14px;
		font-family: var(--font);
		padding: 0 12px;
		transition: border-color 0.15s;
		width: 100%;
	}
	.form-input:focus {
		outline: none;
		border-color: var(--primary);
	}
	.form-textarea {
		height: auto;
		padding: 10px 12px;
		resize: vertical;
	}
	select.form-input {
		cursor: pointer;
	}

	.subtask-row {
		display: flex;
		gap: 8px;
	}
	.subtask-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 0;
		border-bottom: 1px solid var(--line);
	}
</style>
