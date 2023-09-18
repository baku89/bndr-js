import {debounce, identity} from 'lodash'

import {Emitter} from './Emitter'

/**
 * Integrates multiple input events of the same type. The input event is triggered when any of the input events is triggered.
 * @param bndrs Input events to combine.
 * @returns A combined input event.
 * @group Combinators
 */
export function combine<T>(...events: Emitter<T>[]): Emitter<T> {
	if (events.length === 0) throw new Error('Zero-length events')

	const value =
		events.map(e => e.emittedValue).find(v => v !== undefined) ?? undefined

	const ret = new Emitter({
		original: events,
		value,
		defaultValue: events[0].defaultValue,
	})

	const emit = debounce((value: T) => ret.emit(value), 0)

	events.forEach(e => e.addDerivedEmitter(ret, emit))

	return ret
}

export function cascade(first: Emitter, second: Emitter): Emitter<boolean> {
	const ret = new Emitter({
		original: [first, second],
		value: false,
		defaultValue: false,
	})

	let prev = false

	first.addDerivedEmitter(ret, () => null)

	second.addDerivedEmitter(ret, value => {
		if (value) {
			prev = first.value
			if (prev) {
				ret.emit(true)
			}
		} else {
			if (prev) {
				ret.emit(false)
				prev = false
			}
		}
	})

	return ret
}

export function and(...emitters: Emitter[]): Emitter<boolean> {
	const lastValues = emitters.map(e => !!e.value)

	let prev = lastValues.every(identity)

	const ret = new Emitter({
		original: emitters,
		value: false,
		defaultValue: false,
	})

	emitters.forEach((emitter, i) => {
		emitter.on(v => {
			lastValues[i] = !!v

			const value = lastValues.every(identity)

			if (prev !== value) {
				ret.emit(value)
			}

			prev = value
		})
	})

	return ret
}

export function or(...emitters: Emitter[]): Emitter<boolean> {
	const lastValues = emitters.map(e => !!e.value)

	let prev = lastValues.every(identity)

	const ret = new Emitter({
		original: emitters,
		value: false,
		defaultValue: false,
	})

	emitters.forEach((emitter, i) => {
		emitter.on(v => {
			lastValues[i] = !!v

			const value = lastValues.some(identity)

			if (prev !== value) {
				ret.emit(value)
			}

			prev = value
		})
	})

	return ret
}

/**
 * Creates an input event with tuple type from given inputs.
 * @returns An integrated input event with the tuple type of given input events.
 * @group Combinators
 */
export function tuple<T0, T1>(
	e0: Emitter<T0>,
	e1: Emitter<T1>
): Emitter<[T0, T1]>
export function tuple<T0, T1, T2>(
	e0: Emitter<T0>,
	e1: Emitter<T1>,
	e2: Emitter<T2>
): Emitter<[T0, T1, T2]>
export function tuple<T0, T1, T2, T3>(
	e0: Emitter<T0>,
	e1: Emitter<T1>,
	e2: Emitter<T2>,
	e3: Emitter<T3>
): Emitter<[T0, T1, T2, T3]>
export function tuple<T0, T1, T2, T3, T4>(
	e0: Emitter<T0>,
	e1: Emitter<T1>,
	e2: Emitter<T2>,
	e3: Emitter<T3>,
	e4: Emitter<T4>
): Emitter<[T0, T1, T2, T3, T4]>
export function tuple<T0, T1, T2, T3, T4, T5>(
	e0: Emitter<T0>,
	e1: Emitter<T1>,
	e2: Emitter<T2>,
	e3: Emitter<T3>,
	e4: Emitter<T4>,
	e5: Emitter<T5>
): Emitter<[T0, T1, T2, T3, T4, T5]>
export function tuple(...events: Emitter[]): Emitter<any> {
	let last = events.map(e => e.value)

	const value = events.map(e => e.value)

	const ret = new Emitter({
		original: events,
		value,
		defaultValue: events.map(e => e.defaultValue),
	})

	const emit = debounce(() => ret.emit(last), 0)

	events.forEach((e, i) => {
		e.addDerivedEmitter(ret, value => {
			last = [...last]
			last[i] = value
			emit()
		})
	})

	return ret
}
