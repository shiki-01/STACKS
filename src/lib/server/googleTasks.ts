import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { getSession, setSession } from './session';
import type { LocalTask } from '$lib/localTasks';

interface GoogleTask {
	id: string;
	title: string;
	notes?: string;
	due?: string;
	status: 'needsAction' | 'completed';
	updated: string;
}

interface TokenResponse {
	access_token: string;
	expires_in: number;
}

async function refreshAccessToken(sessionId: string, refreshToken: string): Promise<string | null> {
	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: GOOGLE_CLIENT_ID,
			client_secret: GOOGLE_CLIENT_SECRET,
			refresh_token: refreshToken,
			grant_type: 'refresh_token'
		})
	});
	if (!res.ok) return null;
	const data: TokenResponse = await res.json();
	const session = getSession(sessionId);
	if (session) {
		setSession(sessionId, {
			...session,
			accessToken: data.access_token,
			expiresAt: Date.now() + data.expires_in * 1000
		});
	}
	return data.access_token;
}

async function getValidToken(sessionId: string): Promise<string | null> {
	const session = getSession(sessionId);
	if (!session) return null;
	// 1分の余裕を持ってリフレッシュ
	if (Date.now() < session.expiresAt - 60_000) return session.accessToken;
	return refreshAccessToken(sessionId, session.refreshToken);
}

function googleTaskToLocal(g: GoogleTask): LocalTask {
	const now = new Date();
	return {
		id: g.id,
		title: g.title ?? '',
		description: g.notes ?? '',
		dueDate: g.due ? new Date(g.due) : null,
		priority: 'medium',
		category: '',
		status: g.status === 'completed' ? 'completed' : 'pending',
		subtasks: [],
		createdAt: now,
		updatedAt: new Date(g.updated)
	};
}

export async function listTasks(sessionId: string): Promise<LocalTask[]> {
	const token = await getValidToken(sessionId);
	if (!token) return [];
	const res = await fetch(
		'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=false&maxResults=100',
		{ headers: { Authorization: `Bearer ${token}` } }
	);
	if (!res.ok) return [];
	const data = await res.json();
	return ((data.items ?? []) as GoogleTask[]).map(googleTaskToLocal);
}

export async function completeTask(sessionId: string, taskId: string): Promise<boolean> {
	const token = await getValidToken(sessionId);
	if (!token) return false;
	const res = await fetch(
		`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${encodeURIComponent(taskId)}`,
		{
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ status: 'completed' })
		}
	);
	return res.ok;
}

export async function deleteTask(sessionId: string, taskId: string): Promise<boolean> {
	const token = await getValidToken(sessionId);
	if (!token) return false;
	const res = await fetch(
		`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${encodeURIComponent(taskId)}`,
		{
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` }
		}
	);
	return res.ok || res.status === 204;
}
