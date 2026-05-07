subscribe(Pointer.position().pipe(lerp(vec2.lerp, 0.2)), ([x, y]) =>
	p.circle(x, y, 50)
)

subscribe(Pointer.down(), () => p.clear())
