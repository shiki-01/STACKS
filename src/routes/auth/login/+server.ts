import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } from '$env/static/private';
import { redirect } from '@sveltejs/kit';

export function GET(): never {
	const params = new URLSearchParams({
		client_id: GOOGLE_CLIENT_ID,
		redirect_uri: GOOGLE_REDIRECT_URI,
		response_type: 'code',
		scope: 'https://www.googleapis.com/auth/tasks',
		access_type: 'offline',
		prompt: 'consent'
	});
	redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
