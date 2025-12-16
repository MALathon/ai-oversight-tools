import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: true
		}),
		paths: {
			// CI_TEST=true builds without base path for testing with serve
			// NODE_ENV=production builds with base path for GitHub Pages
			base: process.env.CI_TEST ? '' : (process.env.NODE_ENV === 'production' ? '/ai-oversight-tools' : '')
		}
	}
};

export default config;
