export default new Map<string, string>([
	[
		'Pointer',
		`
Bndr.pointer
	.position()
	.lerp(0.2)
	.on(([x, y]) => p.circle(x, y, 50))

Bndr.pointer
	.down()
	.on(() => p.background('white'))
	`.trim(),
	],
	[
		'Keyboard',
		`
Bndr.merge(
	Bndr.keyboard.key('space')
		.map(v => v ? p.width : p.width / 4, Bndr.number)
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
).map(([x, y]) => p.circle(x, y, 40))

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
p.fill('white')

const pos = Bndr.gamepad.axis(0)
	.scale(10)
	.accumlate(null, [p.width / 2, p.height / 2])

const radius = Bndr.combine(
	Bndr.gamepad.button(0).down().constant(0.5),
	Bndr.gamepad.button(1).down().constant(2)
)
	.accumlate((v, s) => v * s, 100)
	.lerp(.3)

Bndr.merge(pos, radius)
	.on(([[x, y], r]) => p.circle(x, y, r))`.trim(),
	],
])
