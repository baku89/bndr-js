Bndr.tuple(
	Bndr.keyboard()
		.pressed('space')
		.map(v => (v ? p.width : p.width / 4))
		.lerp(scalar.lerp, 0.1),
	Bndr.combine(
		Bndr.keyboard().keydown('a').constant('GhostWhite'),
		Bndr.keyboard().keydown('s').constant('LightGray'),
		Bndr.keyboard().keydown('d').constant('DimGray')
	)
).on(([radius, color]) => {
	p.clear()
	p.fill(color)
	p.circle(p.width / 2, p.height / 2, radius)
})
