/**
 * サーバー側の回転イベントリレー。
 * POST /api/rotation で受け取った値を SSE ストリームにブロードキャストする。
 */

import { EventEmitter } from 'events';

export interface RotationEvent {
	delta: number;
}

export const rotationEmitter = new EventEmitter();
rotationEmitter.setMaxListeners(100); // 複数ブラウザタブへの配信を想定
