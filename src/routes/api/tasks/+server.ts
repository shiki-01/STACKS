import { json, error } from '@sveltejs/kit';
import { listTasks } from '$lib/server/googleTasks';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.sessionId || !locals.isAuthenticated) {
		error(401, 'Not authenticated');
	}
	const tasks = await listTasks(locals.sessionId);
	return json(tasks);
};
