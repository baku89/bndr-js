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

/**
 *  * Creates a cascading emitter by combining multiple emitters. The resulting emitter emits `true` when the original emitters emit truthy values in a sequential manner from the beginning to the end of the list.
 * @param emitters Emitters to combine.
 * @returns A cascading emitter.
 * @group Combinators
 */
export function cascade(...emitters: Emitter[]): Emitter<boolean> {
	const ret = new Emitter({
		original: emitters,
		value: false,
		defaultValue: false,
	})

	const values = emitters.map(e => !!e.value)

	let prevCascadedIndex = -1
	let cascadedIndex = -1

	emitters.forEach((emitter, i) => {
		emitter.addDerivedEmitter(ret, value => {
			values[i] = !!value

			if (value) {
				if (cascadedIndex === i - 1) {
					cascadedIndex = i
				}
			} else {
				if (cascadedIndex === i) {
					cascadedIndex = values.findIndex(v => v)
				}
			}

			if (
				prevCascadedIndex < cascadedIndex &&
				cascadedIndex === emitters.length - 1
			) {
				ret.emit(true)
			} else if (
				cascadedIndex < prevCascadedIndex &&
				cascadedIndex < emitters.length - 1
			) {
				ret.emit(false)
			}

			prevCascadedIndex = cascadedIndex
		})
	})

	return ret
}

/**
 * Creates a emitter that emits `true` when all of the given emitters emit truthy values.
 * @param emitters Emitters to combine.
 * @returns A new emitter
 * @group Combinators
 */
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

/**
 * Creates a emitter that emits `true` when any of the given emitters emit truthy values.
 * @param emitters Emitters to combine.
 * @returns A new emitter
 * @group Combinators
 */
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
