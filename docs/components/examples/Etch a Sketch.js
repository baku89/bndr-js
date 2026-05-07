subscribe(
	combineLatest([
		Midi.note(0, 40).pipe(map(v => (v / 127) * p.width)),
		Midi.note(0, 41).pipe(map(v => (v / 127) * p.height)),
	]).pipe(pairwise()),
	([[px, py], [x, y]]) => {
		p.strokeWeight(20)
		p.line(px, py, x, y)
	}
)

subscribe(Midi.note(0, 30), () => p.clear())
