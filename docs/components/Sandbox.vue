<script lang="ts" setup>
import {useEventListener, useLocalStorage} from '@vueuse/core'
import {mat2d, scalar, vec2} from 'linearly'
import * as rxjs from 'rxjs'
import {Subscription} from 'rxjs'
import saferEval from 'safer-eval'
import {computed, onMounted, watch} from 'vue'

import Editor from './Editor.vue'
import Examples from './examples'

let sketch: any
let bag: Subscription | null = null

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

	const RxIO = await import('rxio')
	const Operators = await import('rxio/operators')
	const Combinators = await import('rxio/combinators')

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
			sketch.clear()
			sketch.resetMatrix()
			sketch.pop()
			sketch.push()

			// Cancel all subscriptions from the previous run.
			bag?.unsubscribe()
			bag = new Subscription()

			const subscribe = <T,>(obs: rxjs.Observable<T>, fn: (v: T) => void) => {
				const s = obs.subscribe(fn)
				bag!.add(s)
				return s
			}

			const context = {
				...RxIO,
				...Operators,
				...rxjs,
				...Combinators,
				subscribe,
				p: sketch,
				scalar,
				vec2,
				mat2d,
				document,
				window,
			}
			try {
				saferEval(`(() => {${code}\n})()`, context)
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error('[Sandbox]', e)
			}
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
	'com.baku89.rxio.playground.code',

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
