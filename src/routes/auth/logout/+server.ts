import { redirect } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/session';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ cookies, locals }) => {
	if (locals.sessionId) {
		deleteSession(locals.sessionId);
		cookies.delete('stacks_session', { path: '/' });
	}
	redirect(302, '/settings');
};
