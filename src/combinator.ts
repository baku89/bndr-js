import {debounce} from 'lodash-es'

import {Emitter} from './Emitter'
import {IconSequence} from './types'

/**
 * Integrates multiple input events of the same type. The input event is triggered when any of the input events is triggered.
 * @param bndrs Input events to combine.
 * @returns A combined input event.
 * @group Combinators
 */
export function combine<T>(...emitters: Emitter<T>[]): Emitter<T> {
	if (emitters.length === 0) throw new Error('Zero-length emitters')

	const ret = new Emitter({
		sources: emitters,
	})

	const emit = debounce((value: T) => ret.emit(value), 0)

	emitters.forEach(e => e.registerDerived(ret, emit))

	ret.icon = emitters
		.map(e => e.icon)
		.filter((v: IconSequence | undefined): v is IconSequence => !!v)
		.reduce((seq: IconSequence, icon) => {
			if (seq.length === 0) {
				return icon
			} else {
				return [...seq, ', ', ...icon]
			}
		}, [])

	return ret
}

/**
 *  * Creates a cascading emitter by combining multiple emitters. The resulting emitter emits `true` when the given emitters emit truthy values in a sequential manner from the beginning to the end of the list.
 * @param emitters Emitters to combine.
 * @returns A cascading emitter.
 * @group Combinators
 */
export function cascade(...emitters: Emitter[]): Emitter<boolean> {
	const ret = new Emitter({
		sources: emitters,
	})

	const values = emitters.map(e => !!e.value)

	let prevCascadedIndex = -1
	let cascadedIndex = -1

	emitters.forEach((emitter, i) => {
		emitter.registerDerived(ret, value => {
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
	let prev = emitters.every(e => !!e.value)

	const ret = new Emitter({
		sources: emitters,
	})

	function handler() {
		const value = emitters.every(e => !!e.value)

		if (prev !== value) {
			ret.emit(value)
		}

		prev = value
	}

	emitters.forEach(emitter => emitter.on(handler))

	return ret
}

/**
 * Creates a emitter that emits `true` when any of the given emitters emit truthy values.
 * @param emitters Emitters to combine.
 * @returns A new emitter
 * @group Combinators
 */
export function or(...emitters: Emitter[]): Emitter<boolean> {
	let prev = emitters.some(e => !!e.value)

	const ret = new Emitter({
		sources: emitters,
	})

	function handler() {
		const value = emitters.some(e => !!e.value)

		if (prev !== value) {
			ret.emit(value)
		}

		prev = value
	}

	emitters.forEach(emitter => emitter.on(handler))

	return ret
}

type UnwrapEmitter<T> = T extends Emitter<infer U> ? U : never

type UnwrapEmitters<T> = {
	[K in keyof T]: UnwrapEmitter<T[K]>
}
/**
 * Creates an input event with tuple type from given inputs.
 * @returns An integrated input event with the tuple type of given input events.
 * @group Combinators
 */
export function tuple<const T extends Emitter[]>(
	...emitters: T
): Emitter<UnwrapEmitters<T>> {
	let last = emitters.map(e => e.value)

	const ret = new Emitter({
		sources: emitters,
	})

	const emit = debounce(() => ret.emit(last), 0)

	emitters.forEach((e, i) => {
		e.registerDerived(ret, value => {
			last = [...last]
			last[i] = value
			if (last.every(v => v !== undefined)) {
				emit()
			}
		})
	})

	return ret
}
