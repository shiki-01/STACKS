import { json, error } from '@sveltejs/kit';
import { completeTask, deleteTask } from '$lib/server/googleTasks';
import type { RequestHandler } from '@sveltejs/kit';

export const PATCH: RequestHandler = async ({ params, locals }) => {
	if (!locals.sessionId || !locals.isAuthenticated) error(401, 'Not authenticated');
	const ok = await completeTask(locals.sessionId, params.id!);
	if (!ok) error(500, 'Failed to complete task');
	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.sessionId || !locals.isAuthenticated) error(401, 'Not authenticated');
	const ok = await deleteTask(locals.sessionId, params.id!);
	if (!ok) error(500, 'Failed to delete task');
	return new Response(null, { status: 204 });
};
