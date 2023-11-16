Bndr.combine(
	Bndr.keyboard().pressed('w').down().constant([0, -1]),
	Bndr.keyboard().pressed('a').down().constant([-1, 0]),
	Bndr.keyboard().pressed('s').down().constant([0, +1]),
	Bndr.keyboard().pressed('d').down().constant([+1, 0])
)
	.map(v => vec2.scale(v, 40))
	.fold(vec2.add, [p.width / 2, p.height / 2])
	.on(([x, y]) => p.circle(x, y, 40))
