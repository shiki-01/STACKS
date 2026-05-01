import { writable, derived, get } from 'svelte/store';

// --- Type definitions ---
export interface Timestamp {
	toMillis(): number;
}

export interface Task {
	id: string;
	title: string;
	description: string;
	status: 'pending' | 'in_progress' | 'completed' | 'archived';
	priority: 'low' | 'medium' | 'high';
	category: string;
	dueDate?: Timestamp;
	createdAt: Timestamp;
	updatedAt: Timestamp;
	userId: string;
}

// --- User store ---
export const userId = writable<string | null>(null);

// --- Task stores ---
export const tasks = writable<Task[]>([]);
export const appError = writable<string | null>(null);

// Initialize from localStorage
if (typeof window !== 'undefined') {
	const stored = localStorage.getItem('tasks');
	if (stored) {
		try {
			tasks.set(JSON.parse(stored));
		} catch {
			tasks.set([]);
		}
	}
	
	// Subscribe to task changes and persist
	tasks.subscribe((value) => {
		localStorage.setItem('tasks', JSON.stringify(value));
	});
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
			if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q))
				return false;
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
export function loadTasks(userId: string) {
	const stored = localStorage.getItem(`tasks_${userId}`);
	if (stored) {
		try {
			tasks.set(JSON.parse(stored));
		} catch {
			tasks.set([]);
		}
	}
}

export function addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): string {
	appError.set(null);
	try {
		const id = crypto.randomUUID();
		const newTask: Task = {
			...task,
			id,
			createdAt: { toMillis: () => Date.now() },
			updatedAt: { toMillis: () => Date.now() }
		};
		tasks.update((list) => [newTask, ...list]);
		return id;
	} catch (error) {
		appError.set('Failed to add task');
		throw error;
	}
}

export function editTask(taskId: string, updates: Partial<Task>): void {
	appError.set(null);
	try {
		tasks.update((list) =>
			list.map((t) =>
				t.id === taskId
					? {
						...t,
						...updates,
						updatedAt: { toMillis: () => Date.now() }
					}
					: t
			)
		);
	} catch (error) {
		appError.set('Failed to edit task');
		throw error;
	}
}

export function removeTask(taskId: string): void {
	appError.set(null);
	try {
		tasks.update((list) => list.filter((t) => t.id !== taskId));
	} catch (error) {
		appError.set('Failed to remove task');
		throw error;
	}
}

export function completeTask(taskId: string): void {
	editTask(taskId, { status: 'completed' });
}

export function getTaskById(taskId: string): Task | undefined {
	return get(tasks).find((t) => t.id === taskId);
}
