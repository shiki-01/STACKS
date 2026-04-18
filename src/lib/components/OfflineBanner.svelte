<script lang="ts">
	import { onMount } from 'svelte';

	let isOffline = $state(false);

	onMount(() => {
		isOffline = !navigator.onLine;

		const goOffline = () => (isOffline = true);
		const goOnline = () => (isOffline = false);

		window.addEventListener('offline', goOffline);
		window.addEventListener('online', goOnline);

		return () => {
			window.removeEventListener('offline', goOffline);
			window.removeEventListener('online', goOnline);
		};
	});
</script>

{#if isOffline}
	<div
		class="fixed top:0 left:0 right:0 z:100 bg:yellow-400 color:yellow-900
			   text:center font:sm font:semibold py:2 px:4"
		role="alert"
	>
		オフラインです — キャッシュされたデータを表示しています
	</div>
{/if}
