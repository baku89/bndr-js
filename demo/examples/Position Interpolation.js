const marker = ([x, y], r) => p.circle(x, y, r)

const pos = Bndr.pointer().position()

Bndr.tuple(
	pos,
	pos.lerp(vec2.lerp, 0.1),
	pos
		.interval()
		.trail(10)
		.map(pts => vec2.scale(vec2.add(...pts), 1 / pts.length))
).on(([pos, lerp, average]) => {
	p.clear()
	marker(pos, 70)
	marker(lerp, 50)
	marker(average, 10)
})
