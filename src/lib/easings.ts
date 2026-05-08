import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

export const EASE_OUT      = 'app-ease-out';
export const EASE_IN       = 'app-ease-in';
export const EASE_STANDARD = 'app-ease-standard';

CustomEase.create(EASE_OUT,      'M0,0 C0.086,0.875 0.304,1 1,1');
CustomEase.create(EASE_IN,       'M0,0 C0.742,0 0.875,0.322 1,1');
CustomEase.create(EASE_STANDARD, 'M0,0 C0.4,0.0 0.2,1.0 1,1');
