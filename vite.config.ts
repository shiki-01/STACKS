import { sveltekit } from '@sveltejs/kit/vite';
import masterCSS from '@master/css.vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
	const useHttps = mode === 'https';

	return {
		plugins: [sveltekit(), ...(useHttps ? [basicSsl()] : []), masterCSS()],
		server: {
			host: true,
			port: process.env.PORT ? Number(process.env.PORT) : undefined,
			https: useHttps ? {} : undefined,
			fs: {
				allow: [
					'..',
					'../..',
					'.claude',
					'./master.css.ts'
				]
			}
		}
	};
});
