import type {Vec2} from 'linearly'
import {vec2} from 'linearly'

export type Magma<T> = (a: T, b: T) => T
export type Scale<T> = (value: T, s: number) => T
export type Norm<T> = (value: T) => number
export type Lerp<T> = (a: T, b: T, t: number) => T

interface ValueTypeOptions<T> {
	name: string
	add: Magma<T>
	subtract: Magma<T>
	scale: Scale<T>
	norm: Norm<T>
}

export class ValueType<T> {
	readonly name: string
	readonly add: Magma<T>
	readonly subtract: Magma<T>
	readonly scale: Scale<T>
	readonly norm: Norm<T>

	constructor(options: ValueTypeOptions<T>) {
		this.name = options.name
		this.add = options.add
		this.subtract = options.subtract
		this.scale = options.scale
		this.norm = options.norm
	}

	get lerp(): Lerp<T> | undefined {
		const {add, scale, subtract} = this
		return (a, b, t) => add(scale(subtract(b, a), t), a)
	}
}

export const NumberType = new ValueType<number>({
	name: 'number',
	add: (a, b) => a + b,
	subtract: (a, b) => a - b,
	scale: (x, s) => x * s,
	norm: Math.abs,
})

export const Vec2Type = new ValueType<Vec2>({
	name: 'vec2',
	add: vec2.add,
	subtract: vec2.subtract,
	scale: vec2.scale,
	norm: vec2.length,
})
