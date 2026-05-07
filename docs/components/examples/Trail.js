subscribe(
	Pointer.position().pipe(
		scan((acc, v) => {
			const next = [v, ...acc]
			return next.length > 100 ? next.slice(0, 100) : next
		}, [])
	),
	pts => {
		p.clear()
		p.beginShape()
		for (const [x, y] of pts) {
			p.vertex(x, y)
		}
		p.endShape()
	}
)
