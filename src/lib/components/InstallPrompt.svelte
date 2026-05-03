<script lang="ts">
	import { onMount } from 'svelte';

	// BeforeInstallPromptEvent は標準型定義に含まれないため独自定義
	interface BeforeInstallPromptEvent extends Event {
		prompt(): Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	}

	let deferredPrompt = $state<BeforeInstallPromptEvent | null>(null);
	let dismissed = $state(false);

	onMount(() => {
		const handler = (e: Event) => {
			e.preventDefault();
			deferredPrompt = e as BeforeInstallPromptEvent;
		};
		window.addEventListener('beforeinstallprompt', handler);
		return () => window.removeEventListener('beforeinstallprompt', handler);
	});

	async function install() {
		if (!deferredPrompt) return;
		await deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === 'accepted') {
			deferredPrompt = null;
		}
	}

	function dismiss() {
		dismissed = true;
		deferredPrompt = null;
	}
</script>

{#if deferredPrompt && !dismissed}
	<div
		class="fixed bottom:20 left:4 right:4 max-w:sm mx:auto
			   bg:white r:2xl shadow:2xl p:4 flex align-items:center gap:3 z:90"
		role="complementary"
	>
		<span class="font:2xl">🪙</span>
		<div class="flex:1 min-w:0">
			<div class="font:sm font:bold color:gray-800">ホーム画面に追加</div>
			<div class="font:xs color:gray-500">オフラインでも使えます</div>
		</div>
		<div class="flex gap:2">
			<button
				onclick={install}
				class="px:3 py:1.5 bg:blue-500 color:white r:lg font:sm font:bold border:none ~bg:blue-600:hover"
			>
				追加
			</button>
			<button
				onclick={dismiss}
				class="px:3 py:1.5 bg:gray-100 color:gray-600 r:lg font:sm border:none ~bg:gray-200:hover"
			>
				後で
			</button>
		</div>
	</div>
{/if}
