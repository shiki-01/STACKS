// Web NFC API ラッパー
// Chrome 89+ (Android) でのみ動作。iOS Safari は未対応。

export const isNFCSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

export type NFCEvent =
	| { type: 'read'; taskId: string; serialNumber: string }
	| { type: 'write_success' }
	| { type: 'error'; message: string };

/**
 * NFCタグを読み取り、埋め込まれた taskId を返す
 * @param onEvent コールバック関数
 * @returns 読み取りを停止する関数
 */
export async function startNFCRead(
	onEvent: (event: NFCEvent) => void
): Promise<() => void> {
	if (!isNFCSupported) {
		onEvent({ type: 'error', message: 'このデバイスはWeb NFCに対応していません' });
		return () => {};
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const reader = new (window as any).NDEFReader();
	const controller = new AbortController();

	try {
		await reader.scan({ signal: controller.signal });

		reader.addEventListener(
			'reading',
			({ message, serialNumber }: { message: { records: { recordType: string; encoding?: string; data: DataView }[] }; serialNumber: string }) => {
				for (const record of message.records) {
					if (record.recordType === 'text') {
						const decoder = new TextDecoder(record.encoding ?? 'utf-8');
						const text = decoder.decode(record.data);
						// フォーマット: "nfc-task-coin:taskId"
						if (text.startsWith('nfc-task-coin:')) {
							const taskId = text.replace('nfc-task-coin:', '');
							onEvent({ type: 'read', taskId, serialNumber });
							// フィードバック
							vibrate([100, 50, 100]);
							return;
						}
					}
				}
				onEvent({ type: 'error', message: 'このタグにはタスクが登録されていません' });
			}
		);

		reader.addEventListener('readingerror', () => {
			onEvent({ type: 'error', message: 'NFCタグの読み取りに失敗しました' });
		});
	} catch (err) {
		if ((err as Error).name !== 'AbortError') {
			onEvent({ type: 'error', message: `NFC読み取りエラー: ${(err as Error).message}` });
		}
	}

	return () => controller.abort();
}

/**
 * NFCタグに taskId を書き込む
 */
export async function writeNFCTag(taskId: string): Promise<void> {
	if (!isNFCSupported) {
		throw new Error('このデバイスはWeb NFCに対応していません');
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const writer = new (window as any).NDEFReader();
	await writer.write({
		records: [
			{
				recordType: 'text',
				data: `nfc-task-coin:${taskId}`,
				lang: 'ja'
			}
		]
	});

	vibrate([200]);
}

/**
 * 振動フィードバック (Web Vibration API)
 */
function vibrate(pattern: number[]) {
	if (typeof navigator !== 'undefined' && navigator.vibrate) {
		navigator.vibrate(pattern);
	}
}

/**
 * 成功音を鳴らす (Web Audio API)
 */
export function playSuccessSound() {
	if (typeof window === 'undefined') return;
	const ctx = new AudioContext();
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.connect(gain);
	gain.connect(ctx.destination);
	osc.type = 'sine';
	osc.frequency.setValueAtTime(880, ctx.currentTime);
	osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
	gain.gain.setValueAtTime(0.3, ctx.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
	osc.start(ctx.currentTime);
	osc.stop(ctx.currentTime + 0.4);
}
