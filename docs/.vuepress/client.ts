import {defineClientConfig} from '@vuepress/client'
import Mermaid from 'vue-mermaid-string'

import Sandbox from '../components/Sandbox.vue'

export default defineClientConfig({
	enhance({app}) {
		app.component('Sandbox', Sandbox)
		app.component('Mermaid', Mermaid)
	},
})
