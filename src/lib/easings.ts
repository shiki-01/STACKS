import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

// ─── ベジェ制御点 (cubic-bezier: x1, y1, x2, y2) ──────────────────────────────
const BEZIER_EASE_STANDARD = [0.4,  0.0,  0.2,  1.0];  // 標準 S字
// ─────────────────────────────────────────────────────────────────────────────

function toPath([x1, y1, x2, y2]: number[]) {
	return `M0,0 C${x1},${y1} ${x2},${y2} 1,1`;
}

export const EASE_OUT      = 'app-ease-out';
export const EASE_IN       = 'app-ease-in';
export const EASE_STANDARD = 'app-ease-standard';

CustomEase.create(EASE_OUT,'M0,0 C0.086,0.875 0.304,1 1,1');
CustomEase.create(EASE_IN,'M0,0 C0.742,0 0.875,0.322 1,1 ');
CustomEase.create(EASE_STANDARD, toPath(BEZIER_EASE_STANDARD));
