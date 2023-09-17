export default new Map<string, string>([
	[
		'Pointer',
		`
Bndr.pointer()
	.position()
	.lerp(0.2)
	.on(([x, y]) => p.circle(x, y, 50))

Bndr.pointer()
	.down()
	.on(() => p.background('white'))
	`.trim(),
	],
	[
		'Keyboard',
		`
Bndr.tuple(
	Bndr.keyboard.key('space')
		.map(v => v ? p.width : p.width / 4, Bndr.type.number)
		.lerp(.1),
	Bndr.combine(
		Bndr.keyboard.key('a').down().constant('GhostWhite'),
		Bndr.keyboard.key('s').down().constant('LightGray'),
		Bndr.keyboard.key('d').down().constant('DimGray')
	)
).on(([radius, color]) => {
	p.background('white')
	p.fill(color)
	p.circle(p.width / 2, p.height / 2, radius)
})`.trim(),
	],
	[
		'MIDI Controller',
		`
Bndr.vec2(
	Bndr.midi.note(0, 50).map(v => v / 127 * p.width),
	Bndr.midi.note(0, 51).map(v => v / 127 * p.height)
).on(([x, y]) => p.circle(x, y, 40))

Bndr.midi.note(0, 68).map(v => {
	if (v) {
		p.noStroke()
		p.fill('black')
	} else {
		p.stroke('black')
		p.fill('white')
	}
})`.trim(),
	],
	[
		'Gamepad',
		`
const pos = Bndr.gamepad.axis(0)
	.scale(10)
	.accumulate(null, [p.width / 2, p.height / 2])

const radius = Bndr.combine(
	Bndr.gamepad.button(0).down().constant(0.5),
	Bndr.gamepad.button(1).down().constant(2)
)
	.accumulate((v, s) => v * s, 100)
	.lerp(.3)

const mode = Bndr.gamepad.button(2).down()
	.fold(v => !v, false)

Bndr.tuple(pos, radius, mode)
	.on(([[x, y], r, fill]) => {
		p.fill(fill ? 'black' : 'white')
		p.stroke(fill ? 'white' : 'black')
		p.circle(x, y, r)
	})`.trim(),
	],
	[
		'Interval',
		`
Bndr.combine(
	Bndr.keyboard.key('s').map(p => p ? 1 : 0, Bndr.type.number),
	Bndr.keyboard.key('a').map(p => p ? -1 : 0, Bndr.type.number)
)
	.interval()
	.scale(5)
	.filter(v => v !== 0)
	.accumulate(null, p.width / 2)
	.on(r => {
		p.clear()
		p.circle(p.width / 2, p.height / 2, r)
	})`.trim(),
	],
	[
		'Trail',
		`
Bndr.pointer()
	.position()
	.trail(100, false)
	.on((pts) => {
		p.clear()
		p.beginShape()
		for (const [x, y] of pts) {
			p.vertex(x, y)
		}
		p.endShape()
	})`.trim(),
	],
	[
		'Etch a Sketch',
		`
Bndr.vec2(
	Bndr.midi.note(0, 40).map(v => v / 127 * p.width),
	Bndr.midi.note(0, 41).map(v => v / 127 * p.height)
)
	.trail(2)
	.on(([[px, py], [x, y]]) => {
		p.strokeWeight(20)
		p.line(px, py, x, y)
	})

Bndr.midi.note(0, 30).on(() => p.clear())`.trim(),
	],
	[
		'WASD Movement',
		`Bndr.combine(
	Bndr.keyboard.key('w').down().constant([ 0, -1]),
	Bndr.keyboard.key('a').down().constant([-1,  0]),
	Bndr.keyboard.key('s').down().constant([ 0, +1]),
	Bndr.keyboard.key('d').down().constant([+1,  0])
)
	.as(Bndr.type.vec2)
	.scale(40)
	.accumulate(null, [p.width / 2, p.height / 2])
	.on(([x, y]) => p.circle(x, y, 40))`,
	],
	[
		'Smoothing',
		`
const marker = ([x, y], r) => p.circle(x, y, r)

const pos = Bndr.pointer().position()

Bndr.tuple(
	pos,
	pos.lerp(.1),
	pos.spring({rate: .2, friction: .1}),
	pos.interval().average(10)
).on(([pos, lerp, spring, average]) => {
	p.clear()
	marker(pos, 70)
	marker(lerp, 50)
	marker(spring, 30)
	marker(average, 10)
})`.trim(),
	],
	[
		'ZUI (Zoom User Interface)',
		`// Adobe Illustrator-like viewport navigation
//
// Pan: Space + Drag / Scroll
// Zoom: Z + Horizontal Drag / Alt + Scroll

const position = Bndr.pointer().position()
const leftPressed = Bndr.pointer().left.pressed()

let xform = mat2d.identity

function draw() {
	p.resetMatrix()
	p.applyMatrix(...xform)
	p.clear()
	p.rect(0, 0, 100, 100)
}

draw()

const center = position.stash(
	Bndr.combine(
		leftPressed.down(),
		Bndr.pointer().scroll({ preventDefault: true })
	)
)

const pan = position
	.while(
		Bndr.or(
			Bndr.cascade(Bndr.keyboard.key('space'), leftPressed),
			Bndr.pointer().middle.pressed()
		)
	)
	.delta()
	.on((delta) => {
		xform = mat2d.multiply(mat2d.fromTranslation(delta), xform)
		draw()
	})

const zoom = Bndr.combine(
	Bndr.pointer().scroll().map(([, y]) => y),
	position
		.while(Bndr.cascade(Bndr.keyboard.key('z'), leftPressed))
		.delta()
		.map(([x]) => -x)
).on((delta) => {
	const scale = mat2d.multiply(
		mat2d.multiply(
			mat2d.fromTranslation(center.value),
			mat2d.fromScaling(vec2.of(1.003 ** -delta))
		),
		mat2d.fromTranslation(vec2.negate(center.value))
	)
	xform = mat2d.multiply(scale, xform)
	draw()
})`.trim(),
	],
])
