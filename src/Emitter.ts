import {
	debounce,
	DebounceSettings,
	identity,
	isEqual,
	throttle,
	ThrottleSettings,
} from 'lodash'

import {bindMaybe, Maybe} from './utils'

type Lerp<T> = (a: T, b: T, t: number) => T
type Listener<T> = (value: T) => void

interface EmitterOptions<T> {
	value?: T
	defaultValue: T
	original?: Emitter | Emitter[]
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
 */
export function disposeAllEmitters() {
	EmitterInstances.forEach(emitter => {
		emitter.dispose()
	})
}

/**
 * A foundational value of the library, an instance representing a single *event emitter*. This could be user input from a mouse, keyboard, MIDI controller, gamepad etc., or the result of filtering or composing these inputs. Various operations can be attached by method chaining.
 */
export class Emitter<T = any> {
	constructor(options: EmitterOptions<T>) {
		this.defaultValue = options.defaultValue

		if (options.value !== undefined) {
			this.#value = options.value
		} else {
			this.#value = undefined
		}

		this.#originals = new Set([options.original ?? []].flat())
		this.#onDispose = options.onDispose
		this.#onResetState = options.onResetState

		EmitterInstances.add(this)
	}

	readonly #listeners = new Set<Listener<T>>()

	readonly #originals: Set<Emitter>

	/**
	 * Stores all deviced events and their listeners. They will not be unregistered by `removeAllListeners`.
	 */
	protected readonly derivedEmitters = new Map<Emitter, Listener<T>>()

	readonly #onDispose?: () => void

	addDerivedEmitter(event: Emitter, listener: Listener<T>) {
		this.derivedEmitters.set(event, listener)
	}

	#removeDerivedEmitter(event: Emitter) {
		this.derivedEmitters.delete(event)
	}

	/**
	 * Disposes the emitter immediately and prevent to emit any value in the future
	 */
	dispose() {
		this.removeAllListeners()

		if (this.#onDispose) {
			this.#onDispose()
		}

		for (const original of this.#originals) {
			original.#removeDerivedEmitter(this)
		}
	}

	readonly #onResetState?: () => void

	get stateful() {
		return !!this.#onResetState
	}

	reset() {
		for (const derived of this.derivedEmitters.keys()) {
			derived.reset()
		}
		if (this.#onResetState) {
			this.#onResetState()
		}
	}

	/**
	 * Stores the last emitted value.
	 */
	#value: Maybe<T>

	/**
	 * The latest value emitted from the emitter. If the emitter has never fired before, it fallbacks to {@link Emitter#defaultValue}.
	 * @group Properties
	 */
	get value(): T {
		return this.#value !== undefined ? this.#value : this.defaultValue
	}

	/**
	 * The default value of the event.
	 * @group Properties
	 */
	readonly defaultValue: T

