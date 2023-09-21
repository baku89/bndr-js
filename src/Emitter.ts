import {
	debounce,
	DebounceSettings,
	identity,
	isEqual,
	throttle,
	ThrottleSettings,
} from 'lodash'

import {bindMaybe, chainMaybeValue, Maybe} from './utils'

type Lerp<T> = (a: T, b: T, t: number) => T
type Listener<T> = (value: T) => void

export interface EmitterOptions<T> {
	original?: Emitter | Emitter[]
	value?: T
	onDispose?: () => void
	onResetState?: () => void
}

export interface GeneratorOptions extends AddEventListenerOptions {
	preventDefault?: boolean
	stopPropagation?: boolean
}

/**
 * Stores all Emitter instances for resetting the listeners at once
 */
export const EmitterInstances = new Set<Emitter>()

/**
 * Disposes all Emitter instances
 * @group Global Functions
 */
export function disposeAllEmitters() {
	EmitterInstances.forEach(emitter => {
		emitter.dispose()
	})
}

/**
 * A foundational value of the library, an instance representing a single *event emitter*. This could be user input from a mouse, keyboard, MIDI controller, gamepad etc., or the result of filtering or composing these inputs. Various operations can be attached by method chaining.
 * @group Emitters
 */
export class Emitter<T = any> {
	constructor(options: EmitterOptions<T> = {}) {
		this.#originals = new Set([options.original ?? []].flat())
		this.#onDispose = options.onDispose
		this.#onResetState = options.onResetState
		this.#value = options.value

		EmitterInstances.add(this)
	}

	readonly #listeners = new Set<Listener<T>>()

	readonly #originals: Set<Emitter>

	/**
	 * Stores all deviced events and their listeners. They will not be unregistered by `removeAllListeners`.
	 */
	protected readonly derivedEmitters = new Map<Emitter, Listener<T>>()

	readonly #onDispose?: () => void

	/**
	 * @internal
	 */
	addDerivedEmitter(event: Emitter, listener: Listener<T>) {
		this.derivedEmitters.set(event, listener)
		this.on(listener)
	}

	/**
	 * @internal
	 */
	removeDerivedEmitter(event: Emitter) {
		const listener = this.derivedEmitters.get(event)
		if (listener) {
			this.off(listener)
		}

		this.derivedEmitters.delete(event)
	}

	/**
	 * Disposes the emitter immediately and prevent to emit any value in the future
	 * @group Event Handlers
	 */
	dispose() {
		this.removeAllListeners()

		if (this.#onDispose) {
			this.#onDispose()
		}

		for (const original of this.#originals) {
			original.removeDerivedEmitter(this)
		}
	}

	readonly #onResetState?: () => void

	/**
	 * Returns `true` if the emitter has a state and can be reset.
	 * @group Properties
	 */
	get stateful() {
		return !!this.#onResetState
	}

	/**
	 * Resets the state of the emitter.
	 * @group Event Handlers
	 */
	reset() {
		if (this.#onResetState) {
			this.#onResetState()
		}
		for (const derived of this.derivedEmitters.keys()) {
			derived.reset()
		}
	}

	/**
	 * Stores the last emitted value.
	 */
	#value: Maybe<T>

	/**
	 * The latest value emitted from the emitter. If the emitter has never fired before, it just returns `undefined`.
	 * @group Properties
	 */
	get value(): T | undefined {
		return this.#value
	}

	/**
	 * Adds the `listener` function for the event.
	 * @param listener The callback function
	 * @group Event Handlers
	 */
	on(listener: Listener<T>) {
		this.#listeners.add(listener)
	}

	/**
	 * Removes the `listener` function from the event.
	 * @param listener
	 * @group Event Handlers
	 */
	off(listener: Listener<T>) {
		this.#listeners.delete(listener)
	}

	/**
	 * Manually emits the event.
	 * @param value
	 * @group Event Handlers
	 */
	emit(value: T) {
		this.#value = value
		for (const listener of this.#listeners) {
			listener(value)
		}
	}

