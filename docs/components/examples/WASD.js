subscribe(
	merge(
		Keyboard.keydown('w').pipe(map(() => [0, -1])),
		Keyboard.keydown('a').pipe(map(() => [-1, 0])),
		Keyboard.keydown('s').pipe(map(() => [0, +1])),
		Keyboard.keydown('d').pipe(map(() => [+1, 0]))
	).pipe(
		map(v => vec2.scale(v, 40)),
		scan(vec2.add, [p.width / 2, p.height / 2])
	),
	([x, y]) => p.circle(x, y, 40)
)
