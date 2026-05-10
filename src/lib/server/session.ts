import crypto from 'node:crypto';

export interface Session {
	accessToken: string;
	refreshToken: string;
	expiresAt: number; // Unix ms
}

const sessions = new Map<string, Session>();

export function createSessionId(): string {
	return crypto.randomBytes(32).toString('hex');
}

export function getSession(id: string): Session | undefined {
	return sessions.get(id);
}

export function setSession(id: string, session: Session): void {
	sessions.set(id, session);
}

export function deleteSession(id: string): void {
	sessions.delete(id);
}
