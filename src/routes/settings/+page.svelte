<script lang="ts">
	import { currentUser } from '$lib/stores';
	import { signOutUser } from '$lib/firebase';
	import { isNFCSupported } from '$lib/nfc';

	let signingOut = $state(false);

	async function handleSignOut() {
		signingOut = true;
		try {
			await signOutUser();
		} finally {
			signingOut = false;
		}
	}

	// ローカル設定（localStorage）
	function getPref(key: string, def: string) {
		if (typeof localStorage === 'undefined') return def;
		return localStorage.getItem(key) ?? def;
	}
	function setPref(key: string, val: string) {
		if (typeof localStorage !== 'undefined') localStorage.setItem(key, val);
	}

	let soundEnabled   = $state(getPref('pref_sound', 'true') === 'true');
	let vibEnabled     = $state(getPref('pref_vib', 'true') === 'true');
	let autoNav        = $state(getPref('pref_autonav', 'true') === 'true');

	$effect(() => { setPref('pref_sound', String(soundEnabled)); });
	$effect(() => { setPref('pref_vib', String(vibEnabled)); });
	$effect(() => { setPref('pref_autonav', String(autoNav)); });
</script>

<div class="settings-page">
	<!-- プロフィールカード -->
	{#if $currentUser}
		<div class="profile-card card">
			<img
				src={$currentUser.photoURL ?? ''}
				alt="avatar"
				class="profile-avatar"
				referrerpolicy="no-referrer"
			/>
			<div class="profile-info">
				<p class="profile-name">{$currentUser.displayName ?? 'ユーザー'}</p>
				<p class="profile-email">{$currentUser.email ?? ''}</p>
			</div>
		</div>
	{/if}

	<!-- NFC & デバイス -->
	<section class="settings-section">
		<p class="section-label">デバイス</p>
		<div class="settings-group card">
			<div class="settings-row">
				<div class="row-info">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="row-icon" style="color:var(--primary)">
						<path d="M4 9c4-4 12-4 16 0M7 12c3-2 7-2 10 0M10 15c1-1 3-1 4 0"/>
						<circle cx="12" cy="18" r="1.3" fill="currentColor" stroke="none"/>
					</svg>
					<span class="row-label">Web NFC</span>
				</div>
				<span class="status-badge" class:status-ok={isNFCSupported} class:status-ng={!isNFCSupported}>
					{isNFCSupported ? '対応' : '非対応'}
				</span>
			</div>
		</div>
	</section>

	<!-- スキャン設定 -->
	<section class="settings-section">
		<p class="section-label">スキャン</p>
		<div class="settings-group card">
			<label class="settings-row toggle-row">
				<div class="row-info">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="row-icon" style="color:var(--success)">
						<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>
					</svg>
					<div>
						<span class="row-label">スキャン音</span>
						<span class="row-sub">タグ検出時に効果音を鳴らす</span>
					</div>
				</div>
				<input type="checkbox" class="toggle" bind:checked={soundEnabled} />
			</label>

			<div class="row-divider"></div>

			<label class="settings-row toggle-row">
				<div class="row-info">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="row-icon" style="color:var(--violet)">
						<path d="M12 18V6M8 10l4-4 4 4M8 14l4 4 4-4"/>
					</svg>
					<div>
						<span class="row-label">バイブレーション</span>
						<span class="row-sub">タグ検出時に振動させる</span>
					</div>
				</div>
				<input type="checkbox" class="toggle" bind:checked={vibEnabled} />
			</label>

			<div class="row-divider"></div>

			<label class="settings-row toggle-row">
				<div class="row-info">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="row-icon" style="color:var(--neon)">
						<path d="M5 12h14M12 5l7 7-7 7"/>
					</svg>
					<div>
						<span class="row-label">自動遷移</span>
						<span class="row-sub">スキャン後にタスク詳細へ自動移動</span>
					</div>
				</div>
				<input type="checkbox" class="toggle" bind:checked={autoNav} />
			</label>
		</div>
	</section>

	<!-- アプリ情報 -->
	<section class="settings-section">
		<p class="section-label">アプリ情報</p>
		<div class="settings-group card">
			<div class="settings-row">
				<div class="row-info">
					<span class="row-label">バージョン</span>
				</div>
				<span class="row-value">1.0.0</span>
			</div>
			<div class="row-divider"></div>
			<div class="settings-row">
				<div class="row-info">
					<span class="row-label">対応環境</span>
				</div>
				<span class="row-value">Android Chrome 89+</span>
			</div>
		</div>
	</section>

	<!-- ログアウト -->
	<button class="signout-btn" onclick={handleSignOut} disabled={signingOut}>
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
		</svg>
		{signingOut ? 'ログアウト中...' : 'ログアウト'}
	</button>
</div>

<style>
.settings-page {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

/* プロフィール */
.profile-card {
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 16px 18px;
}
.profile-avatar {
	width: 52px;
	height: 52px;
	border-radius: 9999px;
	object-fit: cover;
	border: 2px solid var(--line);
}
.profile-info  { display: flex; flex-direction: column; gap: 2px; }
.profile-name  { font-size: 15px; font-weight: 700; color: var(--text); margin: 0; }
.profile-email { font-size: 12px; color: var(--text-muted); margin: 0; }

/* セクション */
.settings-section { display: flex; flex-direction: column; gap: 8px; }
.section-label {
	font-size: 11px;
	font-weight: 700;
	color: var(--text-muted);
	text-transform: uppercase;
	letter-spacing: 1px;
	margin: 0;
	padding: 0 4px;
}

/* グループ */
.settings-group { padding: 0; overflow: hidden; }

/* 行 */
.settings-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px 16px;
	min-height: 52px;
}
.toggle-row { cursor: pointer; }
.toggle-row:hover { background: rgba(255,255,255,0.03); }

.row-info {
	display: flex;
	align-items: center;
	gap: 10px;
	flex: 1;
	min-width: 0;
}
.row-icon  { flex-shrink: 0; }
.row-label { font-size: 14px; font-weight: 500; color: var(--text); display: block; }
.row-sub   { font-size: 11px; color: var(--text-muted); display: block; margin-top: 1px; }
.row-value { font-size: 13px; color: var(--text-muted); white-space: nowrap; }

.row-divider {
	height: 1px;
	background: var(--line);
	margin: 0 16px;
}

/* ステータスバッジ */
.status-badge {
	font-size: 11px;
	font-weight: 700;
	padding: 4px 10px;
	border-radius: 9999px;
}
.status-ok {
	background: rgba(16,185,129,0.15);
	color: var(--success);
	border: 1px solid rgba(16,185,129,0.3);
}
.status-ng {
	background: rgba(239,68,68,0.1);
	color: var(--danger);
	border: 1px solid rgba(239,68,68,0.2);
}

/* トグルスイッチ */
.toggle {
	appearance: none;
	-webkit-appearance: none;
	width: 44px;
	height: 26px;
	border-radius: 9999px;
	background: var(--surface2);
	border: none;
	cursor: pointer;
	position: relative;
	transition: background 0.2s;
	flex-shrink: 0;
}
.toggle::after {
	content: '';
	position: absolute;
	top: 3px;
	left: 3px;
	width: 20px;
	height: 20px;
	border-radius: 9999px;
	background: var(--text-muted);
	transition: transform 0.2s, background 0.2s;
}
.toggle:checked {
	background: var(--primary);
}
.toggle:checked::after {
	transform: translateX(18px);
	background: #fff;
}

/* ログアウトボタン */
.signout-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	width: 100%;
	padding: 14px;
	border-radius: var(--r-card);
	border: 1px solid rgba(239,68,68,0.25);
	background: rgba(239,68,68,0.08);
	color: var(--danger);
	font-size: 14px;
	font-weight: 600;
	font-family: var(--font);
	cursor: pointer;
	transition: background 0.15s;
}
.signout-btn:hover:not(:disabled) { background: rgba(239,68,68,0.15); }
.signout-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
