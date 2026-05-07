const marker = ([x, y], r) => p.circle(x, y, r)

const pos = Pointer.position()

const averaged = combineLatest([pos, animationFrames()]).pipe(
	map(([p]) => p),
	scan((acc, v) => [v, ...acc].slice(0, 10), []),
	filter(arr => arr.length === 10),
	map(pts => vec2.scale(pts.reduce(vec2.add, [0, 0]), 1 / pts.length))
)

subscribe(
	combineLatest([pos, pos.pipe(lerp(vec2.lerp, 0.1)), averaged]),
	([pos, lerped, average]) => {
		p.clear()
		marker(pos, 70)
		marker(lerped, 50)
		marker(average, 10)
	}
)
