import QRCode from 'qrcode';

/**
 * タスクIDをエンコードしたQRコードのDataURLを生成する
 * QRを読んだ側が /task/{taskId} に遷移できるよう、絶対URLを埋め込む
 */
export async function generateTaskQR(taskId: string): Promise<string> {
	const url = `${window.location.origin}/task/${taskId}`;
	return QRCode.toDataURL(url, {
		width: 256,
		margin: 2,
		color: { dark: '#1e3a5f', light: '#ffffff' },
		errorCorrectionLevel: 'M'
	});
}
