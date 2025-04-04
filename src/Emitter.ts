import {
	debounce,
	DebounceSettings,
	identity,
	isEqual,
	range,
	throttle,
	ThrottleSettings,
} from 'lodash-es'

import {addEmitterInstance} from './global.js'
import {Memoized} from './memoize.js'
import {IconSequence} from './types.js'
import {bindMaybe, chainMaybeValue, Maybe} from './utils.js'

type Lerp<T> = (a: T, b: T, t: number) => T
type Listener<T> = (value: T) => void

export interface EmitterOptions<T> {
	sources?: Emitter | Emitter[]
	value?: T
	icon?: IconSequence
	onDispose?: () => void
	onReset?: () => void
}

export interface GeneratorOptions extends AddEventListenerOptions {
	preventDefault?: boolean
	stopPropagation?: boolean
}

/**
 * A foundational value of the library, an instance representing a single *event emitter*. This could be user input from a mouse, keyboard, MIDI controller, gamepad etc., or the result of filtering or composing these inputs. Various operations can be attached by method chaining.
 * @group Emitters
 */
export class Emitter<T = any> {
	constructor(options: EmitterOptions<T> = {}) {
		this.#sources = new Set([options.sources ?? []].flat())
		this.#onDispose = options.onDispose
		this.#onReset = options.onReset
		this.#value = options.value
		this.icon = options.icon

		addEmitterInstance(this)
	}

	readonly #listeners = new Set<Listener<T>>()

	icon?: IconSequence

	/**
	 * Stores all emitters that are upstream of the current emitter.
	 */
	readonly #sources: Set<Emitter>

	/**
	 * Stores all deviced events and their listeners. They will not be unregistered by `removeAllListeners`.
	 */
	protected readonly derivedEmitters = new Map<Emitter, Listener<T>>()

	protected _disposed = false

	get disposed() {
		return this._disposed
	}

	readonly #onDispose?: () => void

	/**
	 * @internal
	 */
	registerDerived(emitter: Emitter, listener: Listener<T>) {
		this.on(listener)
		this.derivedEmitters.set(emitter, listener)
	}

	/**
	 * @internal
	 */
	createDerived<U>(
		options: EmitterOptions<U> & {
			propagate: (e: T, emit: (v: U) => void) => void
		}
	): Emitter<U> {
		const emitter = new Emitter<U>({
			...options,
			sources: this,
		})

		const emit = emitter.emit.bind(emitter)

		const listener = (e: T) => {
			options.propagate(e, emit)
		}

		this.on(listener)

		this.derivedEmitters.set(emitter, listener)

		return emitter
	}

	/**
	 * @internal
	 */
	private removeDerivedEmitter(event: Emitter) {
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

		this.#onDispose?.()

		for (const source of this.#sources) {
			source.removeDerivedEmitter(this)
		}

		this._disposed = true
	}

	readonly #onReset?: () => void

	/**
	 * Returns `true` if the emitter has a state and can be reset.
	 * @group Properties
	 */
	get stateful() {
		return !!this.#onReset
	}

