Bndr.tuple(
	Bndr.midi()
		.note(0, 50)
		.map(v => (v / 127) * p.width),
	Bndr.midi()
		.note(0, 51)
		.map(v => (v / 127) * p.height)
).on(([x, y]) => p.circle(x, y, 40))

Bndr.midi()
	.note(0, 68)
	.map(v => {
		if (v) {
			p.noStroke()
			p.fill('black')
		} else {
			p.stroke('black')
			p.fill('white')
		}
	})
