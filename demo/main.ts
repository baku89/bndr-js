import {Bndr} from 'bndr-js'
import {mat2d, scalar, vec2} from 'linearly'
import {debounce} from 'lodash'
import p5 from 'p5'
import saferEval from 'safer-eval'

import Examples from './examples'

let sketch: any

window.addEventListener('touchmove', e => e.preventDefault(), {
	passive: false,
})

new p5(p => {
	p.setup = () => {
		p.createCanvas(window.innerWidth, window.innerHeight)
		p.noLoop()
	}
	p.draw = () => {
		sketch = p
	}
}, 'canvas' as any)

window.addEventListener('resize', () => {
	sketch.canvas.width = window.innerWidth
	sketch.canvas.height = window.innerHeight
	sketch.resizeCanvas(window.innerWidth, window.innerHeight)
})

const code = localStorage.getItem('code') || Examples.get('Pointer')

const example = document.getElementById('example') as HTMLSelectElement
if (!example) throw -1

// Append Options

for (const name of Examples.keys()) {
	const option = document.createElement('option')
	option.text = option.value = name
	example.appendChild(option)
}

example.value = ''
for (const [name, c] of Examples.entries()) {
	if (code === c) {
		example.value = name
		break
	}
}

example.oninput = () => {
	editor.setValue(Examples.get(example.value))
	editor.clearSelection()
	sketch.background('white')
}

// Setup Ace Editor
const editor = (window as any).ace.edit('editor')
const session = editor.getSession()
editor.setTheme('ace/theme/tomorrow')
editor.renderer.setShowGutter(false)
session.setOptions({
	mode: 'ace/mode/javascript',
	tabSize: 2,
})
editor.setHighlightActiveLine(false)
session.setValue(code)
editor.container.style.background = 'transparent'

// Re-evaluate the code on change
editor.on('change', () => {
	const code = editor.getValue()

	example.value = ''
	for (const [name, c] of Examples.entries()) {
		if (code === c) {
			example.value = name
			break
		}
	}

	localStorage.setItem('code', code)

	runCode(code)
})

const runCode = debounce((code = '') => {
	const context = {
		Bndr,
		p: sketch,
		scalar,
		vec2,
		mat2d,
		document,
	}
	sketch.background('white')
	sketch.resetMatrix()
	sketch.pop()
	sketch.push()
	Bndr.disposeAllEmitters()
	saferEval(`(() => {${code}\n})()`, context)
}, 300)

runCode(code)