	/**
	 * The latest value emitted from the emitter. If any event has fired before, it returns `undefined`.
	 * @group Properties
	 */
	get emittedValue() {
		return this.#value !== undefined ? this.#value : undefined
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
		for (const listener of this.derivedEmitters.values()) {
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
	 * @param fn
	 * @returns A new emitter
	 * @group Filters
	 */
	map<U>(fn: (value: T) => U): Emitter<U> {
		const ret = new Emitter({
			original: this,
			value: bindMaybe(this.#value, fn),
			defaultValue: fn(this.defaultValue),
		})

		this.addDerivedEmitter(ret, value => ret.emit(fn(value)))

		return ret
	}

	/**
	 * Filters events with the given predicate function
	 * @param fn Return truthy value to pass events
	 * @returns
	 */
	filter(fn: (value: T) => any): Emitter<T> {
		const ret = new Emitter({
			original: this,
			value: bindMaybe(this.#value, v => (fn(v) ? v : undefined)),
			defaultValue: this.defaultValue,
		})

		this.addDerivedEmitter(ret, value => {
			if (fn(value)) ret.emit(value)
		})

		return ret
	}

	/**
	 * Maps the current value to another type of value, and emits the mapped value only when the mapped value is not `undefined`.
	 * @param fn A function to map the current value. Return `undefined` to skip emitting.
	 */
	filterMap<U>(fn: (value: T) => U | undefined) {
		const ret = new Emitter({
			original: this,
			value: bindMaybe(this.#value, v => {
				const fv = fn(v)
				return fv !== undefined ? fv : undefined
			}),
			defaultValue: fn(this.defaultValue),
		})

		this.addDerivedEmitter(ret, value => {
			const fv = fn(value)
			if (fv !== undefined) ret.emit(fv)
		})

		return ret
	}

	/**
	 * Creates an emitter that emits at the moment the current value changes from falsy to truthy.
	 */
	down(): Emitter<true> {
		return this.fold((prev, curt) => !prev && !!curt, false)
			.filter(identity)
			.constant(true)
	}

	/**
	 * Creates an emitter that emits at the moment the current value changes from falsy to truthy.
	 */
	up(): Emitter<true> {
		return this.fold((prev, curt) => !!prev && !curt, true)
			.filter(identity)
			.constant(true)
	}

	/**
	 * Creates an emitter that emits while the current value is falsy.
	 */
	get not(): Emitter<boolean> {
		return this.map(v => !v)
	}

	/**
	 * Emits only when the value is changed
	 * @param equalFn A comparator function. The event will be fired when the function returns falsy value.
	 * @returns
	 */
	change(equalFn: (a: T, b: T) => boolean = isEqual): Emitter<T> {
		return this.trail(2, false)
			.filter(caches =>
				caches.length < 2 ? true : !equalFn(caches[0], caches[1])
			)
			.map(v => v.at(-1) as T)
	}

	/**
	 * Emits while the given event are truthy. The event will be also fired when the given event is changed from falsy to truthy.
	 * @param event An event to filter the current event
	 * @param resetOnDown If set to `true`, the current event will be reset when the given event is changed from falsy to truthy.
	 * @returns
	 */
	while(event: Emitter<boolean>, resetOnDown = true) {
		const ret = new Emitter({
			original: this,
			value: this.#value,
			defaultValue: this.defaultValue,
		})

		this.addDerivedEmitter(ret, curt => {
			if (event.value) {
				ret.emit(curt)
			}
		})

		event.down().on(() => {
			if (resetOnDown) {
				ret.reset()
				ret.emit(this.value)
			}
		})

		return ret
	}

	/**
	 * Creates an emitter that emits a constant value every time the current emitter is emitted.
	 * @see {@link https://lodash.com/docs/4.17.15#throttle}
	 */
	constant<U>(value: U): Emitter<U> {
		const ret = new Emitter({
			original: this,
			value,
			defaultValue: value,
		})

		this.addDerivedEmitter(ret, () => ret.emit(value))

		return ret
	}

	/**
	 * Creates throttled version of the current emitter.
	 * @param wait Milliseconds to wait.
	 * @param options
	 * @see {@link https://lodash.com/docs/4.17.15#debounced}
	 */
	throttle(wait: number, options?: ThrottleSettings): Emitter<T> {
		const ret = new Emitter({
			original: this,
			value: this.#value,
			defaultValue: this.defaultValue,
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
	 */
	debounce(wait: number, options: DebounceSettings) {
		const ret = new Emitter({
			original: this,
			value: this.#value,
			defaultValue: this.defaultValue,
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
	 */
	delay(wait: number) {
		const ret = new Emitter({
			original: this,
			value: this.#value,
			defaultValue: this.defaultValue,
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
	 * @param rate The ratio of linear interpolation from the current value to the target value with each update.
	 * @returns A new emitter
	 */
	lerp(lerp: Lerp<T>, rate: number, threshold = 1e-4): Emitter<T> {
		let curt: Maybe<T> = undefined
		let t = 1
		let start = this.#value
		let end = this.value

		let updating = false

		const emitter = new Emitter({
			original: this,
			value: this.#value,
			defaultValue: this.defaultValue,
			onDispose() {
				updating = false
			},
			onResetState: () => {
				start = this.#value
				end = this.value
				t = 1
				updating = false
			},
		})

		const update = () => {
			if (!updating) return

			if (start === undefined) {
				start = end
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
				start = end
				updating = false
			}
		}

		this.addDerivedEmitter(emitter, value => {
			t = 0
			start = curt
			end = value

			if (!updating) {
				updating = true
				update()
			}
		})

		return emitter
	}

	/**
	 * Reset the state of current emitter emitter when the given event is fired.
	 * @param emitter The emitter that triggers the current emitter to be reset.
	 * @returns The current emitter emitter
	 */
	resetBy(emitter: Emitter): Emitter<T> {
		const ret = new Emitter({
			original: this,
			value: this.#value,
			defaultValue: this.defaultValue,
		})

		emitter.on(() => ret.reset())

		this.addDerivedEmitter(ret, value => ret.emit(value))

		return ret
	}

	/**
	 * Returns an input event with _state_.
	 * @param fn A update function, which takes the current value and a value representing the internal state as arguments, and returns a tuple of the updated value and the new state.
	 * @param initial A initial value of the internal state.
	 * @returns A new emitter
	 */
	state<U, S>(fn: (value: T, state: S) => [U, S], initial: S): Emitter<U> {
		let state = initial

		const ret = new Emitter<U>({
			original: this,
			value: bindMaybe(this.#value, value => fn(value, state)[0]),
			defaultValue: fn(this.defaultValue, state)[0],
			onResetState() {
				state = initial
			},
		})

		this.addDerivedEmitter(ret, value => {
			const [newValue, newState] = fn(value, state)
			state = newState
			ret.emit(newValue)
		})

		return ret
	}

	/**
	 *
	 * @param fn
	 * @param initial An initial value
	 * @returns
	 */
	fold<U>(fn: (prev: U, value: T) => U, initial: U): Emitter<U> {
		let prev = initial

		const ret = new Emitter<U>({
			original: this,
			value: initial,
			defaultValue: initial,
			onResetState: () => {
				prev = initial
			},
		})

		this.addDerivedEmitter(ret, value => {
			prev = fn(prev, value)
			ret.emit(prev)
		})

		return ret
	}

	stash(trigger: Emitter) {
		const ret = new Emitter({
			original: this,
			value: this.#value,
			defaultValue: this.defaultValue,
		})

		trigger.on(() => {
			ret.emit(this.value)
		})

		return ret
	}

	/**
	 * Creates an emitter that fires the 'difference value' between the value when the last event was triggered and the current value.
	 * @param fn A function to calculate the difference
	 * @param initial
	 * @param type
	 * @returns A new emitter
	 */
	delta(fn: (prev: T, curt: T) => T, initial: Maybe<T>): Emitter<T> {
		let prev: Maybe<T> = initial

		const ret = new Emitter<T>({
			original: this,
			value: bindMaybe(this.#value, v => fn(v, v)),
			defaultValue: this.defaultValue,
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
	 */
	interval(ms = 0, immediate = false) {
		const ret = new Emitter({
			original: this,
			value: this.#value,
			defaultValue: this.defaultValue,
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
			if (this.emittedValue !== undefined) {
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
	 * @group Utilities
	 */
	log(message = 'Bndr') {
		this.on(value => {
			console.log(`[${message}]`, 'Value=', value)
		})
		return this
	}
}
