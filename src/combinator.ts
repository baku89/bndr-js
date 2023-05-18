import {Bndr, Vec2} from './Bndr'
import {findEqualProp, Maybe, None} from './utils'
import {Vec2Type} from './ValueType'

/**
 * Integrates multiple input events of the same type. The input event is triggered when any of the input events is triggered.
 * @param bndrs Input events to combine.
 * @returns A combined input event.
 * @group Combinators
 */
export function combine<T>(...events: Bndr<T>[]): Bndr<T> {
	if (events.length === 0) throw new Error('Zero-length events')

	const value = events.map(e => e.emittedValue).find(v => v !== None) ?? None

	const ret = new Bndr({
		value,
		defaultValue: events[0].defaultValue,
		type: findEqualProp(events, e => e.type),
	})

	const handler = (value: T) => ret.emit(value)

	events.forEach(e => e.on(handler))

	return ret
}

/**
 * Creates an input event with tuple type from given inputs.
 * @returns An integrated input event with the tuple type of given input events.
 * @group Combinators
 */
export function tuple<T0, T1>(e0: Bndr<T0>, e1: Bndr<T1>): Bndr<[T0, T1]>
export function tuple<T0, T1, T2>(
	e0: Bndr<T0>,
	e1: Bndr<T1>,
	e2: Bndr<T2>
): Bndr<[T0, T1, T2]>
export function tuple<T0, T1, T2, T3>(
	e0: Bndr<T0>,
	e1: Bndr<T1>,
	e2: Bndr<T2>,
	e3: Bndr<T3>
): Bndr<[T0, T1, T2, T3]>
export function tuple<T0, T1, T2, T3, T4>(
	e0: Bndr<T0>,
	e1: Bndr<T1>,
	e2: Bndr<T2>,
	e3: Bndr<T3>,
	e4: Bndr<T4>
): Bndr<[T0, T1, T2, T3, T4]>
export function tuple<T0, T1, T2, T3, T4, T5>(
	e0: Bndr<T0>,
	e1: Bndr<T1>,
	e2: Bndr<T2>,
	e3: Bndr<T3>,
	e4: Bndr<T4>,
	e5: Bndr<T5>
): Bndr<[T0, T1, T2, T3, T4, T5]>
export function tuple(...events: Bndr[]): Bndr<any> {
	const last = events.map(e => e.value)

	const value = events.every(e => e.emittedValue !== None)
		? events.map(e => e.emittedValue)
		: None

	const ret = new Bndr({
		value,
		defaultValue: events.map(e => e.defaultValue),
	})

	events.forEach((event, i) => {
		event.on(value => {
			last[i] = value
			ret.emit(last)
		})
	})

	return ret
}

/**
 * Creates a 2D numeric input event with given input events for each dimension.
 * @param xAxis A numeric input event for X axis.
 * @param yAxis A numeric input event for Y axis.
 * @returns An input event of Vec2.
 * @group Combinators
 */
export function vec2(xAxis: Bndr<number>, yAxis: Bndr<number>): Bndr<Vec2> {
	let lastX: number = xAxis.value
	let lastY: number = yAxis.value

	const value: Maybe<Vec2> =
		xAxis.emittedValue !== None && yAxis.emittedValue !== None
			? [xAxis.emittedValue, yAxis.emittedValue]
			: None

	const ret = new Bndr<Vec2>({
		value,
		defaultValue: [xAxis.defaultValue, yAxis.defaultValue],
		type: Vec2Type,
	})

	xAxis.on(x => {
		lastX = x
		ret.emit([lastX, lastY])
	})

	yAxis.on(y => {
		lastY = y
		ret.emit([lastX, lastY])
	})

	return ret
}
