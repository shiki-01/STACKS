import type { Locale } from './languageStore';

export interface Strings {
	settings: string;
	taskJson: string;
	langFiles: string;
	close: string;
	apply: string;
	save: string;
	arrayRequired: string;
	urgent: string;
	normal: string;
	relaxed: string;
	dueNone: string;
	overdue: string;
	today: string;
	tomorrow: string;
	daysLater: (n: number) => string;
	language: string;
	noLangFile: string;
	langFileLoaded: string;
}

const translations: Record<Locale, Strings> = {
	ja: {
		settings: '設定',
		taskJson: 'タスク JSON',
		langFiles: '言語ファイル',
		close: '閉じる',
		apply: '適用',
		save: '保存',
		arrayRequired: '配列が必要です',
		urgent: '緊急',
		normal: '普通',
		relaxed: '余裕',
		dueNone: '期限なし',
		overdue: '期限切れ',
		today: '今日',
		tomorrow: '明日',
		daysLater: (n) => `${n}日後`,
		language: '言語',
		noLangFile: 'ファイル未登録',
		langFileLoaded: '読み込み済み',
	},
	en: {
		settings: 'Settings',
		taskJson: 'Task JSON',
		langFiles: 'Language Files',
		close: 'Close',
		apply: 'Apply',
		save: 'Save',
		arrayRequired: 'Array required',
		urgent: 'Urgent',
		normal: 'Normal',
		relaxed: 'Relaxed',
		dueNone: 'No deadline',
		overdue: 'Overdue',
		today: 'Today',
		tomorrow: 'Tomorrow',
		daysLater: (n) => `In ${n} day${n === 1 ? '' : 's'}`,
		language: 'Language',
		noLangFile: 'No file for this language yet',
		langFileLoaded: 'Loaded',
	},
	'zh-Hans': {
		settings: '设置',
		taskJson: '任务 JSON',
		langFiles: '语言文件',
		close: '关闭',
		apply: '应用',
		save: '保存',
		arrayRequired: '需要数组',
		urgent: '紧急',
		normal: '普通',
		relaxed: '充裕',
		dueNone: '无期限',
		overdue: '已过期',
		today: '今天',
		tomorrow: '明天',
		daysLater: (n) => `${n}天后`,
		language: '语言',
		noLangFile: '尚未添加此语言的文件',
		langFileLoaded: '已加载',
	},
	'zh-Hant': {
		settings: '設置',
		taskJson: '任務 JSON',
		langFiles: '語言文件',
		close: '關閉',
		apply: '套用',
		save: '儲存',
		arrayRequired: '需要陣列',
		urgent: '緊急',
		normal: '普通',
		relaxed: '充裕',
		dueNone: '無期限',
		overdue: '已逾期',
		today: '今天',
		tomorrow: '明天',
		daysLater: (n) => `${n}天後`,
		language: '語言',
		noLangFile: '尚未新增此語言的檔案',
		langFileLoaded: '已載入',
	},
	de: {
		settings: 'Einstellungen',
		taskJson: 'Aufgaben JSON',
		langFiles: 'Sprachdateien',
		close: 'Schließen',
		apply: 'Anwenden',
		save: 'Speichern',
		arrayRequired: 'Array erforderlich',
		urgent: 'Dringend',
		normal: 'Normal',
		relaxed: 'Entspannt',
		dueNone: 'Keine Frist',
		overdue: 'Überfällig',
		today: 'Heute',
		tomorrow: 'Morgen',
		daysLater: (n) => `In ${n} Tag${n === 1 ? '' : 'en'}`,
		language: 'Sprache',
		noLangFile: 'Noch keine Datei für diese Sprache',
		langFileLoaded: 'Geladen',
	},
	es: {
		settings: 'Configuración',
		taskJson: 'Tareas JSON',
		langFiles: 'Archivos de idioma',
		close: 'Cerrar',
		apply: 'Aplicar',
		save: 'Guardar',
		arrayRequired: 'Se requiere array',
		urgent: 'Urgente',
		normal: 'Normal',
		relaxed: 'Relajado',
		dueNone: 'Sin fecha límite',
		overdue: 'Vencido',
		today: 'Hoy',
		tomorrow: 'Mañana',
		daysLater: (n) => `En ${n} día${n === 1 ? '' : 's'}`,
		language: 'Idioma',
		noLangFile: 'Sin archivo para este idioma aún',
		langFileLoaded: 'Cargado',
	},
	fr: {
		settings: 'Paramètres',
		taskJson: 'Tâches JSON',
		langFiles: 'Fichiers de langue',
		close: 'Fermer',
		apply: 'Appliquer',
		save: 'Enregistrer',
		arrayRequired: 'Tableau requis',
		urgent: 'Urgent',
		normal: 'Normal',
		relaxed: 'Détendu',
		dueNone: 'Pas de date limite',
		overdue: 'En retard',
		today: "Aujourd'hui",
		tomorrow: 'Demain',
		daysLater: (n) => `Dans ${n} jour${n === 1 ? '' : 's'}`,
		language: 'Langue',
		noLangFile: 'Pas encore de fichier pour cette langue',
		langFileLoaded: 'Chargé',
	},
};

export function t(locale: Locale): Strings {
	return translations[locale] ?? translations.ja;
}
