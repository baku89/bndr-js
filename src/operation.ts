import {Memoize} from 'typescript-memoize'

import type {Vec2} from '.'

export type Magma<T> = (a: T, b: T) => T
export type Scale<T> = (value: T, s: number) => T
export type Norm<T> = (value: T) => number
export type Lerp<T> = (a: T, b: T, t: number) => T

interface OperationOptions<T> {
	name: string
	add?: Magma<T>
	scale?: Scale<T>
	norm?: Norm<T>
}

export class Operation<T> {
	readonly name: string

	readonly add?: Magma<T>
	readonly scale?: Scale<T>
	readonly norm?: Norm<T>

	constructor(options: OperationOptions<T>) {
		this.name = options.name

		this.add = options.add
		this.scale = options.scale
		this.norm = options.norm
	}

	@Memoize()
	get subtract(): Magma<T> | undefined {
		const {add, scale} = this
		if (!add || !scale) return

		return (a, b) => add(a, scale(b, -1))
	}

	@Memoize()
	get lerp(): Lerp<T> | undefined {
		const {add, scale, subtract} = this
		if (!add || !scale || !subtract) return

		return (a, b, t) => add(scale(subtract(b, a), t), a)
	}
}

export const NumberOperation = new Operation<number>({
	name: 'number',
	add: (a, b) => a + b,
	scale: (x, s) => x * s,
	norm: Math.abs,
})

export const Vec2Operation = new Operation<Vec2>({
	name: 'vec2',
	add: ([x1, y1], [x2, y2]) => [x1 + x2, y1 + y2],
	scale: ([x, y], s) => [x * s, y * s],
	norm: ([x, y]) => Math.hypot(x, y),
})
