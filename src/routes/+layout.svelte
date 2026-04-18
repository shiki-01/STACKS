<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import '../app.css';
	import { currentUser, authLoading, appError } from '$lib/stores';
	import { signInWithGoogle, signOutUser } from '$lib/firebase';
	import OfflineBanner from '$lib/components/OfflineBanner.svelte';
	import InstallPrompt from '$lib/components/InstallPrompt.svelte';

	let { children } = $props();

	// 認証ガード
	$effect(() => {
		if (!$authLoading && !$currentUser && page.url.pathname !== '/') {
			goto(resolve('/'));
		}
	});

	const navItems = [
		{ href: '/', icon: 'home', label: 'ホーム', center: false },
		{ href: '/nfc', icon: 'nfc', label: 'スキャン', center: true },
		{ href: '/tags', icon: 'tags', label: 'タグ', center: false },
		{ href: '/settings', icon: 'settings', label: '設定', center: false }
	] as const;

	function isActive(href: string) {
		return page.url.pathname === href;
	}

	let signingIn = $state(false);
	let loginError = $state('');

	async function handleSignIn() {
		signingIn = true;
		loginError = '';
		try {
			await signInWithGoogle();
		} catch (e) {
			loginError = (e as Error).message;
		} finally {
			signingIn = false;
		}
	}
</script>

<svelte:head>
	<title>NFC Task Coin</title>
</svelte:head>

<OfflineBanner />
<InstallPrompt />

