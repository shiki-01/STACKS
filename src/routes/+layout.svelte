<script lang="ts">
	import '@master/normal.css';
	let { children } = $props();
</script>

<div class="w:100% h:100dvh flex ai:center jc:center">
	<main class="w:720px h:720px p:60px bg:#4D4D4D r:full flex ai:center jc:center">
		<div class="w:100% h:100% bg:#161616 overflow:hidden r:full flex ai:center jc:center">
            {@render children?.()}
        </div>
	</main>
</div>
