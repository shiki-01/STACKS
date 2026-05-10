import type { Handle } from '@sveltejs/kit';
import { getSession } from '$lib/server/session';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('stacks_session') ?? null;
	event.locals.sessionId = sessionId;
	event.locals.isAuthenticated = sessionId ? !!getSession(sessionId) : false;
	return resolve(event);
};