{#if $authLoading}
	<div class="splash">
		<div class="splash-coin">🪙</div>
		<div class="splash-title">NFC Task Coin</div>
		<div class="splash-sub">読み込み中...</div>
	</div>

{:else if !$currentUser && page.url.pathname === '/'}
	<!-- ログイン画面 -->
	<div class="login-wrap">
		<div class="login-card">
			<div class="login-coin">🪙</div>
			<h1 class="login-title">NFC Task Coin</h1>
			<p class="login-sub">NFCタグで管理する、楽しいタスク管理</p>

			{#if loginError}
				<div class="login-err">{loginError}</div>
			{/if}

			<button class="btn-primary" style="width:100%;margin-top:8px" onclick={handleSignIn} disabled={signingIn}>
				{signingIn ? 'ログイン中...' : 'Google でログイン'}
			</button>
		</div>
	</div>

{:else if $currentUser}
	<div class="app-shell">
		<!-- ヘッダー -->
		<header class="app-header">
			<div class="header-inner">
				<div class="header-brand">
					<span class="brand-icon">🪙</span>
					<span class="brand-name">NFC Task Coin</span>
				</div>
				<div class="header-right">
					{#if $appError}
						<span class="header-err" title={$appError}>⚠</span>
					{/if}
					<button class="header-avatar-btn" onclick={signOutUser} aria-label="ログアウト">
						<img
							src={$currentUser.photoURL ?? ''}
							alt="avatar"
							class="header-avatar"
							referrerpolicy="no-referrer"
						/>
					</button>
				</div>
			</div>
		</header>

		<!-- メインコンテンツ -->
		<main class="app-main">
			{@render children()}
		</main>

		<!-- タブバー -->
		<nav class="tab-bar" aria-label="メインナビゲーション">
			{#each navItems as item, i (i)}
				{#if item.center}
					<!-- 中央コインボタン -->
					<a href={resolve(item.href)} class="tab-coin" aria-label={item.label} aria-current={isActive(item.href) ? 'page' : undefined}>
						<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M4 9c4-4 12-4 16 0M7 12c3-2 7-2 10 0M10 15c1-1 3-1 4 0"/>
							<circle cx="12" cy="18" r="1.3" fill="currentColor" stroke="none"/>
						</svg>
					</a>
				{:else}
					<a href={resolve(item.href)} class="tab-item" aria-current={isActive(item.href) ? 'page' : undefined}>
						{#if item.icon === 'home'}
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={isActive(item.href) ? 2.4 : 1.8} stroke-linecap="round" stroke-linejoin="round">
								<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>
							</svg>
						{:else if item.icon === 'tags'}
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={isActive(item.href) ? 2.4 : 1.8} stroke-linecap="round" stroke-linejoin="round">
								<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
								<line x1="7" y1="7" x2="7.01" y2="7"/>
							</svg>
						{:else if item.icon === 'settings'}
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={isActive(item.href) ? 2.4 : 1.8} stroke-linecap="round" stroke-linejoin="round">
								<circle cx="12" cy="12" r="3"/>
								<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
							</svg>
						{/if}
						<span class="tab-label">{item.label}</span>
					</a>
				{/if}
			{/each}
		</nav>
	</div>
{/if}

<style>
/* ── Splash ── */
.splash {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100dvh;
	gap: 8px;
}
.splash-coin  { font-size: 56px; animation: float 2s ease-in-out infinite; }
.splash-title { font-size: 22px; font-weight: 700; color: var(--text); }
.splash-sub   { font-size: 14px; color: var(--text-muted); }

/* ── Login ── */
.login-wrap {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100dvh;
	padding: 20px;
}
.login-card {
	background: var(--surface);
	border: 1px solid var(--line);
	border-radius: var(--r-card);
	padding: 36px 28px;
	max-width: 360px;
	width: 100%;
	text-align: center;
	box-shadow: 0 20px 60px rgb(0 0 0 / 0.4);
}
.login-coin  { font-size: 52px; margin-bottom: 8px; }
.login-title { font-size: 24px; font-weight: 700; color: var(--text); margin: 0 0 8px; }
.login-sub   { font-size: 14px; color: var(--text-muted); margin: 0 0 24px; line-height: 1.5; }
.login-err   {
	font-size: 13px;
	color: var(--danger);
	background: rgba(239,68,68,0.1);
	border: 1px solid rgba(239,68,68,0.2);
	border-radius: 10px;
	padding: 10px 14px;
	margin-bottom: 12px;
	text-align: left;
}

/* ── App shell ── */
.app-shell {
	display: flex;
	flex-direction: column;
	min-height: 100dvh;
}

/* ── Header ── */
.app-header {
	position: sticky;
	top: 0;
	z-index: 50;
	background: rgba(15,23,42,0.85);
	backdrop-filter: blur(20px);
	border-bottom: 1px solid var(--line);
}
.header-inner {
	max-width: 600px;
	margin: 0 auto;
	padding: 0 16px;
	height: 56px;
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.header-brand {
	display: flex;
	align-items: center;
	gap: 8px;
	text-decoration: none;
}
.brand-icon  { font-size: 22px; }
.brand-name  { font-size: 16px; font-weight: 700; color: var(--text); }
.header-right {
	display: flex;
	align-items: center;
	gap: 10px;
}
.header-err   { font-size: 18px; cursor: default; }
.header-avatar-btn {
	padding: 0;
	border: none;
	background: transparent;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 9999px;
}
.header-avatar {
	width: 32px;
	height: 32px;
	border-radius: 9999px;
	object-fit: cover;
	border: 2px solid var(--line);
	transition: border-color 0.2s;
}
.header-avatar-btn:hover .header-avatar { border-color: var(--primary); }

/* ── Main ── */
.app-main {
	flex: 1;
	max-width: 600px;
	width: 100%;
	margin: 0 auto;
	padding: 20px 16px 100px;
}

/* ── Tab bar ── */
.tab-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	z-index: 50;
	background: rgba(15,23,42,0.92);
	backdrop-filter: blur(20px);
	border-top: 1px solid var(--line);
	display: flex;
	align-items: flex-end;
	justify-content: space-around;
	padding: 8px 8px 24px;
}
.tab-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 3px;
	padding: 4px 16px;
	text-decoration: none;
	color: var(--text-muted);
	transition: color 0.15s;
	border-radius: 12px;
}
.tab-item[aria-current="page"] { color: var(--primary); }
.tab-item:not([aria-current="page"]):hover { color: var(--text); }
.tab-label { font-size: 10px; font-weight: 600; }

/* Center NFC coin button */
.tab-coin {
	width: 56px;
	height: 56px;
	border-radius: 9999px;
	background: linear-gradient(135deg, var(--primary), var(--violet));
	box-shadow: 0 8px 24px rgba(59,130,246,0.5), 0 0 0 4px var(--bg);
	display: flex;
	align-items: center;
	justify-content: center;
	color: #fff;
	text-decoration: none;
	margin-top: -20px;
	transition: transform 0.2s, box-shadow 0.2s;
}
.tab-coin:hover  { transform: scale(1.08); }
.tab-coin:active { transform: scale(0.95); }
.tab-coin[aria-current="page"] {
	box-shadow: 0 8px 30px rgba(34,211,238,0.6), 0 0 0 4px var(--bg);
	background: linear-gradient(135deg, var(--neon), var(--primary));
}
</style>
