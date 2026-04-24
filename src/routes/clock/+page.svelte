<script lang="ts">
	import { onMount } from 'svelte';

	let now = $state(new Date());
	let frameId: number | undefined;

	onMount(() => {
		const tick = () => {
			now = new Date();
			frameId = requestAnimationFrame(tick);
		};
		frameId = requestAnimationFrame(tick);

		return () => {
			if (frameId !== undefined) {
				cancelAnimationFrame(frameId);
			}
		};
	});

	const h = $derived(now.getHours());
	const m = $derived(now.getMinutes());
	const s = $derived(now.getSeconds());
	const ms = $derived(now.getMilliseconds());
	const y = $derived(now.getFullYear());
	const mo = $derived(now.getMonth() + 1);
	const d = $derived(now.getDate());
	const wd = $derived(now.getDay());
	const h12 = $derived(h % 12 || 12);
	const hh = $derived(String(h).padStart(2, '0'));
	const mm = $derived(String(m).padStart(2, '0'));
	const ss = $derived(String(s).padStart(2, '0'));
	const mmo = $derived(String(mo).padStart(2, '0'));
	const dd = $derived(String(d).padStart(2, '0'));
	const week = ['日', '月', '火', '水', '木', '金', '土'];

	const secondDeg = $derived(((s + ms / 1000) / 60) * 360);
	const minuteDeg = $derived(
		((m + s / 60 + ms / 60000) / 60) * 360
	);
	const hourDeg = $derived(
		(((h % 12) + m / 60 + s / 3600) / 12) * 360
	);
	const numerals = Array.from({ length: 12 }, (_, i) => i + 1);
</script>

<div class="rel w:100% h:100% r:full bg:#2F2F2F" aria-label="analog clock">
	{#each numerals as n (n)}
		<div class="numeral abs top:50% left:50% grid place-items:center f:2rem font-weight:700 user-select:none {h12 === n ? 'color:#eee' : 'color:#424242'}" style={`--angle: ${n * 30}deg;`}>
			{n}
		</div>
	{/each}
	<div class="hand w:8px h:200px" style={`--hand-color: #F1F1F1; transform: translateX(-50%) rotate(${hourDeg}deg);`}></div>
	<div class="hand w:8px h:200px" style={`--hand-color: #878787; transform: translateX(-50%) rotate(${minuteDeg}deg);`}></div>
	<div class="hand w:6px h:200px" style={`--hand-color: #4E4E4E; transform: translateX(-50%) rotate(${secondDeg}deg);`}></div>

	<div class="abs top:50% left:50% w:240px h:240px translate(-50%,-50%) r:full bg:#161616 z:2 flex flex:column ai:center jc:center color:#CFCFCF f:1.25rem font:600">
		<span class="f:1rem">{hh}:{mm}:{ss}</span>
		<span class="f:1rem">{y}/{mmo}/{dd} ({week[wd]})</span>
	</div>
</div>

<style>
	.numeral {
		transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-240px) rotate(calc(-1 * var(--angle)));
	}

	.hand {
		position: absolute;
		left: 50%;
		bottom: 50%;
		transform-origin: 50% 100%;
		--center-gap: 140px;
	}

	.hand::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: var(--center-gap);
		border-radius: 999px;
		background: var(--hand-color);
	}
</style>
