Bndr.pointer()
	.position()
	.lerp(vec2.lerp, 0.2)
	.on(([x, y]) => p.circle(x, y, 50))

Bndr.pointer()
	.down()
	.on(() => p.background('white'))
