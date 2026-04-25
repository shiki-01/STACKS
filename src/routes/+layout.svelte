<script lang="ts">
	import '@master/normal.css';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';

	let { children } = $props();

	const modes = [
		{ href: '/clock', label: 'clock' },
		{ href: '/stack', label: 'stack' },
		{ href: '/table', label: 'table' }
	] as const;

	const isActive = (href: string) =>
		$page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
</script>

<div class="w:100% h:100dvh flex flex:column ai:center jc:center gap:20px bg:#0f0f0f">
	<main class="w:720px h:720px p:80px bg:#4d4d4d r:full flex ai:center jc:center flex-shrink:0">
		<div class="w:100% h:100% bg:#161616 overflow:hidden r:full flex ai:center jc:center rel">
			{@render children?.()}
		</div>
	</main>

	<nav class="flex gap:48 ai:center">
		{#each modes as m, i (i)}
			<a
				href={resolve(m.href)}
				class="flex ai:center jc:center text-decoration:none transition:color|0.2s {isActive(m.href) ? 'color:#cfcfcf' : 'color:#4d4d4d'} hover:color:#888"
				aria-label={m.label}
			>
				{#if m.label === 'clock'}
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
						<circle cx="12" cy="12" r="10" />
						<polyline points="12 6 12 12 16 14" />
					</svg>
				{:else if m.label === 'stack'}
					<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
						<circle cx="8" cy="14" r="5" opacity="0.5" />
						<circle cx="16" cy="15" r="4" opacity="0.7" />
						<circle cx="12" cy="9" r="6" />
					</svg>
				{:else}
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
						<line x1="3" y1="6" x2="21" y2="6" />
						<line x1="3" y1="12" x2="21" y2="12" />
						<line x1="3" y1="18" x2="21" y2="18" />
					</svg>
				{/if}
			</a>
		{/each}
	</nav>
</div>
