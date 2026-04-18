<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { startNFCRead, isNFCSupported, playSuccessSound } from '$lib/nfc';
	import { currentUser, tasks } from '$lib/stores';
	import { getTask } from '$lib/firebase';

	type ScanState = 'idle' | 'scanning' | 'found' | 'error';

	let scanState = $state<ScanState>('idle');
	let message   = $state('');
	let foundTask = $state<{ id: string; title: string } | null>(null);
	let stopScan: (() => void) | null = null;
	let animating = $state(false);

	// 最近スキャンしたタグIDのローカル履歴
	let recentIds = $state<string[]>([]);

	onDestroy(() => { stopScan?.(); });

	async function startScan() {
		if (!$currentUser) { goto(resolve('/')); return; }
		scanState = 'scanning';
		message   = 'NFCタグをデバイスに近づけてください...';
		animating = true;
		foundTask = null;

		stopScan = await startNFCRead(async (event) => {
			if (event.type === 'read') {
				const task = await getTask(event.taskId);
				if (task && task.userId === $currentUser?.uid) {
					playSuccessSound();
					foundTask = { id: event.taskId, title: task.title };
					scanState = 'found';
					message   = 'タスクが見つかりました!';
					animating = false;
					recentIds = [event.taskId, ...recentIds.filter((x) => x !== event.taskId)].slice(0, 3);
					stopScan?.();
					stopScan = null;
				} else {
					scanState = 'error';
					message   = 'このタグのタスクが見つかりません';
					animating = false;
				}
			} else if (event.type === 'error') {
				scanState = 'error';
				message   = event.message;
				animating = false;
			}
		});
	}

	function stopScanning() {
		stopScan?.();
		stopScan = null;
		scanState = 'idle';
		animating = false;
		message   = '';
	}

	function reset() {
		foundTask = null;
		scanState = 'idle';
		message   = '';
		animating = false;
	}

	// タスク名を ID から引く
	function taskTitle(id: string) {
		return $tasks.find((t) => t.id === id)?.title ?? id.slice(0, 8) + '...';
	}

	const isDetected = $derived(scanState === 'found');
	const coinGrad = $derived(isDetected
		? 'radial-gradient(circle at 35% 30%, #10B981ee, #10B981aa 60%, #10B98155)'
		: 'radial-gradient(circle at 35% 30%, #22D3EEee, #3B82F6cc 50%, #2563EBaa)');
	const coinGlow = $derived(isDetected
		? '0 0 60px rgba(16,185,129,0.5), 0 20px 40px rgba(0,0,0,0.35), inset 0 2px 10px rgba(255,255,255,0.35)'
		: '0 0 60px rgba(34,211,238,0.5), 0 20px 40px rgba(0,0,0,0.4), inset 0 2px 10px rgba(255,255,255,0.25)');
	const ringColor = $derived(isDetected ? 'var(--success)' : 'var(--neon)');
</script>

