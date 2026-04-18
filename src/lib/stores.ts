import { writable, derived, get } from 'svelte/store';
import type { User } from 'firebase/auth';
import {
	onAuthChange,
	completeRedirectSignIn,
	getUserTasks,
	createTask,
	updateTask,
	deleteTask,
	getFirebaseErrorMessage,
	type Task
} from './firebase';

// --- Auth store ---
export const currentUser = writable<User | null>(null);
export const authLoading = writable(true);

// --- Task stores ---
export const tasks = writable<Task[]>([]);
export const tasksLoading = writable(false);
export const appError = writable<string | null>(null);

// ブラウザ側のみ認証リスナーを起動
if (typeof window !== 'undefined') {
	// onAuthStateChanged を先に登録してキャッシュから即時解決させる
	onAuthChange((user) => {
		currentUser.set(user);
		authLoading.set(false);
		if (user) {
			void loadTasks(user.uid);
		} else {
			tasks.set([]);
		}
	});

	// リダイレクトサインインの完了処理は別途非同期で実行
	void (async () => {
		try {
			await completeRedirectSignIn();
		} catch (error) {
			appError.set(getFirebaseErrorMessage(error));
			console.error('completeRedirectSignIn failed:', error);
		}
	})();
}

export const filter = writable<{
	status: 'all' | 'pending' | 'in_progress' | 'completed';
	priority: 'all' | 'low' | 'medium' | 'high';
	category: string;
	search: string;
}>({
	status: 'all',
	priority: 'all',
	category: '',
	search: ''
});

export const sortBy = writable<'dueDate' | 'priority' | 'createdAt'>('createdAt');

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export const filteredTasks = derived([tasks, filter, sortBy], ([$tasks, $filter, $sortBy]) => {
	let result = $tasks.filter((t) => {
		if ($filter.status !== 'all' && t.status !== $filter.status) return false;
		if ($filter.priority !== 'all' && t.priority !== $filter.priority) return false;
		if ($filter.category && t.category !== $filter.category) return false;
		if ($filter.search) {
			const q = $filter.search.toLowerCase();
			if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
		}
		return true;
	});

	result = [...result].sort((a, b) => {
		if ($sortBy === 'priority') {
			return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
		}
		if ($sortBy === 'dueDate') {
			const da = a.dueDate?.toMillis() ?? Infinity;
			const db = b.dueDate?.toMillis() ?? Infinity;
			return da - db;
		}
		// createdAt
		const ca = a.createdAt?.toMillis() ?? 0;
		const cb = b.createdAt?.toMillis() ?? 0;
		return cb - ca;
	});

	return result;
});

export const todayTasks = derived(tasks, ($tasks) => {
	const now = new Date();
	const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	const endOfDay = startOfDay + 86_400_000;
	return $tasks.filter((t) => {
		if (t.status === 'completed' || t.status === 'archived') return false;
		const ms = t.dueDate?.toMillis();
		if (!ms) return false;
		return ms >= startOfDay && ms < endOfDay;
	});
});

export const completionRate = derived(tasks, ($tasks) => {
	const active = $tasks.filter((t) => t.status !== 'archived');
	if (!active.length) return 0;
	const done = active.filter((t) => t.status === 'completed').length;
	return Math.round((done / active.length) * 100);
});

// --- Actions ---
export async function loadTasks(userId: string) {
	tasksLoading.set(true);
	appError.set(null);
	try {
		const list = await getUserTasks(userId);
		tasks.set(list);
	} catch (error) {
		tasks.set([]);
		appError.set(getFirebaseErrorMessage(error));
		console.error('loadTasks failed:', error);
	} finally {
		tasksLoading.set(false);
	}
}

export async function addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
	appError.set(null);
	try {
		const id = await createTask(task);
		const newTask: Task = { ...task, id };
		tasks.update((list) => [newTask, ...list]);
		return id;
	} catch (error) {
		appError.set(getFirebaseErrorMessage(error));
		throw error;
	}
}

export async function editTask(taskId: string, updates: Partial<Task>): Promise<void> {
	appError.set(null);
	try {
		await updateTask(taskId, updates);
		tasks.update((list) => list.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
	} catch (error) {
		appError.set(getFirebaseErrorMessage(error));
		throw error;
	}
}

export async function removeTask(taskId: string): Promise<void> {
	appError.set(null);
	try {
		await deleteTask(taskId);
		tasks.update((list) => list.filter((t) => t.id !== taskId));
	} catch (error) {
		appError.set(getFirebaseErrorMessage(error));
		throw error;
	}
}

export async function completeTask(taskId: string): Promise<void> {
	await editTask(taskId, { status: 'completed' });
}

export function getTaskById(taskId: string): Task | undefined {
	return get(tasks).find((t) => t.id === taskId);
}
