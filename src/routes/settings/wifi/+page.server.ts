import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		ssid: process.env.WIFI_SSID ?? '',
		password: process.env.WIFI_PASSWORD ?? '',
		security: (process.env.WIFI_SECURITY ?? 'WPA') as 'WPA' | 'WEP' | 'nopass'
	};
};
