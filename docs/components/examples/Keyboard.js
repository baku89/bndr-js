subscribe(
	combineLatest([
		Keyboard.pressed('space').pipe(
			map(v => (v ? p.width : p.width / 4)),
			lerp(scalar.lerp, 0.1)
		),
		merge(
			Keyboard.keydown('a').pipe(map(() => 'GhostWhite')),
			Keyboard.keydown('s').pipe(map(() => 'LightGray')),
			Keyboard.keydown('d').pipe(map(() => 'DimGray'))
		),
	]),
	([radius, color]) => {
		p.clear()
		p.fill(color)
		p.circle(p.width / 2, p.height / 2, radius)
	}
)
