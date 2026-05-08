import { writable } from 'svelte/store';

export type Locale = 'ja' | 'en' | 'zh-Hans' | 'zh-Hant' | 'de' | 'es' | 'fr';

export interface LocaleInfo {
	code: Locale;
	label: string;      // native name
	shortLabel: string; // compact code for buttons
}

export const LOCALES: LocaleInfo[] = [
	{ code: 'ja',      label: '日本語',    shortLabel: 'JA' },
	{ code: 'en',      label: 'English',   shortLabel: 'EN' },
	{ code: 'zh-Hans', label: '中文(简体)', shortLabel: '简' },
	{ code: 'zh-Hant', label: '中文(繁體)', shortLabel: '繁' },
	{ code: 'de',      label: 'Deutsch',   shortLabel: 'DE' },
	{ code: 'es',      label: 'Español',   shortLabel: 'ES' },
	{ code: 'fr',      label: 'Français',  shortLabel: 'FR' },
];

// Locale -> raw JSON string of task presets added by the user
export type LangFiles = Partial<Record<Locale, string>>;

const LOCALE_KEY    = 'stacks_locale_v1';
const LANG_FILES_KEY = 'stacks_lang_files_v1';

function loadLocale(): Locale {
	if (typeof window === 'undefined') return 'ja';
	return (localStorage.getItem(LOCALE_KEY) as Locale | null) ?? 'ja';
}

function loadLangFiles(): LangFiles {
	if (typeof window === 'undefined') return {};
	try {
		const raw = localStorage.getItem(LANG_FILES_KEY);
		return raw ? (JSON.parse(raw) as LangFiles) : {};
	} catch {
		return {};
	}
}

export const currentLocale = writable<Locale>(
	typeof window !== 'undefined' ? loadLocale() : 'ja'
);

export const langFiles = writable<LangFiles>(
	typeof window !== 'undefined' ? loadLangFiles() : {}
);

if (typeof window !== 'undefined') {
	currentLocale.subscribe((locale) => localStorage.setItem(LOCALE_KEY, locale));
	langFiles.subscribe((files) =>
		localStorage.setItem(LANG_FILES_KEY, JSON.stringify(files))
	);
}
