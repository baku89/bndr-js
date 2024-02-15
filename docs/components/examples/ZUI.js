// Adobe Illustrator-like viewport navigation
//
// Pan: Space + Drag / Scroll
// Zoom: Z + Horizontal Drag / Alt + Scroll / Pinch

const position = Bndr.pointer().position()
const leftPressed = Bndr.pointer().left.pressed()

let xform = mat2d.identity

function draw() {
	p.resetMatrix()
	p.applyMatrix(...xform)
	p.clear()
	p.rect(0, 0, 100, 100)
}

draw()

// Pan
position
	.while(
		Bndr.or(
			Bndr.cascade(Bndr.keyboard().pressed('space'), leftPressed),
			Bndr.pointer().middle.pressed()
		)
	)
	.delta((prev, curt) => vec2.sub(curt, prev))
	.on(delta => {
		xform = mat2d.multiply(mat2d.fromTranslation(delta), xform)
		draw()
	})

const zoomByScroll = Bndr.pointer()
	.scroll()
	.map(([, y]) => y)

const zoomByDrag = position
	.while(Bndr.cascade(Bndr.keyboard().pressed('z'), leftPressed))
	.delta((prev, curt) => vec2.sub(curt, prev))
	.map(([x]) => -x)

const zoomByPinch = Bndr.pointer()
	.pinch()
	.map(x => x * 2)

const zoomCenter = position.stash(
	leftPressed.down(),
	Bndr.pointer().scroll({preventDefault: true}),
	zoomByPinch.constant(true)
)

// Zoom
Bndr.combine(zoomByScroll, zoomByDrag, zoomByPinch).on(delta => {
	const scale = mat2d.pivot(
		mat2d.fromScaling(vec2.of(1.003 ** -delta)),
		zoomCenter.value
	)
	xform = mat2d.multiply(scale, xform)
	draw()
})
