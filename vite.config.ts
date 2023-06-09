import {resolve} from 'path'
import {defineConfig} from 'vite'
import eslint from 'vite-plugin-eslint'

// https://vitejs.dev/config/
export default defineConfig(() => {
	return {
		root: 'demo',
		base: './',
		plugins: [eslint()],
		resolve: {
			alias: {
				Bndr: resolve(__dirname, 'src'),
			},
		},
	}
})
