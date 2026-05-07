// Adobe Illustrator-like viewport navigation
//
// Pan: Space + Drag / Scroll
// Zoom: Z + Horizontal Drag / Alt + Scroll / Pinch
//
// NOTE: this example is a work-in-progress port to RxIO. The original
// Bndr-based implementation relied on `while`, `delta`, `stash`, and
// per-button `pressed` helpers that aren't yet exposed on the new pointer
// module. See git history for the original code.

const scrollY = Pointer.scroll().pipe(map(([, y]) => y))
const pinchX = Pointer.pinch().pipe(map(x => x * 2))

let xform = mat2d.identity
function draw() {
	p.resetMatrix()
	p.applyMatrix(...xform)
	p.clear()
	p.rect(0, 0, 100, 100)
}
draw()

// Zoom by scroll wheel only — the rest is TODO.
subscribe(merge(scrollY, pinchX), delta => {
	const scale = mat2d.fromScaling(vec2.of(1.003 ** -delta))
	xform = mat2d.multiply(scale, xform)
	draw()
})
