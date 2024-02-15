<script lang="ts" setup>
import {useEventListener, useLocalStorage} from '@vueuse/core'
import {mat2d, scalar, vec2} from 'linearly'
import saferEval from 'safer-eval'
import {computed, onMounted, watch} from 'vue'

import Editor from './Editor.vue'
import Examples from './examples'

let sketch: any

useEventListener(
	'touchmove',
	e => {
		e.preventDefault()
	},
	{passive: false}
)

// Initialize p5.js
onMounted(async () => {
	const p5 = (await import('p5')).default

	const Bndr = await import('bndr-js')

	new p5(p => {
		p.setup = () => {
			p.createCanvas(window.innerWidth, window.innerHeight)
			p.noLoop()
		}
		p.draw = () => {
			sketch = p
		}
	}, 'canvas' as any)

	watch(
		code,
		(code = '') => {
			const context = {
				Bndr,
				p: sketch,
				scalar,
				vec2,
				mat2d,
				document,
				window,
			}
			sketch.clear()
			sketch.resetMatrix()
			sketch.pop()
			sketch.push()
			Bndr.disposeAllEmitters()
			saferEval(`(() => {${code}\n})()`, context)
		},
		{immediate: true}
	)
})

useEventListener('resize', () => {
	sketch.canvas.width = window.innerWidth
	sketch.canvas.height = window.innerHeight
	sketch.resizeCanvas(window.innerWidth, window.innerHeight)
})

const code = useLocalStorage(
	'com.baku89.bndr-js.playground.code',
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	Examples.get('Pointer')!
)

if (code.value === '') {
	code.value = Examples.get('Pointer')
}

function onSelectExample(e: Event) {
	const target = e.target as HTMLSelectElement
	const name = target.value
	code.value = Examples.get(name)
}

const currentExample = computed(() => {
	for (const [name, c] of Examples) {
		if (c === code.value) {
			return name
		}
	}
	return ''
})
</script>

<template>
	<div class="Sandbox">
		<select class="select" :value="currentExample" @input="onSelectExample">
			<option v-for="name in Examples.keys()" :key="name" :value="name">
				{{ name }}
			</option>
		</select>
		<div class="editor-wrapper">
			<Editor v-model:code="code" class="editor" />
		</div>
	</div>
	<div id="canvas" />
</template>

<style scoped lang="stylus">
.Sandbox
	position: fixed;
	margin-top: 2rem;
	left: 2rem;
	width: min(100%, 40em);
	z-index 10;
	display: flex;
	flex-direction: column;
	gap: 1rem;
	align-items: flex-start;

.select
	font-family: inherit;
	font-size: inherit;
	height: 2em;
	border-radius: 5px;
	border: 1px solid var(--c-border);
	padding-left: 0.5em;
	padding-right: 0.5em;
	background: var(--c-bg);

.editor-wrapper {
	width: calc(100% - 2em);
	height: min(70vh, 40em);
	padding: 1em;
	border-radius: 10px;
	border: 1px solid var(--c-border);
	background: 'color-mix(in srgb, var(--c-bg) 50%, transparent)' % null;
	backdrop-filter: blur(10px);
}

.editor
	position: relative;

#canvas
	position: fixed;
	top: 0;
	left: 0;
</style>
