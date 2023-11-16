const pos = Bndr.gamepad()
	.axis(0)
	.map(v => vec2.scale(v, 10))
	.fold(vec2.add, [p.width / 2, p.height / 2])

const radius = Bndr.combine(
	Bndr.gamepad().button('a').down().constant(2),
	Bndr.gamepad().button('b').down().constant(0.5)
)
	.fold((v, s) => v * s, 100)
	.lerp(scalar.lerp, 0.3)

Bndr.tuple(pos, radius).on(([[x, y], r]) => {
	p.circle(x, y, r)
})
