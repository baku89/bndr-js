import {
	debounce,
	DebounceSettings,
	identity,
	isEqual,
	isNumber,
	throttle,
	ThrottleSettings,
} from 'lodash'

import {bindMaybe, Maybe, None} from './utils'
import {Magma, NumberType, ValueType, Vec2Type} from './ValueType'

type Listener<T> = (value: T) => void

export type Vec2 = [number, number]

interface BndrOptions<T> {
	value: typeof None | T
	defaultValue: T
	type?: ValueType<T> | undefined
}

export interface BndrGeneratorOptions extends AddEventListenerOptions {
	preventDefault?: boolean
	stopPropagation?: boolean
}

/**
 * Stores all Bndr instances for resetting the listeners at once
 */
export const BndrInstances = new Set<Bndr>()

/**
 * A foundational value of the library, an instance representing a single *input event*. This could be user input from a mouse, keyboard, MIDI controller, gamepad etc., or the result of filtering or composing these inputs. Various operations can be attached by method chaining.
 */
export class Bndr<T = any> {
	constructor(options: BndrOptions<T>) {
		this.defaultValue = options.defaultValue

		if (options.value !== undefined) {
			this.#value = options.value
		} else {
			this.#value = None
		}

		this.type = options.type

		BndrInstances.add(this)
	}

	readonly #listeners = new Set<Listener<T>>()
	#value: Maybe<T>

	/**
	 * The latest value emitted from the event. If the event has never fired before, it fallbacks to {@link Bndr#defaultValue}.
	 * @group Properties
	 */
	get value(): T {
		return this.#value !== None ? this.#value : this.defaultValue
	}

	/**
	 * The default value of the event.
	 * @group Properties
	 */
	readonly defaultValue: T

	/**
	 * The latest value emitted from the event. If the event has never fired before, it just returns `None`.
	 * @group Properties
	 */
	get emittedValue() {
		return this.#value
	}

	/**
	 * The value type of the current event. Use {@link Bndr#as} to manually indicate other value type.
	 */
	public readonly type?: ValueType<T>

	/**
	 * Adds the `listener` function for the event
	 * @param listener The callback function
	 * @group Event Handlers
	 */
	on(listener: Listener<T>) {
		this.#listeners.add(listener)
	}

	/**
	 *
	 * @param listener
	 * @group Event Handlers
	 */
	off(listener: Listener<T>) {
		this.#listeners.delete(listener)
	}

	/**
	 *
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
	 * Returnes a new instance with the value type annotation
	 * @param type
	 * @returns
	 * @group Filters
	 */
	as(type: ValueType<T>): Bndr<T> {
		const ret = new Bndr({
			value: this.#value,
			defaultValue: this.defaultValue,
			type: type,
		})
		this.on(value => ret.emit(value))

		return ret
	}

