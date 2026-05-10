declare global {
	namespace App {
		interface Locals {
			sessionId: string | null;
			isAuthenticated: boolean;
		}
	}
}

export {};
