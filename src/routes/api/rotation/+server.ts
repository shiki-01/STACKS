/**
 * POST /api/rotation  — ラズパイ側スクリプトから回転値を受け取る
 * GET  /api/rotation  — ブラウザへ SSE ストリームで転送する
 *
 * POST ボディ (JSON):
 *   { "delta": <number> }           — 回転差分 (度)。正=時計回り
 *   { "delta": 0, "click": true }   — ボタン押下
 *   { "click": true }               — ボタン押下のみ
 */

import { json, error } from '@sveltejs/kit';
import { rotationEmitter } from '$lib/server/rotationEvents';
import type { RequestHandler } from './$types';

// ---------- POST: RPi → Server ----------

export const POST: RequestHandler = async ({ request }) => {
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON');
	}

	const delta = typeof body.delta === 'number' ? body.delta : 0;
	const click = body.click === true;

	if (delta !== 0) {
		rotationEmitter.emit('rotation', { delta });
	}
	if (click) {
		rotationEmitter.emit('click');
	}

	return json({ ok: true });
};

// ---------- GET: Server → Browser (SSE) ----------

export const GET: RequestHandler = () => {
	const encoder = new TextEncoder();

	let cleanup: (() => void) | null = null;

	const stream = new ReadableStream({
		start(controller) {
			// keepalive コメントを 20秒ごとに送って接続を維持
			const keepalive = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(': keepalive\n\n'));
				} catch {
					clearInterval(keepalive);
				}
			}, 20_000);

			const onRotation = (data: { delta: number }) => {
				try {
					controller.enqueue(
						encoder.encode(`event: rotation\ndata: ${JSON.stringify(data)}\n\n`)
					);
				} catch {
					/* stream closed */
				}
			};

			const onClick = () => {
				try {
					controller.enqueue(encoder.encode('event: click\ndata: {}\n\n'));
				} catch {
					/* stream closed */
				}
			};

			rotationEmitter.on('rotation', onRotation);
			rotationEmitter.on('click', onClick);

			cleanup = () => {
				clearInterval(keepalive);
				rotationEmitter.off('rotation', onRotation);
				rotationEmitter.off('click', onClick);
			};
		},
		cancel() {
			cleanup?.();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