	/**
	 * Adds a *one-time* `listener` function for the event
	 * @param listener
	 * @group Event Handlers
	 */
	once(listener: Listener<T>) {
		const _listener = (value: T) => {
			this.off(_listener)
			listener(value)
		}
		this.on(_listener)
	}

	/**
	 * Removes all listeners.
	 * @group Event Handlers
	 */
	removeAllListeners() {
		this.#listeners.forEach(listener => this.off(listener))
	}

	/**
	 * Transforms the payload of event with the given function.
	 * @param fn A function to transform the payload
	 * @returns A new emitter
	 * @group Common Filters
	 */
	map<U>(fn: (value: T) => U, initialValue?: U): Emitter<U> {
		const ret = new Emitter({
			original: this,
			value: chainMaybeValue(initialValue, bindMaybe(this.#value, fn)),
		})

		this.addDerivedEmitter(ret, value => ret.emit(fn(value)))

		return ret
	}

	/**
	 * Filters events with the given predicate function
	 * @param fn Return truthy value to pass events
	 * @returns A new emitter
	 * @group Common Filters
	 */
	filter(fn: (value: T) => any): Emitter<T> {
		const ret = new Emitter({
			original: this,
		})

		this.addDerivedEmitter(ret, value => {
			if (fn(value)) ret.emit(value)
		})

		return ret
	}

	/**
	 * Maps the current value to another type of value, and emits the mapped value only when the mapped value is not `undefined`.
	 * @param fn A function to map the current value. Return `undefined` to skip emitting.
	 * @group Common Filters
	 */
	filterMap<U>(fn: (value: T) => U | undefined, initialValue?: U): Emitter<U> {
		const ret = new Emitter({
			original: this,
			value: chainMaybeValue(initialValue, bindMaybe(this.#value, fn)),
		})

		this.addDerivedEmitter(ret, value => {
			const fv = fn(value)
			if (fv !== undefined) ret.emit(fv)
		})

		return ret
	}

	/**
	 * Creates an emitter that emits at the moment the current value changes from falsy to truthy.
	 * @group Common Filters
	 */
	down(): Emitter<true> {
		return this.fold((prev, curt) => !prev && !!curt, false)
			.filter(identity)
			.constant(true)
	}

	/**
	 * Creates an emitter that emits at the moment the current value changes from falsy to truthy.
	 * @group Common Filters
	 */
	up(): Emitter<true> {
		return this.fold((prev, curt) => !!prev && !curt, true)
			.filter(identity)
			.constant(true)
	}

	/**
	 * Creates an emitter whose payload is negated.
	 * @group Common Filters
	 */
	get not(): Emitter<boolean> {
		return this.map(v => !v, !this.#value)
	}

	/**
	 * Emits only when the value is changed
	 * @param equalFn A comparator function. The event will be emitted when the function returns falsy value.
	 * @returns
	 * @group Common Filters
	 */
	change(equalFn: (a: T, b: T) => boolean = isEqual): Emitter<T> {
		return this.fold<T>((prev, curt) => {
			if (prev === undefined || !equalFn(prev, curt)) {
				return curt
			} else {
				return undefined
			}
		}, this.#value as unknown as T)
	}

	/**
	 * Emits while the given event is truthy. The event will be also emitted when the given emitter is changed from falsy to truthy when the `resetOnDown` flag is set to true.
	 * @param emitter An emitter to filter the current event
	 * @param resetOnDown If set to `true`, the current event will be reset when the given event is changed from falsy to truthy.
	 * @returns
	 * @group Common Filters
	 */
	while(emitter: Emitter<boolean>, resetOnDown = true) {
		const ret = new Emitter({
			original: this,
		})

		this.addDerivedEmitter(ret, curt => {
			if (emitter.value) {
				ret.emit(curt)
			}
		})

		if (resetOnDown) {
			emitter.down().on(() => {
				ret.reset()
				ret.emit(this.value)
			})
		}

		return ret
	}

	/**
	 * Creates an emitter that emits a constant value every time the current emitter is emitted.
	 * @see {@link https://lodash.com/docs/4.17.15#throttle}
	 * @group Common Filters
	 */
	constant<U>(value: U): Emitter<U> {
		const ret = new Emitter({
			original: this,
		})

		this.addDerivedEmitter(ret, () => ret.emit(value))

		return ret
	}

	/**
	 * Creates throttled version of the current emitter.
	 * @param wait Milliseconds to wait.
	 * @param options
	 * @see {@link https://lodash.com/docs/4.17.15#debounced}
	 * @group Common Filters
	 */
	throttle(wait: number, options?: ThrottleSettings): Emitter<T> {
		const ret = new Emitter({
			original: this,
			onDispose() {
				disposed = true
			},
		})

		let disposed = false

		this.addDerivedEmitter(
			ret,
			throttle(
				value => {
					if (disposed) return
					ret.emit(value)
				},
				wait,
				options
			)
		)

		return ret
	}

	/**
	 * Creates debounced version of the current emitter.
	 * @param wait Milliseconds to wait.
	 * @param options
	 * @returns A new emitter
	 * @group Common Filters
	 */
	debounce(wait: number, options: DebounceSettings) {
		const ret = new Emitter({
			original: this,
			onDispose() {
				disposed = true
			},
		})

		let disposed = false

		this.addDerivedEmitter(
			ret,
			debounce(
				value => {
					if (disposed) return
					ret.emit(value)
				},
				wait,
				options
			)
		)

		return ret
	}

	/**
	 * Creates delayed version of the current emitter.
	 * @param wait Milliseconds to wait.
	 * @param options
	 * @returns A new emitter
	 * @group Common Filters
	 */
	delay(wait: number) {
		const ret = new Emitter({
			original: this,
			onDispose() {
				disposed = true
			},
		})

		let disposed = false

		this.addDerivedEmitter(ret, value => {
			setTimeout(() => {
				if (disposed) return

				ret.emit(value)
			}, wait)
		})

		return ret
	}

	/**
	 * Smoothen the change rate of the input value.
	 * @param lerp A function to interpolate the current value and the target value.
	 * @param rate The ratio of linear interpolation from the current value to the target value with each update.
	 * @param threshold The threshold to determine whether the current value is close enough to the target value. If the difference between the current value and the target value is less than this value, the target value will be used as the current value and the interpolation will be stopped.
	 * @returns A new emitter
	 * @group Common Filters
	 */
	lerp(lerp: Lerp<T>, rate: number, threshold = 1e-4): Emitter<T> {
		let t = 1
		let start: Maybe<T>, end: Maybe<T>
		let curt: Maybe<T>

		const emitter = new Emitter({
			original: this,
			onDispose() {
				start = end = undefined
			},
			onResetState: () => {
				curt = end
				start = end = undefined
			},
		})

		const update = () => {
			if (start === undefined || end === undefined) {
				return
			}

			t = 1 - (1 - t) * (1 - rate)

			curt = lerp(start, end, t)

			if (t < 1 - threshold) {
				// During lerping
				emitter.emit(curt)
				requestAnimationFrame(update)
			} else {
				// On almost reached to the target value
				emitter.emit(end)
				t = 1
				start = end = undefined
			}
		}

		this.addDerivedEmitter(emitter, value => {
			const updating = start !== undefined && end !== undefined

			if (curt === undefined) {
				curt = value
			}

			t = 0
			start = curt
			end = value

			if (!updating) {
				update()
			}
		})

		return emitter
	}

	/**
	 * Reset the state of current emitter emitter when the given event is fired.
	 * @param emitter The emitter that triggers the current emitter to be reset.
	 * @param emitOnReset If set to `true`, the current emitter will be triggered when it is reset.
	 * @returns The current emitter emitter
	 * @group Common Filters
	 */
	resetBy(emitter: Emitter, emitOnReset = true): Emitter<T> {
		const ret = new Emitter({
			original: this,
		})

		emitter.on(value => {
			if (!value) return
			ret.reset()
			if (emitOnReset) {
				ret.emit(this.value)
			}
		})

		this.addDerivedEmitter(ret, value => ret.emit(value))

		return ret
	}

	/**
	 * Initializes with an `initial` state value. On each emitted event, calculates a new state based on the previous state and the current value, and emits this new state.
	 * @param fn A function to calculate a new state
	 * @param initial An initial state value
	 * @returns A new emitter
	 * @group Common Filters
	 */
	fold<U>(fn: (prev: U, value: T) => U | undefined, initial: U): Emitter<U> {
		let state = initial

		const ret = new Emitter<U>({
			original: this,
			onResetState: () => {
				state = initial
			},
		})

		this.addDerivedEmitter(ret, value => {
			const newState = fn(state, value)
			if (newState !== undefined) {
				ret.emit(newState)
				state = newState
			}
		})

		return ret
	}

	/**
	 *  Creates an emitter that emits the current value when the given event is fired.
	 * @param triggers Emitters to trigger the current emitter to emit.
	 * @returns A new emitter
	 * @group Common Filters
	 */
	stash(...triggers: Emitter[]) {
		const ret = new Emitter({
			original: this,
		})

		triggers.forEach(trigger => {
			trigger.on(() => {
				ret.emit(this.value)
			})
		})

		return ret
	}

	/**
	 * Creates an emitter that emits the ‘difference’ between the current value and the previous value.
	 * @param fn A function to calculate the difference
	 * @returns A new emitter
	 * @group Common Filters
	 */
	delta<U>(fn: (prev: T, curt: T) => U): Emitter<U> {
		let prev: Maybe<T>

		const ret = new Emitter<U>({
			original: this,
			onResetState() {
				prev = undefined
			},
		})

		this.addDerivedEmitter(ret, (curt: T) => {
			const delta = fn(prev !== undefined ? prev : curt, curt)
			prev = curt
			ret.emit(delta)
		})

		return ret
	}

	/**
	 * Creates an emitter that keeps to emit the last value of the current emitter at the specified interval.
	 * @param ms The interval in milliseconds. Set `0` to use `requestAnimationFrame`.
	 * @param immediate If set to `false`, the new emitter waits to emit until the current emitter emits any value.
	 * @returns A new emitter.
	 * @group Common Filters
	 */
	interval(ms = 0, immediate = false) {
		const ret = new Emitter({
			original: this,
			onDispose() {
				disposed = true
			},
		})

		let disposed = false

		const update = () => {
			if (disposed) return

			ret.emit(this.value)

			if (ms <= 0) {
				requestAnimationFrame(update)
			} else {
				setTimeout(update, ms)
			}
		}

		if (immediate) {
			update()
		} else {
			if (this.value !== undefined) {
				update()
			} else {
				this.once(update)
			}
		}

		return ret
	}

	/**
	 * Emits an array caching a specified number of values that were emitted in the past.
	 * @param count The number of cache frames. Set `0` to store caches infinitely.
	 * @param emitAtCount When set to `true`, events will not be emitted until the count of cache reaches to `count`.
	 * @returns
	 * @group Common Filters
	 */
	trail(count = 2, emitAtCount = true): Emitter<T[]> {
		let ret = this.fold<T[]>((prev, value) => {
			const arr = [value, ...prev]

			if (count === 0) return arr
			return arr.slice(0, count)
		}, [])

		if (emitAtCount) {
			ret = ret.filter(v => v.length === count)
		}

		return ret
	}

	/**
	 * @group Event Handlers
	 */
	log(message = 'Bndr') {
		this.on(value => {
			console.log(`[${message}]`, 'Value=', value)
		})
		return this
	}
}
