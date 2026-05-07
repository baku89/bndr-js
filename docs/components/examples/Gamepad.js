const pos = Gamepad.axis(0).pipe(
	map(v => vec2.scale(v, 10)),
	scan(vec2.add, [p.width / 2, p.height / 2])
)

const radius = merge(
	Gamepad.button('a').pipe(
		filter(Boolean),
		map(() => 2)
	),
	Gamepad.button('b').pipe(
		filter(Boolean),
		map(() => 0.5)
	)
).pipe(
	scan((v, s) => v * s, 100),
	lerp(scalar.lerp, 0.3)
)

subscribe(combineLatest([pos, radius]), ([[x, y], r]) => {
	p.circle(x, y, r)
})
