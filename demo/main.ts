import Bndr from '../src'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')

if (!ctx) throw new Error()

canvas.width = window.innerWidth
canvas.height = window.innerHeight

Bndr.mergeToVec2(
	Bndr.midi.controlChange(0, 50).map(v => (v / 127) * canvas.width),
	Bndr.midi.controlChange(0, 51).map(v => (v / 127) * canvas.height)
).on(([x, y]) => ctx.fillRect(x, y, 10, 10))

Bndr.pointer.down().on(() => ctx.clearRect(0, 0, canvas.width, canvas.height))

window.addEventListener('resize', () => {
	canvas.width = window.innerWidth
	canvas.height = window.innerHeight
})
