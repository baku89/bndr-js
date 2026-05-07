const direction = merge(
	Keyboard.pressed('s').pipe(map(v => (v ? 1 : 0))),
	Keyboard.pressed('a').pipe(map(v => (v ? -1 : 0)))
)

subscribe(
	combineLatest([direction, animationFrames()]).pipe(
		map(([v]) => v * 5),
		filter(v => v !== 0),
		scan(scalar.add, p.width / 2)
	),
	r => {
		p.clear()
		p.circle(p.width / 2, p.height / 2, r)
	}
)
