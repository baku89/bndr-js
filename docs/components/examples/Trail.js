Bndr.pointer()
	.position()
	.trail(100, false)
	.on(pts => {
		p.clear()
		p.beginShape()
		for (const [x, y] of pts) {
			p.vertex(x, y)
		}
		p.endShape()
	})
