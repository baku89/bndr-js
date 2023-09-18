export default new Map<string, string>([
	[
		'Pointer',
		`
Bndr.pointer()
	.position()
	.lerp(vec2.lerp, .2)
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
		.map(v => v ? p.width : p.width / 4)
		.lerp(vec2.lerp, .1),
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
Bndr.tuple(
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
	.map(v => vec2.scale(v, 10))
	.fold(vec2.add, [p.width / 2, p.height / 2])

const radius = Bndr.combine(
	Bndr.gamepad.button(0).down().constant(0.5),
	Bndr.gamepad.button(1).down().constant(2)
)
	.fold((v, s) => v * s, 100)
	.lerp(scalar.lerp, .3)

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
	Bndr.keyboard.key('s').map(p => p ? 1 : 0),
	Bndr.keyboard.key('a').map(p => p ? -1 : 0)
)
	.interval()
	.map(v => v * 5)
	.filter(v => v !== 0)
	.fold(scalar.add, p.width / 2)
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
Bndr.tuple(
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
	.map(v => vec2.scale(v, 40))
	.fold(vec2.add, [p.width / 2, p.height / 2])
	.on(([x, y]) => p.circle(x, y, 40))`,
	],
	[
		'Smoothing',
		`const marker = ([x, y], r) => p.circle(x, y, r);

const pos = Bndr.pointer().position();

Bndr.tuple(
	pos,
	pos.lerp(vec2.lerp, 0.1),
	pos
		.interval()
		.trail(10)
		.map((pts) => vec2.scale(vec2.add(...pts), 1 / pts.length))
).on(([pos, lerp, average]) => {
	p.clear();
	marker(pos, 70);
	marker(lerp, 50);
	marker(average, 10);
});
`.trim(),
	],
	[
		'ZUI (Zoom User Interface)',
		`// Adobe Illustrator-like viewport navigation
//
// Pan: Space + Drag / Scroll
// Zoom: Z + Horizontal Drag / Alt + Scroll / Pinch

const position = Bndr.pointer().position();
const leftPressed = Bndr.pointer().left.pressed();

let xform = mat2d.identity;

function draw() {
	p.resetMatrix();
	p.applyMatrix(...xform);
	p.clear();
	p.rect(0, 0, 100, 100);
}

draw();

const pan = position
	.while(
		Bndr.or(
			Bndr.cascade(Bndr.keyboard.key("space"), leftPressed),
			Bndr.pointer().middle.pressed()
		)
	)
	.delta((prev, curt) => vec2.sub(curt, prev))
	.on((delta) => {
		xform = mat2d.multiply(mat2d.fromTranslation(delta), xform);
		draw();
	});

const zoomByScroll = Bndr.pointer()
	.scroll()
	.map(([, y]) => y);

const zoomByDrag = position
	.while(Bndr.cascade(Bndr.keyboard.key("z"), leftPressed))
	.delta((prev, curt) => vec2.sub(curt, prev))
	.map(([x]) => -x);

const zoomByPinch = Bndr.pointer()
	.pinch()
	.map((x) => x * 2);

const zoomCenter = position.stash(
	leftPressed.down(),
	Bndr.pointer().scroll({ preventDefault: true }),
	zoomByPinch.constant(true)
);

const zoom = Bndr.combine(zoomByScroll, zoomByDrag, zoomByPinch).on((delta) => {
	const scale = mat2d.pivot(
		mat2d.fromScaling(vec2.of(1.003 ** -delta)),
		zoomCenter.value
	);
	xform = mat2d.multiply(scale, xform);
	draw();
});`.trim(),
	],
])