	/**
	 * Resets the state of the emitter.
	 * @group Event Handlers
	 */
	reset() {
		this.#onReset?.()

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
		return this
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
		return this.createDerived({
			value: chainMaybeValue(initialValue, bindMaybe(this.#value, fn)),
			propagate: (e, emit) => emit(fn(e)),
		})
	}

	/**
	 * Filters events with the given predicate function
	 * @param fn Return truthy value to pass events
	 * @returns A new emitter
	 * @group Common Filters
	 */
	filter(fn: (value: T) => any): Emitter<T> {
		return this.createDerived({
			propagate(e, emit) {
				if (fn(e)) {
					emit(e)
				}
			},
		})
	}

	/**
	 * Maps the current value to another type of value, and emits the mapped value only when the mapped value is not `undefined`.
	 * @param fn A function to map the current value. Return `undefined` to skip emitting.
	 * @group Common Filters
	 */
	filterMap<U>(fn: (value: T) => U | undefined, initialValue?: U): Emitter<U> {
		return this.createDerived({
			value: chainMaybeValue(initialValue, bindMaybe(this.#value, fn)),
			propagate(e, emit) {
				const mapped = fn(e)
				if (mapped !== undefined) {
					emit(mapped)
				}
			},
		})
	}

	/**
	 * Creates an emitter that emits at the moment the current value changes from falsy to truthy.
	 * @group Common Filters
	 */
	@Memoized()
	down(): Emitter<true> {
		const ret = this.fold((prev, curt) => !prev && !!curt, false)
			.filter(identity)
			.constant(true)
		ret.icon = this.icon
		return ret
	}

	/**
	 * Creates an emitter that emits at the moment the current value changes from falsy to truthy.
	 * @group Common Filters
	 */
	@Memoized()
	up(): Emitter<true> {
		const ret = this.fold((prev, curt) => !!prev && !curt, true)
			.filter(identity)
			.constant(true)
		ret.icon = this.icon
		return ret
	}

	/**
	 * Creates an emitter whose payload is negated.
	 * @group Common Filters
	 */
	@Memoized()
	not(): Emitter<boolean> {
		return this.map(v => !v, !this.#value)
	}

	/**
	 * Emits only when the value is changed
	 * @param equalFn A comparator function. The event will be emitted when the function returns falsy value.
	 * @returns
	 * @group Common Filters
	 */
	@Memoized()
	change(equalFn: (a: T, b: T) => boolean = isEqual): Emitter<T> {
		return this.fold<T>(
			(prev, curt) => {
				if (prev === undefined || !equalFn(prev, curt)) {
					return curt
				} else {
					return undefined
				}
			},
			this.#value as unknown as T
		)
	}

	/**
	 * Emits while the given event is truthy. The event will be also emitted when the given emitter is changed from falsy to truthy when the `resetOnDown` flag is set to true.
	 * @param emitter An emitter to filter the events
	 * @param resetOnDown If set to `true`, the returned emitter will be reset when the given emitter is down.
	 * @returns
	 * @group Common Filters
	 */
	while(emitter: Emitter<boolean>, resetOnDown = true) {
		const ret = this.createDerived<T>({
			propagate(e, emit) {
				if (emitter.value) {
					emit(e)
				}
			},
		})

		if (resetOnDown) {
			emitter.down().on(() => {
				ret.reset()
				if (this.value !== undefined) {
					ret.emit(this.value)
				}
			})
		}

		return ret
	}

	/**
	 * Splits the current emitter into multiple emitters. Each emitter emits only when the given emitter is changed to the corresponding index.
	 * @param emitter An emitter to filter the current event
	 * @param count The number of emitters to be created.
	 * @param resetOnSwitch If set to `true`, the corresponding emitter will be reset when the index of current emitter is switched.
	 * @returns
	 * @group Commom Filters
	 */
	split(emitter: Emitter<any>, count: number, resetOnSwitch = true) {
		const rets = range(0, count).map(i =>
			this.createDerived<T>({
				propagate(e, emit) {
					const index =
						typeof emitter.value === 'number'
							? emitter.value
							: emitter.value
								? 1
								: 0

					if (index === i) {
						emit(e)
					}
				},
			})
		)

		if (resetOnSwitch) {
			emitter
				.map(v => (typeof v === 'number' ? v : v ? 1 : 0))
				.change()
				.on(i => {
					if (this.value === undefined) return

					rets[i].reset()
					rets[i].emit(this.value)
				})
		}

		return rets
	}

	/**
	 * Creates an emitter that emits a constant value every time the current emitter is emitted.
	 * @see {@link https://lodash.com/docs/4.17.15#throttle}
	 * @group Common Filters
	 */
	@Memoized()
	constant<const U>(value: U): Emitter<U> {
		return this.createDerived({
			value,
			propagate(_, emit) {
				emit(value)
			},
		})
	}

	/**
	 * Creates throttled version of the current emitter.
	 * @param wait Milliseconds to wait.
	 * @param options
	 * @see {@link https://lodash.com/docs/4.17.15#debounced}
	 * @group Common Filters
	 */
	throttle(wait: number, options?: ThrottleSettings): Emitter<T> {
		const propagate = throttle(
			(value, emit) => {
				if (this._disposed) return
				emit(value)
			},
			wait,
			options
		)

		return this.createDerived({
			onDispose() {
				propagate.cancel()
			},
			propagate,
		})
	}

	/**
	 * Creates debounced version of the current emitter.
	 * @param wait Milliseconds to wait.
	 * @param options
	 * @returns A new emitter
	 * @group Common Filters
	 */
	debounce(wait: number, options: DebounceSettings) {
		const propagate = debounce(
			(value, emit) => {
				if (this._disposed) return
				emit(value)
			},
			wait,
			options
		)

		return this.createDerived({
			onDispose() {
				propagate.cancel()
			},
			propagate,
		})
	}

	/**
	 * Creates delayed version of the current emitter.
	 * @param wait Milliseconds to wait.
	 * @param options
	 * @returns A new emitter
	 * @group Common Filters
	 */
	delay(wait: number) {
		let timer: NodeJS.Timeout | undefined = undefined

		return this.createDerived({
			onDispose() {
				clearTimeout(timer)
			},
			propagate(value, emit) {
				timer = setTimeout(() => emit(value), wait)
			},
		})
	}

	/**
	 * @group Common Filters
	 */
	longPress(wait: number) {
		let timer: NodeJS.Timeout | undefined = undefined

		const pressed = this.createDerived({
			onDispose() {
				clearTimeout(timer)
			},
			propagate(value, emit) {
				if (value) {
					if (!timer) {
						timer = setTimeout(() => emit(value), wait)
					}
				} else {
					clearTimeout(timer)
					timer = undefined
				}
			},
		})

		return {pressed}
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

		const update = () => {
			if (start === undefined || end === undefined) {
				return
			}

			t = 1 - (1 - t) * (1 - rate)

			curt = lerp(start, end, t)

			if (t < 1 - threshold) {
				// During lerping
				ret.emit(curt)
				requestAnimationFrame(update)
			} else {
				// On almost reached to the target value
				ret.emit(end)
				t = 1
				start = end = undefined
			}
		}

		const ret = this.createDerived<T>({
			onDispose() {
				start = end = undefined
			},
			onReset: () => {
				curt = end
				start = end = undefined
			},
			propagate(value) {
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
			},
		})

		return ret
	}

	tween(lerp: Lerp<T>, durationMs: number): Emitter<T> {
		let startTime = 0
		let start: Maybe<T>, target: Maybe<T>

		const update = () => {
			if (start === null || target === null) {
				return
			}
			const elapsed = Date.now() - startTime
			const t = elapsed / durationMs

			if (t < 1) {
				ret.emit(lerp(start, target, t))
				requestAnimationFrame(update)
			} else {
				ret.emit(target)
				start = target = undefined
			}
		}

		const ret = this.createDerived<T>({
			onDispose() {
				start = target = undefined
			},
			onReset: () => {
				start = target = undefined
			},
			propagate(value) {
				const updating = start !== undefined && target !== undefined

				startTime = Date.now()
				start = ret.value ?? value
				target = value

				if (!updating) {
					update()
				}
			},
		})

		return ret
	}

	/**
	 * Reset the state of current emitter emitter when the given event is fired.
	 * @param emitter The emitter that triggers the current emitter to be reset.
	 * @param emitOnReset If set to `true`, the current emitter will be triggered when it is reset.
	 * @returns The current emitter emitter
	 * @group Common Filters
	 */
	resetBy(emitter: Emitter, emitOnReset = true): Emitter<T> {
		const ret = this.createDerived<T>({
			propagate: (e, emit) => emit(e),
		})

		emitter.on(value => {
			if (!value) return
			ret.reset()
			if (emitOnReset && this.value !== undefined) {
				ret.emit(this.value)
			}
		})

		return ret
	}

	/**
	 * Initializes with an `initialState` value. On each emitted event, calculates a new state based on the previous state and the current value, and emits this new state.
	 * @param fn A function to calculate a new state
	 * @param initialState An initial state value
	 * @returns A new emitter
	 * @group Common Filters
	 */
	fold<U>(
		fn: (prev: U, value: T) => U | undefined,
		initialState: U
	): Emitter<U> {
		let state = initialState

		return this.createDerived({
			onReset() {
				state = initialState
			},
			propagate(value, emit) {
				const newState = fn(state, value)
				if (newState !== undefined) {
					emit(newState)
					state = newState
				}
			},
		})
	}

	/**
	 *  Creates an emitter that emits the current value when one of the given events is fired.
	 * @param triggers Emitters to trigger the current emitter to emit.
	 * @returns A new emitter
	 * @group Common Filters
	 */
	stash(...triggers: Emitter[]) {
		const ret = new Emitter({
			sources: this,
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

		return this.createDerived({
			onReset() {
				prev = undefined
			},
			propagate(value, emit) {
				if (prev !== undefined) {
					emit(fn(prev, value))
				}
				prev = value
			},
		})
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
			sources: this,
		})

		const update = () => {
			if (this._disposed) return

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
			// eslint-disable-next-line no-console
			console.log(`[${message}]`, 'Value=', value)
		})
		return this
	}
}
