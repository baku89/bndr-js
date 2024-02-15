import {defineClientConfig} from '@vuepress/client'
import Sandbox from '../components/Sandbox.vue'

export default defineClientConfig({
	enhance({app}) {
		// app.component('Example', Example)
		app.component('Sandbox', Sandbox)
	},
})
