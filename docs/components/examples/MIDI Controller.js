subscribe(
	combineLatest([
		Midi.note(0, 50).pipe(map(v => (v / 127) * p.width)),
		Midi.note(0, 51).pipe(map(v => (v / 127) * p.height)),
	]),
	([x, y]) => p.circle(x, y, 40)
)

subscribe(Midi.note(0, 68), v => {
	if (v) {
		p.noStroke()
		p.fill('black')
	} else {
		p.stroke('black')
		p.fill('white')
	}
})
