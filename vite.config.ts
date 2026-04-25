import { sveltekit } from '@sveltejs/kit/vite';
import masterCSS from '@master/css.vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
	const useHttps = mode === 'https';

	return {
		plugins: [
			sveltekit(),
			...(useHttps ? [basicSsl()] : []),
			masterCSS(),
			VitePWA({
				registerType: 'autoUpdate',
				manifest: false,
				workbox: {
					globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
					runtimeCaching: [
						{
							urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
							handler: 'NetworkFirst',
							options: {
								cacheName: 'firestore-cache',
								expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }
							}
						}
					]
				},
				devOptions: { enabled: true }
			})
		],
		server: {
			host: true,
			https: useHttps ? {} : undefined,
			fs: {
				allow: ['./master.css.ts']
			}
		}
	};
});
