<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import QRCode from 'qrcode';

	let { data } = $props();

	let canvasEl = $state<HTMLCanvasElement | undefined>();
	let ready = $state(false);

	function escapeWifiValue(val: string): string {
		return val.replace(/\\/g, '\\\\')
			.replace(/;/g, '\\;')
			.replace(/,/g, '\\,')
			.replace(/"/g, '\\"')
			.replace(/:/g, '\\:');
	}

	function buildWifiString(ssid: string, password: string, security: string): string {
		const s = escapeWifiValue(ssid);
		const p = escapeWifiValue(password);
		if (security === 'nopass') {
			return `WIFI:T:nopass;S:${s};;`;
		}
		return `WIFI:T:${security};S:${s};P:${p};;`;
	}

	onMount(async () => {
		if (!data.ssid || !canvasEl) return;
		const wifiString = buildWifiString(data.ssid, data.password, data.security);
		await QRCode.toCanvas(canvasEl, wifiString, {
			width: 220,
			margin: 2,
			color: { dark: '#111111', light: '#f0f0f0' }
		});
		ready = true;
	});
</script>

<div
	class="rel w:full h:full r:full flex flex:column ai:center jc:center bg:base-5 overflow:hidden"
	aria-label="wifi-qr"
>
	<!-- 戻るボタン -->
	<button
		class="abs cursor:pointer"
		style="top: 175px; left: 50%; transform: translateX(-50%); background: transparent; border: none; color: #555; font-size: 0.65rem; letter-spacing: 0.08em; text-transform: uppercase;"
		onclick={() => goto(resolve('/settings'))}
	>
		← 戻る
	</button>

	<span
		class="f:0.6rem fg:base-3 user-select:none letter-spacing:0.08em"
		style="text-transform:uppercase; margin-bottom: 14px;"
	>
		Wi-Fi
	</span>

	<div
		style="
			width: 228px;
			height: 228px;
			border-radius: 16px;
			overflow: hidden;
			display: flex;
			align-items: center;
			justify-content: center;
			background: #f0f0f0;
			position: relative;
			flex-shrink: 0;
		"
	>
		{#if data.ssid}
			<canvas bind:this={canvasEl} style="display: block;"></canvas>
			{#if !ready}
				<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#1a1a1a;border-radius:16px;">
					<span style="color:#555;font-size:0.7rem;">読み込み中…</span>
				</div>
			{/if}
		{:else}
			<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a1a1a;border-radius:16px;gap:8px;padding:16px;text-align:center;">
				<span style="color:#666;font-size:0.65rem;line-height:1.6;">
					WIFI_SSID と<br>WIFI_PASSWORD を<br>.env に設定してください
				</span>
			</div>
		{/if}
	</div>

	{#if data.ssid && ready}
		<span style="color:#555;font-size:0.62rem;margin-top:14px;text-align:center;line-height:1.7;">
			{data.ssid}
		</span>
		<span style="color:#444;font-size:0.58rem;margin-top:4px;text-align:center;line-height:1.7;">
			スマホで QR を読み取り<br>Wi-Fi に接続
		</span>
	{/if}
</div>