	/**
	 * Transforms the payload of event with the given function.
	 * @param fn
	 * @returns A new input event
	 * @group Filters
	 */
	map<U>(fn: (value: T) => U, type?: ValueType<U>): Bndr<U> {
		const ret = new Bndr({
			value: bindMaybe(this.#value, fn),
			defaultValue: fn(this.defaultValue),
			type,
		})

		this.on(value => ret.emit(fn(value)))

		return ret
	}

	/**
	 * Filters events with the given predicate function
	 * @param fn Return truthy value to pass events
	 * @returns
	 */
	filter(fn: (value: T) => any = identity): Bndr<T> {
		const ret = new Bndr({
			value: bindMaybe(this.#value, v => (fn(v) !== None ? v : None)),
			defaultValue: this.defaultValue,
			type: this.type,
		})

		this.on(value => {
			if (fn(value)) ret.emit(value)
		})

		return ret
	}

	scale(factor: number) {
		const {scale} = this.type ?? {}
		if (!scale) {
			throw new Error('Cannot scale')
		}

		return this.map(value => scale(value, factor), this.type)
	}

	/**
	 * Creates an event that fires the velocity of current events.
	 */
	velocity(): Bndr<T> {
		const subtract = this.type?.subtract

		if (!subtract) {
			throw new Error('Cannot compute the velocity')
		}

		const ret = new Bndr({
			value: bindMaybe(this.#value, v => subtract(v, v)),
			defaultValue: subtract(this.defaultValue, this.defaultValue),
			type: this.type,
		})

		let prev = this.#value

		this.on(curt => {
			const velocity = subtract(curt, prev !== None ? prev : curt)
			prev = curt
			ret.emit(velocity)
		})

		return ret
	}

	/**
	 * Creates an event that fires the norm of current events.
	 */
	norm(): Bndr<number> {
		const {norm} = this.type ?? {}
		if (!norm) {
			throw new Error('Cannot compute norm')
		}

		return this.map(norm, NumberType)
	}

	/**
	 * Create an event that emits the moment the current value changes from falsy to truthy.
	 */
	down(): Bndr<true> {
		return this.delta<boolean>((prev, curt) => !prev && !!curt, false)
			.filter(identity)
			.constant(true)
	}

	/**
	 * Create an event that emits the moment the current value changes from falsy to truthy.
	 */
	up(): Bndr<true> {
		return this.delta<boolean>((prev, curt) => !!prev && !curt, true)
			.filter(identity)
			.constant(true)
	}

	/**
	 * Emits only when the value is changed
	 * @param equalFn A comparator function. The event will be fired when the function returns falsy value.
	 * @returns
	 */
	change(equalFn: (a: T, b: T) => boolean = isEqual) {
		return this.trail(2, false)
			.filter(caches =>
				caches.length < 2 ? true : !equalFn(caches[0], caches[1])
			)
			.map(v => v.at(-1))
	}

	/**
	 * Create an event that emits a constant value every time the current event is emitted.
	 * @see {@link https://lodash.com/docs/4.17.15#throttle}
	 */
	constant<U>(value: U, type?: ValueType<U>): Bndr<U> {
		if (!type) {
			if (isNumber(value)) {
				type = NumberType as any
			} else if (
				Array.isArray(value) &&
				isNumber(value[0]) &&
				isNumber(value[1])
			) {
				type = Vec2Type as any
			}
		}

		const ret = new Bndr({
			value,
			defaultValue: value,
			type,
		})

		this.on(() => ret.emit(value))

		return ret
	}

	/**
	 * Creates debounced version of the current event.
	 * @param wait Milliseconds to wait.
	 * @param options
	 * @see {@link https://lodash.com/docs/4.17.15#debounced}
	 */
	throttle(wait: number, options?: ThrottleSettings): Bndr<T> {
		const ret = new Bndr({
			...this,
			defaultValue: this.defaultValue,
		})

		this.on(throttle(value => ret.emit(value), wait, options))

		return ret
	}

	/**
	 * Creates debounced version of the current event.
	 * @param wait Milliseconds to wait.
	 * @param options
	 * @returns A new input event
	 */
	debounce(wait: number, options: DebounceSettings) {
		const ret = new Bndr({
			...this,
			defaultValue: this.defaultValue,
		})

		this.on(debounce(value => ret.emit(value), wait, options))

		return ret
	}

	/**
	 * Creates delayed version of the current event.
	 * @param wait Milliseconds to wait.
	 * @param options
	 * @returns A new input event
	 */
	delay(wait: number) {
		const ret = new Bndr({
			...this,
			defaultValue: this.defaultValue,
		})

		this.on(value => setTimeout(() => ret.emit(value), wait))

		return ret
	}

	/**
	 * Smoothen the change rate of the input value.
	 * @param t The ratio of linear interpolation from the current value to the target value with each update.
	 * @mix An optional linear interpolation function. `this.mix` is used by default.
	 * @returns A new input event
	 */
	lerp(t: number, threshold = 1e-4): Bndr<T> {
		const {lerp, norm, subtract} = this.type ?? {}
		if (!lerp || !norm || !subtract) {
			throw new Error('Cannot lerp')
		}

		let curt = this.#value
		let target = this.value

		let updating = false

		const lerped = new Bndr({
			value: this.#value,
			defaultValue: this.defaultValue,
			type: this.type,
		})

		const update = () => {
			const newValue = curt === None ? target : lerp(curt, target, t)

			if (norm(subtract(newValue, target)) > threshold) {
				lerped.emit(newValue)
				curt = newValue
				requestAnimationFrame(update)
			} else {
				curt = target
				lerped.emit(target)
				updating = false
			}
		}

		this.on(value => {
			target = value

			if (!updating) {
				updating = true
				update()
			}
		})

		return lerped
	}

	average(count: number): Bndr<T> {
		const {add, scale} = this.type ?? {}

		if (!add || !scale) {
			throw new Error('Cannot compute the average')
		}

		return this.trail(count).map(values => {
			if (values.length <= 1) return values[0]

			const [fst, ...rest] = values
			const s = 1 / values.length

			return rest.reduce((ave, v) => add(ave, scale(v, s)), scale(fst, s))
		}, this.type)
	}

	/**
	 * Returns an input event with _state_. Used for realizing things like counters and toggles.
	 * @param update A update function, which takes the current value and a value representing the internal state as arguments, and returns a tuple of the updated value and the new state.
	 * @param initialState A initial value of the internal state.
	 * @returns A new input event
	 */
	state<U, S>(
		update: (value: T, state: S) => [U, S],
		initialState: S
	): Bndr<U> {
		let state = initialState

		const ret = new Bndr<U>({
			value: bindMaybe(this.#value, value => update(value, state)[0]),
			defaultValue: update(this.defaultValue, state)[0],
		})

		this.on(value => {
			const [newValue, newState] = update(value, state)
			state = newState
			ret.emit(newValue)
		})

		return ret
	}

	/**
	 *
	 * @param fn
	 * @param initial A initial value
	 * @returns
	 */
	fold<U>(fn: (prev: U, value: T) => U, initial: U): Bndr<U> {
		let prev = initial

		const ret = new Bndr<U>({
			value: initial,
			defaultValue: initial,
		})

		this.on(value => {
			prev = fn(prev, value)
			ret.emit(prev)
		})

		return ret
	}

	/**
	 * Create an event that fires the 'difference value' between the value when the last event was triggered and the current value.
	 * @param fn A function to calculate the difference
	 * @param initial
	 * @param type
	 * @returns
	 */
	delta<U>(
		fn: (prev: T | U, curt: T) => U,
		initial: U,
		type?: ValueType<U>
	): Bndr<U> {
		let prev: T | U = initial

		const ret = new Bndr({
			value: bindMaybe(this.#value, v => fn(v, v)),
			defaultValue: initial,
			type: type,
		})

		this.on(curt => {
			const delta = fn(prev, curt)
			prev = curt
			ret.emit(delta)
		})

		return ret
	}

	/**
	 * Creates an event that keeps to emit the last value of the current event at specified interval.
	 * @param ms The interval in milliseconds. Set `0` to use `requestAnimationFrame`.
	 * @returns
	 */
	interval(ms = 0) {
		const ret = new Bndr({
			value: this.#value,
			defaultValue: this.defaultValue,
			type: this.type,
		})

		if (ms <= 0) {
			const update = () => {
				ret.emit(this.value)
				requestAnimationFrame(update)
			}
			update()
		} else {
			setInterval(() => ret.emit(this.value), ms)
		}

		return ret
	}

	/**
	 * Emits an array caching a specified number of values that were fired in the past.
	 * @param count The number of cache frames. Set `0` to store caches infinitely.
	 * @param emitAtCount When set to `true`, the new event will not be fired until the trail cache reaches to the number of `count`.
	 * @returns
	 */
	trail(count = 2, emitAtCount = true): Bndr<T[]> {
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
	 * Continually accumulate the fired values using the given 'addition' function.
	 * @param update If nullish value is given, it fallbacks to `this.type.add`.
	 * @param initial Used `this.defaultValue` as a default if it's not specified.
	 * @returns
	 */
	accumulate(
		update: Magma<T> | undefined | null = null,
		initial = this.defaultValue
	): Bndr<T> {
		update ??= this.type?.add
		if (!update) {
			throw new Error('Cannot accumulate')
		}

		const _update = update

		let prev = initial

		const ret = new Bndr({
			value: initial,
			defaultValue: initial,
			type: this.type,
		})

		this.on(value => {
			const newValue = _update(prev, value)
			ret.emit(newValue)
			prev = newValue
		})

		return ret
	}

	/**
	 * @group Utilities
	 */
	log(message = 'Bndr') {
		this.on(value => {
			console.log(
				`[${message}]`,
				'Type=' + this.type?.name ?? 'undefined',
				'Value=',
				value
			)
		})
		return this
	}
}