<div class="nfc-screen">
	<!-- 放射グラデーション背景 -->
	<div class="nfc-bg" aria-hidden="true"></div>

	<!-- ヘッダー -->
	<div class="nfc-header">
		<button class="icon-btn" onclick={stopScanning} aria-label="閉じる">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>
		</button>
		<span class="nfc-mode-label">NFC MODE</span>
		<div style="width:36px"></div>
	</div>

	<!-- コインエリア -->
	<div class="coin-area">
		<div class="coin-rings" aria-hidden="true">
			{#each [0, 1, 2] as i (i)}
				<div
					class="ring {animating ? 'ring-animate' : ''}"
					style="
						width: {240 - i * 50}px;
						height: {240 - i * 50}px;
						border-color: {ringColor};
						opacity: {0.15 + i * 0.08};
						animation-delay: {i * 0.4}s;
					"
				></div>
			{/each}
		</div>

		<!-- コイン本体 -->
		<div class="coin" class:coin-detected={isDetected} style="background:{coinGrad};box-shadow:{coinGlow}">
			<div class="coin-inner-ring" aria-hidden="true"></div>
			<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M4 9c4-4 12-4 16 0M7 12c3-2 7-2 10 0M10 15c1-1 3-1 4 0"/>
				<circle cx="12" cy="18" r="1.3" fill="white" stroke="none"/>
			</svg>
		</div>
	</div>

	<!-- テキスト -->
	<div class="nfc-text">
		<h1 class="nfc-title">
			{#if scanState === 'found'}タスク検出!{:else if scanState === 'error'}エラー{:else}タグをかざして{/if}
		</h1>
		<p class="nfc-sub">
			{#if message}{message}{:else}NFCコインをスマートフォンに近づけるとタスクが表示されます{/if}
		</p>
	</div>

	<!-- ステータスチップ -->
	{#if scanState === 'scanning' || scanState === 'found'}
		<div class="status-chip" class:status-found={isDetected} style="border-color:{isDetected ? 'rgba(16,185,129,0.3)' : 'rgba(34,211,238,0.2)'}">
			<span class="status-dot" style="background:{ringColor};box-shadow:0 0 8px {ringColor}"></span>
			<span class="status-text">{isDetected ? '接続完了' : 'スキャン中...'}</span>
		</div>
	{/if}

	<!-- タスクカード (検出時) -->
	{#if foundTask}
		<div class="found-card card">
			<p class="found-label">タスクが見つかりました</p>
			<p class="found-title">{foundTask.title}</p>
			<div class="found-actions">
				<button class="btn-primary" style="flex:1" onclick={() => goto(resolve('/task/[id]', { id: foundTask?.id || '' }))}>
					詳細を見る
				</button>
				<button class="btn-ghost" style="flex:1" onclick={reset}>再スキャン</button>
			</div>
		</div>
	{/if}

	<!-- ボタン -->
	{#if !isNFCSupported}
		<div class="unsupported-card card">
			<p style="font-size:14px;color:var(--warning);font-weight:600;margin:0 0 6px">Web NFC 非対応</p>
			<p style="font-size:13px;color:var(--text-muted);margin:0">Android Chrome 89 以降でご利用ください。QRコードでも代替できます。</p>
		</div>
	{:else if scanState === 'idle' || scanState === 'error'}
		<button class="scan-btn btn-primary" onclick={startScan}>スキャン開始</button>
	{:else if scanState === 'scanning'}
		<button class="scan-btn btn-ghost" onclick={stopScanning}>キャンセル</button>
	{/if}

	<!-- 使い方 (idle時) -->
	{#if scanState === 'idle'}
		<div class="guide card">
			<p class="guide-title">使い方</p>
			<ol class="guide-list">
				{#each ['タスク詳細画面でNFCタグに書き込む', '「スキャン開始」をタップ', 'タグをスマートフォンに近づける', 'タスクが自動表示されます'] as step, i (i)}
					<li class="guide-item">
						<span class="guide-num">{i + 1}</span>
						<span class="guide-text">{step}</span>
					</li>
				{/each}
			</ol>
		</div>
	{/if}

	<!-- 最近のタグ -->
	{#if recentIds.length > 0}
		<div class="recent-section">
			<p class="recent-label">最近スキャン</p>
			<div class="recent-chips">
				{#each recentIds as id, i (i)}
					<button class="recent-chip" onclick={() => goto(resolve('/task/[id]', { id }))}>
						<span class="recent-dot"></span>
						{taskTitle(id)}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
.nfc-screen {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20px;
	text-align: center;
	min-height: calc(100dvh - 180px);
	padding-bottom: 20px;
}

/* 背景グラデーション */
.nfc-bg {
	position: fixed;
	inset: 0;
	background: radial-gradient(ellipse at 50% 20%, rgba(59,130,246,0.15) 0%, transparent 60%);
	pointer-events: none;
	z-index: -1;
}

/* ヘッダー */
.nfc-header {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.nfc-mode-label {
	font-size: 12px;
	font-weight: 700;
	color: var(--text-muted);
	letter-spacing: 2px;
}

/* コインエリア */
.coin-area {
	position: relative;
	width: 240px; height: 240px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 8px 0;
}

/* リング */
.ring {
	position: absolute;
	border-radius: 9999px;
	border: 1.5px solid;
	transition: border-color 0.4s;
}
.ring-animate {
	animation: pulse-ring 2s ease-out infinite;
}

/* コイン */
.coin {
	position: relative;
	width: 170px; height: 170px;
	border-radius: 9999px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.5s, box-shadow 0.5s;
	animation: float 3s ease-in-out infinite;
}
.coin-detected {
	animation: float 3s ease-in-out infinite, spin-slow 8s linear infinite;
}
.coin-inner-ring {
	position: absolute;
	inset: 10px;
	border-radius: 9999px;
	border: 1.5px dashed rgba(255,255,255,0.3);
}

/* テキスト */
.nfc-title {
	font-size: 26px;
	font-weight: 700;
	letter-spacing: -0.5px;
	color: var(--text);
	margin: 0;
}
.nfc-sub {
	font-size: 14px;
	color: var(--text-muted);
	margin: 6px 0 0;
	max-width: 280px;
	line-height: 1.5;
}
.nfc-text { display: flex; flex-direction: column; align-items: center; }

/* ステータスチップ */
.status-chip {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	border-radius: 9999px;
	border: 1px solid;
	background: var(--surface);
	font-size: 13px;
	font-weight: 600;
	color: var(--text);
}
.status-dot { width: 8px; height: 8px; border-radius: 9999px; }

/* タスクカード */
.found-card {
	width: 100%;
	max-width: 340px;
	padding: 16px 18px;
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.found-label { font-size: 12px; color: var(--text-muted); margin: 0; }
.found-title { font-size: 16px; font-weight: 700; color: var(--text); margin: 0; }
.found-actions { display: flex; gap: 10px; margin-top: 4px; }

/* ボタン */
.scan-btn { width: 100%; max-width: 340px; }

/* 未対応 */
.unsupported-card { padding: 16px 18px; max-width: 340px; text-align: left; }

/* 使い方ガイド */
.guide { padding: 16px 18px; max-width: 340px; width: 100%; text-align: left; }
.guide-title { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px; }
.guide-list  { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.guide-item  { display: flex; align-items: center; gap: 10px; }
.guide-num   {
	width: 22px; height: 22px; border-radius: 9999px;
	background: rgba(59,130,246,0.15);
	color: var(--primary);
	font-size: 11px; font-weight: 700;
	display: flex; align-items: center; justify-content: center;
	flex-shrink: 0;
}
.guide-text { font-size: 13px; color: var(--text-muted); }

/* 最近のタグ */
.recent-section { width: 100%; max-width: 340px; }
.recent-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; text-align: left; margin: 0 0 8px; }
.recent-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.recent-chip {
	display: flex; align-items: center; gap: 6px;
	padding: 6px 12px; border-radius: 10px;
	background: var(--surface); border: 1px solid var(--line);
	font-size: 12px; color: var(--text-muted); cursor: pointer; font-family: var(--font);
	transition: background 0.15s;
}
.recent-chip:hover { background: var(--surface2); color: var(--text); }
.recent-dot { width: 6px; height: 6px; border-radius: 9999px; background: var(--primary); }
</style>
