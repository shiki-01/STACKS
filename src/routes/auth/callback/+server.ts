import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import { createSessionId, setSession } from '$lib/server/session';
import type { RequestHandler } from '@sveltejs/kit';

interface TokenResponse {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	error?: string;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	if (!code) redirect(302, '/settings');

	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: GOOGLE_CLIENT_ID,
			client_secret: GOOGLE_CLIENT_SECRET,
			redirect_uri: GOOGLE_REDIRECT_URI,
			grant_type: 'authorization_code'
		})
	});

	if (!res.ok) redirect(302, '/settings');
	const data: TokenResponse = await res.json();
	if (data.error || !data.refresh_token) redirect(302, '/settings');

	const sessionId = createSessionId();
	setSession(sessionId, {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresAt: Date.now() + data.expires_in * 1000
	});

	cookies.set('stacks_session', sessionId, {
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 365 // 1年
	});

	redirect(302, '/');
};
