Bndr.combine(
	Bndr.keyboard()
		.pressed('s')
		.map(p => (p ? 1 : 0)),
	Bndr.keyboard()
		.pressed('a')
		.map(p => (p ? -1 : 0))
)
	.interval()
	.map(v => v * 5)
	.filter(v => v !== 0)
	.fold(scalar.add, p.width / 2)
	.on(r => {
		p.clear()
		p.circle(p.width / 2, p.height / 2, r)
	})
