import saferEval from 'safer-eval'

import Bndr from '../src'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')

if (!ctx) throw new Error()

// Update canvas size on window resizes
function updateCanvasSize() {
	canvas.width = window.innerWidth
	canvas.height = window.innerHeight
}
window.addEventListener('resize', updateCanvasSize)
updateCanvasSize()

const code =
	localStorage.getItem('code') ??
	`Bndr.pointer.position()
	.lerp(.2)
	.on(([x, y]) => {
		ctx.beginPath()
		ctx.arc(x, y, 10, 0, Math.PI * 2)
		ctx.fill()
	})
	
Bndr.pointer.down()
	.on(() => ctx.clearRect(0, 0, canvas.width, canvas.height))
`.trim()

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
	localStorage.setItem('code', code)

	Bndr.removeAllListeners()
	setTimeout(() => runCode(code), 1)
})

runCode(code)

function runCode(code: string) {
	const context = {
		Bndr,
		ctx,
		canvas,
	}
	saferEval(`(() => {${code}})()`, context)
}
