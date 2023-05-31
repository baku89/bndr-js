import {
	debounce,
	DebounceSettings,
	identity,
	isEqual,
	isNumber,
	throttle,
	ThrottleSettings,
} from 'lodash'

import type {GamepadBndr} from './generator/gamepad'
import type {KeyboardBndr} from './generator/keyboard'
import type {MIDIBndr} from './generator/midi'
import type {PointerBndr} from './generator/pointer'
import {bindMaybe, findEqualProp, Maybe, None} from './utils'
import {Magma, NumberType, ValueType, Vec2Type} from './ValueType'

type Listener<T> = (value: T) => void

export type Vec2 = [number, number]

interface BndrOptions<T> {
	value: typeof None | T
	defaultValue: T
	type?: ValueType<T> | undefined
	original?: Bndr | Bndr[]
	onDispose?: () => void
	onResetState?: () => void
}

export interface BndrGeneratorOptions extends AddEventListenerOptions {
	preventDefault?: boolean
	stopPropagation?: boolean
}

interface SpringOptions {
	rate?: number
	friction?: number
	threshold?: number
}

/**
 * Stores all Bndr instances for resetting the listeners at once
 */
export const BndrInstances = new Set<Bndr>()

/**
 * A foundational value of the library, an instance representing a single *event emitter*. This could be user input from a mouse, keyboard, MIDI controller, gamepad etc., or the result of filtering or composing these inputs. Various operations can be attached by method chaining.
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
		this.#originals = new Set([options.original ?? []].flat())
		this.#onDispose = options.onDispose
		this.#onResetState = options.onResetState

		BndrInstances.add(this)
	}

	readonly #listeners = new Set<Listener<T>>()

	readonly #originals: Set<Bndr>

	/**
	 * Stores all deviced events and their listeners. They will not be unregistered by `removeAllListeners`.
	 */
	readonly #derivedEvents = new Map<Bndr, Listener<T>>()

	readonly #onDispose?: () => void

	#addDerivedEvent(event: Bndr, listener: Listener<T>) {
		this.#derivedEvents.set(event, listener)
	}

	#removeDerivedEvent(event: Bndr) {
		this.#derivedEvents.delete(event)
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
			original.#removeDerivedEvent(this)
		}
	}

	readonly #onResetState?: () => void

	get stateful() {
		return !!this.#onResetState
	}

	reset() {
		for (const original of this.#originals) {
			original.reset()
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
	 * The latest value emitted from the emitter. If the emitter has never fired before, it fallbacks to {@link Bndr#defaultValue}.
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
	 * The latest value emitted from the emitter. If any event has fired before, it returns `undefined`.
	 * @group Properties
	 */
	get emittedValue() {
		return this.#value !== None ? this.#value : undefined
	}

	/**
	 * The value type of the current emitter. Use {@link Bndr#as} to manually annotate a value type.
	 */
	readonly type?: ValueType<T>

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
		for (const listener of this.#derivedEvents.values()) {
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
	 * Returns a new instance with the value type annotation
	 * @param type
	 * @returns
	 * @group Filters
	 */
	as(type: ValueType<T>): Bndr<T> {
		const ret = new Bndr({
			original: this,
			value: this.#value,
			defaultValue: this.defaultValue,
			type: type,
		})
		this.#addDerivedEvent(ret, value => ret.emit(value))

		return ret
	}

	/**
	 * Transforms the payload of event with the given function.
	 * @param fn
	 * @returns A new emitter
	 * @group Filters
	 */
	map<U>(fn: (value: T) => U, type?: ValueType<U>): Bndr<U> {
		const ret = new Bndr({
			original: this,
			value: bindMaybe(this.#value, fn),
			defaultValue: fn(this.defaultValue),
			type,
		})

		this.#addDerivedEvent(ret, value => ret.emit(fn(value)))

		return ret
	}

	/**
	 * Filters events with the given predicate function
	 * @param fn Return truthy value to pass events
	 * @returns
	 */
	filter(fn: (value: T) => any = identity): Bndr<T> {
		const ret = new Bndr({
			original: this,
			value: bindMaybe(this.#value, v => (fn(v) !== None ? v : None)),
			defaultValue: this.defaultValue,
			type: this.type,
		})

		this.#addDerivedEvent(ret, value => {
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
	 * Creates an emitter that fires the velocity of current emitters.
	 */
	velocity(): Bndr<T> {
		const subtract = this.type?.subtract

		if (!subtract) {
			throw new Error('Cannot compute the velocity')
		}

		const ret = new Bndr({
			original: this,
			value: bindMaybe(this.#value, v => subtract(v, v)),
			defaultValue: subtract(this.defaultValue, this.defaultValue),
			type: this.type,
		})

		let prev = this.#value

		this.#addDerivedEvent(ret, curt => {
			const velocity = subtract(curt, prev !== None ? prev : curt)
			prev = curt
			ret.emit(velocity)
		})

		return ret
	}

	/**
	 * Creates an emitter that emits the norm of current emitters.
	 */
	norm(): Bndr<number> {
		const {norm} = this.type ?? {}
		if (!norm) {
			throw new Error('Cannot compute norm')
		}

		return this.map(norm, NumberType)
	}

	/**
	 * Creates an emitter that emits at the moment the current value changes from falsy to truthy.
	 */
	down(): Bndr<true> {
		return this.delta((prev, curt) => !prev && !!curt, false)
			.filter(identity)
			.constant(true)
	}

	/**
	 * Creates an emitter that emits at the moment the current value changes from falsy to truthy.
	 */
	up(): Bndr<true> {
		return this.delta((prev, curt) => !!prev && !curt, true)
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
	 * Creates an emitter that emits a constant value every time the current emitter is emitted.
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
			original: this,
			value,
			defaultValue: value,
			type,
		})

		this.#addDerivedEvent(ret, () => ret.emit(value))

		return ret
	}

	/**
	 * Creates throttled version of the current emitter.
	 * @param wait Milliseconds to wait.
	 * @param options
	 * @see {@link https://lodash.com/docs/4.17.15#debounced}
	 */
	throttle(wait: number, options?: ThrottleSettings): Bndr<T> {
		const ret = new Bndr({
			original: this,
			value: this.#value,
			defaultValue: this.defaultValue,
			type: this.type,
			onDispose() {
				disposed = true
			},
		})

		let disposed = false

		this.#addDerivedEvent(
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
		const ret = new Bndr({
			original: this,
			value: this.#value,
			defaultValue: this.defaultValue,
			type: this.type,
			onDispose() {
				disposed = true
			},
		})

		let disposed = false

		this.#addDerivedEvent(
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
		const ret = new Bndr({
			original: this,
			value: this.#value,
			defaultValue: this.defaultValue,
			type: this.type,
			onDispose() {
				disposed = true
			},
		})

		let disposed = false

		this.#addDerivedEvent(ret, value => {
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
	lerp(rate: number, threshold = 1e-4): Bndr<T> {
		const {lerp} = this.type ?? {}
		if (!lerp) {
			throw new Error('Cannot lerp')
		}

		let curt: Maybe<T> = None
		let t = 1
		let start = this.#value
		let end = this.value

		let updating = false

		const emitter = new Bndr({
			original: this,
			value: this.#value,
			defaultValue: this.defaultValue,
			type: this.type,
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

			if (start === None) {
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

		this.#addDerivedEvent(emitter, value => {
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
	 * Creates an emitter with a spring effect appliec to the current emitter object
	 * @param options Options for the spring effect.
	 * @returns The new emitter
	 */
	spring({
		rate = 0.05,
		friction = 0.1,
		threshold = 1e-4,
	}: SpringOptions = {}): Bndr<T> {
		const {scale, add, norm, subtract} = this.type ?? {}
		if (!scale || !add || !norm || !subtract) {
			throw new Error('Cannot spring')
		}

		const zero = scale(this.value, 0)

		let curt = this.#value
		let target = this.value
		let velocity = zero
		let updating = false

		const ret = new Bndr({
			original: this,
			value: this.#value,
			defaultValue: this.defaultValue,
			type: this.type,
			onDispose: () => {
				updating = false
			},
			onResetState: () => {
				curt = this.#value
				target = this.value
				velocity = zero
				updating = false
			},
		})

		const update = () => {
			if (!updating) return

			let newValue: T
			if (curt === None) {
				newValue = target
			} else {
				velocity = add(velocity, scale(subtract(target, curt), rate))
				velocity = scale(velocity, 1 - friction)
				newValue = add(curt, velocity)
			}

			if (
				norm(subtract(newValue, target)) > threshold &&
				norm(velocity) > threshold
			) {
				// During moving
				ret.emit(newValue)
				curt = newValue
				requestAnimationFrame(update)
			} else {
				// On almost reached to the target value
				curt = target
				ret.emit(target)
				updating = false
			}
		}

		this.#addDerivedEvent(ret, value => {
			target = value

			if (!updating) {
				updating = true
				update()
			}
		})

		return ret
	}

	/**
	 * @param count
	 * @returns
	 */
	average(count: number): Bndr<T> {
		const {add, scale} = this.type ?? {}

		if (!add || !scale) {
			throw new Error('Cannot compute the average')
		}

		return this.trail(count, false).map(values => {
			if (values.length <= 1) return values[0]

			const [fst, ...rest] = values
			const s = 1 / values.length

			return rest.reduce((ave, v) => add(ave, scale(v, s)), scale(fst, s))
		}, this.type)
	}

	/**
	 * Reset the state of current emitter emitter when the given event is fired.
	 * @param emitter The emitter that triggers the current emitter to be reset.
	 * @returns The current emitter emitter
	 */
	resetBy(emitter: Bndr): Bndr<T> {
		emitter.on(() => this.reset())
		return this
	}

	/**
	 * Returns an input event with _state_. Used for realizing things like counters and toggles.
	 * @param fn A update function, which takes the current value and a value representing the internal state as arguments, and returns a tuple of the updated value and the new state.
	 * @param initial A initial value of the internal state.
	 * @returns A new emitter
	 */
	state<U, S>(fn: (value: T, state: S) => [U, S], initial: S): Bndr<U> {
		let state = initial

		const ret = new Bndr<U>({
			original: this,
			value: bindMaybe(this.#value, value => fn(value, state)[0]),
			defaultValue: fn(this.defaultValue, state)[0],
			onResetState() {
				state = initial
			},
		})

		this.#addDerivedEvent(ret, value => {
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
	fold<U>(fn: (prev: U, value: T) => U, initial: U): Bndr<U> {
		let prev = initial

		const ret = new Bndr<U>({
			original: this,
			value: initial,
			defaultValue: initial,
			onResetState: () => {
				prev = initial
			},
		})

		this.#addDerivedEvent(ret, value => {
			prev = fn(prev, value)
			ret.emit(prev)
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
	delta<U>(
		fn: (prev: T | U, curt: T) => U,
		initial: U,
		type?: ValueType<U>
	): Bndr<U> {
		let prev: T | U = initial

		const ret = new Bndr({
			original: this,
			value: bindMaybe(this.#value, v => fn(v, v)),
			defaultValue: initial,
			type: type,
		})

		this.#addDerivedEvent(ret, curt => {
			const delta = fn(prev, curt)
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
		const ret = new Bndr({
			original: this,
			value: this.#value,
			defaultValue: this.defaultValue,
			type: this.type,
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
			if (this.emittedValue !== None) {
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
	 * Continually accumulates the fired values using the given 'addition' function.
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
			original: this,
			value: initial,
			defaultValue: initial,
			type: this.type,
		})

		this.#addDerivedEvent(ret, value => {
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

	/**
	 * Disposes all Bndr instances
	 */
	static reset() {
		BndrInstances.forEach(b => {
			b.dispose()
		})
	}

	/**
	 * Collection of “value types”, which defines algebraic structure such as add, scale, and norm. Some of {@link Bndr} instances have a type information so that they can be scaled or lerped without passing function explicily. See {@link Bndr.as} and {@link Bndr#map} for more details.
	 * @group Value Type Indicators
	 */
	static type = {
		number: NumberType,
		vec2: Vec2Type,
	}

	static pointer: PointerBndr
	static keyboard: KeyboardBndr
	static midi: MIDIBndr
	static gamepad: GamepadBndr

	/**
	 * Integrates multiple input events of the same type. The input event is triggered when any of the input events is triggered.
	 * @param bndrs Input events to combine.
	 * @returns A combined input event.
	 * @group Combinators
	 */
	static combine<T>(...events: Bndr<T>[]): Bndr<T> {
		if (events.length === 0) throw new Error('Zero-length events')

		const value = events.map(e => e.emittedValue).find(v => v !== None) ?? None

		const ret = new Bndr({
			original: events,
			value,
			defaultValue: events[0].defaultValue,
			type: findEqualProp(events, e => e.type),
		})

		const emit = debounce((value: T) => ret.emit(value), 0)

		events.forEach(e => e.#addDerivedEvent(ret, emit))

		return ret
	}

	/**
	 * Creates an input event with tuple type from given inputs.
	 * @returns An integrated input event with the tuple type of given input events.
	 * @group Combinators
	 */
	static tuple<T0, T1>(e0: Bndr<T0>, e1: Bndr<T1>): Bndr<[T0, T1]>
	static tuple<T0, T1, T2>(
		e0: Bndr<T0>,
		e1: Bndr<T1>,
		e2: Bndr<T2>
	): Bndr<[T0, T1, T2]>
	static tuple<T0, T1, T2, T3>(
		e0: Bndr<T0>,
		e1: Bndr<T1>,
		e2: Bndr<T2>,
		e3: Bndr<T3>
	): Bndr<[T0, T1, T2, T3]>
	static tuple<T0, T1, T2, T3, T4>(
		e0: Bndr<T0>,
		e1: Bndr<T1>,
		e2: Bndr<T2>,
		e3: Bndr<T3>,
		e4: Bndr<T4>
	): Bndr<[T0, T1, T2, T3, T4]>
	static tuple<T0, T1, T2, T3, T4, T5>(
		e0: Bndr<T0>,
		e1: Bndr<T1>,
		e2: Bndr<T2>,
		e3: Bndr<T3>,
		e4: Bndr<T4>,
		e5: Bndr<T5>
	): Bndr<[T0, T1, T2, T3, T4, T5]>
	static tuple(...events: Bndr[]): Bndr<any> {
		let last = events.map(e => e.value)

		const value = events.every(e => e.emittedValue !== None)
			? events.map(e => e.emittedValue)
			: None

		const ret = new Bndr({
			original: events,
			value,
			defaultValue: events.map(e => e.defaultValue),
		})

		const emit = debounce(() => ret.emit(last), 0)

		events.forEach((e, i) => {
			e.#addDerivedEvent(ret, value => {
				last = [...last]
				last[i] = value
				emit()
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
	static vec2(xAxis: Bndr<number>, yAxis: Bndr<number>): Bndr<Vec2> {
		return Bndr.tuple(xAxis, yAxis).as(Bndr.type.vec2)
	}
}
