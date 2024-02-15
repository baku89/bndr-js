Bndr.tuple(
	Bndr.midi()
		.note(0, 40)
		.map(v => (v / 127) * p.width),
	Bndr.midi()
		.note(0, 41)
		.map(v => (v / 127) * p.height)
)
	.trail(2)
	.on(([[px, py], [x, y]]) => {
		p.strokeWeight(20)
		p.line(px, py, x, y)
	})

Bndr.midi().note(0, 30).on(p.clear)
