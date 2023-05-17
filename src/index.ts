import hotkeys from 'hotkeys-js'
import {
	debounce,
	DebounceSettings,
	identity,
	isEqual,
	isNumber,
	throttle,
	ThrottleSettings,
} from 'lodash'
import {Memoize} from 'typescript-memoize'

import {findEqualProp} from './utils'
import {Magma, NumberType, ValueType, Vec2Type} from './ValueType'

type Listener<T> = (value: T) => void

export type Vec2 = [number, number]

const None: unique symbol = Symbol()
type Maybe<T> = T | typeof None

function bindMaybe<T, U>(value: Maybe<T>, fn: (value: T) => U): Maybe<U> {
	if (value === None) return None
	return fn(value)
}

interface BndrOptions<T> {
	value: typeof None | T
	defaultValue: T
	type?: ValueType<T> | undefined
}

const BndrInstances = new Set<Bndr>()

/**
 * A foundational value of the library, an instance representing a single *input event*. This could be user input from a mouse, keyboard, MIDI controller, gamepad etc., or the result of filtering or composing these inputs. Various operations can be attached by method chaining.
 */
export class Bndr<T = any> {
	readonly #listeners = new Set<Listener<T>>()

	readonly #defaultValue: T
	#value: Maybe<T>

	/**
	 * A linear combination function for the value of the input event. It will be used in `Bndr.lerp` function.
	 */
	public readonly type?: ValueType<T>

	constructor(options: BndrOptions<T>) {
		this.#defaultValue = options.defaultValue

		if (options.value !== undefined) {
			this.#value = options.value
		} else {
			this.#value = None
		}

		this.type = options.type

		BndrInstances.add(this)
	}

	get value(): T {
		return this.#value !== None ? this.#value : this.#defaultValue
	}

	/**
	 * Adds the `listener` function for the event
	 * @param listener The callback function
	 */
	on(listener: Listener<T>) {
		this.#listeners.add(listener)
	}

	off(listener: Listener<T>) {
		this.#listeners.delete(listener)
	}

	emit(value: T) {
		this.#value = value
		for (const listener of this.#listeners) {
			listener(value)
		}
	}

	/**
	 * Adds a *one-time* `listener` function for the event
	 * @param listener
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
	 */
	removeAllListeners() {
		this.#listeners.forEach(listener => this.off(listener))
	}

	/**
	 * Transforms the payload of event with the given function.
	 * @param fn
	 * @returns A new input event
	 */
	map<U>(fn: (value: T) => U, type?: ValueType<U>): Bndr<U> {
		const ret = new Bndr({
			value: bindMaybe(this.#value, fn),
			defaultValue: fn(this.#defaultValue),
			type,
		})

		this.on(value => ret.emit(fn(value)))

		return ret
	}

	filter(fn: (value: T) => any): Bndr<T> {
		const ret = new Bndr({
			value: bindMaybe(this.#value, v => (fn(v) !== None ? v : None)),
			defaultValue: this.#defaultValue,
		})

		this.on(value => {
			if (fn(value)) ret.emit(value)
		})

		return ret
	}

	as(type: ValueType<T>): Bndr<T> {
		const ret = new Bndr({
			value: this.#value,
			defaultValue: this.#defaultValue,
			type: type,
		})
		this.on(value => ret.emit(value))

		return ret
	}

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

	velocity(): Bndr<T> {
		const subtract = this.type?.subtract

		if (!subtract) {
			throw new Error('Cannot compute the velocity')
		}

		const ret = new Bndr({
			value: bindMaybe(this.#value, v => subtract(v, v)),
			defaultValue: subtract(this.#defaultValue, this.#defaultValue),
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

	norm(): Bndr<number> {
		const {norm} = this.type ?? {}
		if (!norm) {
			throw new Error('Cannot compute norm')
		}

		return this.map(norm, Bndr.type.number)
	}

	down(): Bndr<true> {
		return this.delta<boolean>((prev, curt) => !prev && !!curt, false)
			.filter(identity)
			.constant(true)
	}

	up(): Bndr<true> {
		return this.delta<boolean>((prev, curt) => !!prev && !curt, true)
			.filter(identity)
			.constant(true)
	}

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
	 * Creates throttled version of the input event.
	 * @param wait Milliseconds to wait.
	 * @param options
	 * @returns A new input event
	 */
	throttle(wait: number, options?: ThrottleSettings): Bndr<T> {
		const ret = new Bndr({
			...this,
			defaultValue: this.#defaultValue,
		})

		this.on(throttle(value => ret.emit(value), wait, options))

		return ret
	}

	/**
	 * Creates debounced version of the input event.
	 * @param wait Milliseconds to wait.
	 * @param options
	 * @returns A new input event
	 */
	debounce(wait: number, options: DebounceSettings) {
		const ret = new Bndr({
			...this,
			defaultValue: this.#defaultValue,
		})

		this.on(debounce(value => ret.emit(value), wait, options))

		return ret
	}

	/**
	 * Creates delayed version of the input event.
	 * @param wait Milliseconds to wait.
	 * @param options
	 * @returns A new input event
	 */
	delay(wait: number) {
		const ret = new Bndr({
			...this,
			defaultValue: this.#defaultValue,
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
			...this,
			defaultValue: this.#defaultValue,
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
			defaultValue: update(this.#defaultValue, state)[0],
		})

		this.on(value => {
			const [newValue, newState] = update(value, state)
			state = newState
			ret.emit(newValue)
		})

		return ret
	}

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

	scale(factor: number) {
		const {scale} = this.type ?? {}
		if (!scale) {
			throw new Error('Cannot scale')
		}

		return this.map(value => scale(value, factor), this.type)
	}

	accumlate(
		update: Magma<T> | undefined | null = null,
		initial = this.#defaultValue
	): Bndr<T> {
		update ??= this.type?.add
		if (!update) {
			throw new Error('Cannot accumlate')
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

	log() {
		this.on(console.log)
		return this
	}

	/**
	 * Unregisters all listeners of all Bnder instances ever created.
	 */
	static removeAllListeners() {
		BndrInstances.forEach(b => {
			b.removeAllListeners()
		})
	}

	/**
	 * Integrates multiple input events of the same type. The input event is triggered when any of the input events is triggered.
	 * @param bndrs Input events to combine.
	 * @returns A combined input event.
	 */
	static combine<T>(...events: Bndr<T>[]): Bndr<T> {
		if (events.length === 0) throw new Error('Zero-length events')

		const value = events.map(e => e.#value).find(v => v !== None) ?? None

		const ret = new Bndr({
			value,
			defaultValue: events[0].#defaultValue,
			type: findEqualProp(events, e => e.type),
		})

		const handler = (value: T) => ret.emit(value)

		events.forEach(bndr => bndr.on(handler))

		return ret
	}

	/**
	 * "Creates an input event with tuple type from given inputs.
	 * @returns An integrated input event with the tuple type of given input events.
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
		const last = events.map(e => e.value)

		const value = events.every(e => e.#value !== None)
			? events.map(e => e.#value)
			: None

		const ret = new Bndr({
			value,
			defaultValue: events.map(e => e.#defaultValue),
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
	 */
	static vec2(xAxis: Bndr<number>, yAxis: Bndr<number>): Bndr<Vec2> {
		let lastX: number = xAxis.value
		let lastY: number = yAxis.value

		const value: Maybe<Vec2> =
			xAxis.#value !== None && yAxis.#value !== None
				? [xAxis.#value, yAxis.#value]
				: None

		const ret = new Bndr<Vec2>({
			value,
			defaultValue: [xAxis.#defaultValue, yAxis.#defaultValue],
			type: Bndr.type.vec2,
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

	static type = {
		number: NumberType,
		vec2: Vec2Type,
	}

	// Predefined input devices

	@Memoize()
	static get pointer() {
		return new WindowPointerBndr()
	}

	@Memoize()
	static get keyboard() {
		return new KeyboardBndr()
	}

	@Memoize()
	static get midi() {
		return new MIDIBndr()
	}

	@Memoize()
	static get gamepad() {
		return new GamepadBndr()
	}
}

class PointerBndr extends Bndr<PointerEvent> {
	#target: Window | HTMLElement

	constructor(target: Window | HTMLElement) {
		super({
			value: None,
			defaultValue: new PointerEvent('pointermove'),
		})

		this.#target = target

		const onPointerEvent = (evt: any) => this.emit(evt)

		this.#target.addEventListener('pointermove', onPointerEvent)
		this.#target.addEventListener('pointerdown', onPointerEvent)
		this.#target.addEventListener('pointerup', onPointerEvent)
	}

	position(options?: boolean | AddEventListenerOptions) {
		const ret = new Bndr<Vec2>({
			value: None,
			defaultValue: [0, 0],
			type: Bndr.type.vec2,
		})

		this.#target.addEventListener(
			'pointermove',
			_evt => {
				const evt = _evt as PointerEvent
				ret.emit([evt.clientX, evt.clientY])
			},
			options
		)

		return ret
	}

	pressed(options?: boolean | AddEventListenerOptions): Bndr<boolean> {
		const ret = new Bndr({
			value: None,
			defaultValue: false,
		})

		this.#target.addEventListener('pointerdown', () => ret.emit(true), options)
		this.#target.addEventListener('pointerup', () => ret.emit(false), options)

		return ret
	}

	down(options?: boolean | AddEventListenerOptions): Bndr<true> {
		return this.pressed(options).down()
	}

	up(options?: boolean | AddEventListenerOptions): Bndr<true> {
		return this.pressed(options).up()
	}
}

class WindowPointerBndr extends PointerBndr {
	constructor() {
		super(window)
	}

	target(target: string | HTMLElement): PointerBndr {
		let dom: HTMLElement
		if (typeof target === 'string') {
			const _dom = document.querySelector(target) as HTMLElement | null
			if (!_dom) throw new Error('Invalid selector')
			dom = _dom
		} else {
			dom = target
		}

		return new PointerBndr(dom)
	}
}

class KeyboardBndr extends Bndr<string> {
	constructor() {
		super({
			value: None,
			defaultValue: '',
		})

		hotkeys('*', e => {
			this.emit(e.key.toLowerCase())
		})
	}

	@Memoize()
	key(key: string): Bndr<boolean> {
		const ret = new Bndr({
			value: None,
			defaultValue: false,
		})

		const handler = (evt: KeyboardEvent) => {
			ret.emit(evt.type === 'keydown')
		}

		hotkeys(key, {keyup: true}, handler)

		return ret
	}
}

type MIDIData = [number, number, number]

class MIDIBndr extends Bndr<MIDIData> {
	constructor() {
		super({
			value: None,
			defaultValue: [0, 0, 0],
		})

		this.init()
	}

	private async init() {
		const midi = await navigator.requestMIDIAccess()

		if (!midi) {
			console.error('Cannot access MIDI devices on this browser')
			return
		}

		midi.inputs.forEach(input => {
			input.addEventListener('midimessage', evt => {
				const value = [...evt.data] as MIDIData
				this.emit(value)
			})
		})
	}

	note(channel: number, note: number): Bndr<number> {
		const ret = new Bndr({
			value: None,
			defaultValue: 0,
			type: NumberType,
		})

		this.on(([status, _note, velocity]: MIDIData) => {
			if (status === 176 + channel && _note === note) {
				ret.emit(velocity)
			}
		})

		return ret
	}
}

export class GamepadBndr extends Bndr<Set<Gamepad>> {
	readonly #buttonBndrs = new Map<number, Bndr<boolean>>()
	readonly #axisBndrs = new Map<number, Bndr<Vec2>>()

	constructor() {
		super({
			value: None,
			defaultValue: new Set(),
		})

		let prevControllers = new Map<number, Gamepad>()
		let updating = false

		const onGamepadConnected = () => {
			if (updating) return

			updating = true
			requestAnimationFrame(updateStatus)
		}

		const scanGamepads = () => {
			const gamepads = navigator.getGamepads()

			const controllers = new Map<number, Gamepad>()

			for (const gamepad of gamepads) {
				if (!gamepad) continue
				controllers.set(gamepad.index, gamepad)
			}

			return controllers
		}

		const updateStatus = () => {
			const controllers = scanGamepads()

			const changedGamepads = new Set<Gamepad>()

			for (const [index, curt] of controllers.entries()) {
				const prev = prevControllers.get(index)

				if (!prev || prev === curt) continue

				let changed = false
				curt.buttons.forEach((c, i) => {
					const p = prev.buttons[i]
					if (c.pressed !== p.pressed) {
						changed = true
						this.#buttonBndrs.get(i)?.emit(c.pressed)
					}
				})

				for (let i = 0; i * 2 < curt.axes.length; i++) {
					const p: Vec2 = [prev.axes[i * 2], prev.axes[i * 2 + 1]]
					const c: Vec2 = [curt.axes[i * 2], curt.axes[i * 2 + 1]]

					if (!isEqual(p, c)) {
						changed = true
						this.#axisBndrs.get(i)?.emit(c)
					}
				}

				if (changed) {
					changedGamepads.add(curt)
				}
			}

			if (changedGamepads.size > 0) {
				this.emit(changedGamepads)
			}

			prevControllers = controllers

			if (controllers.size === 0) {
				updating = false
			} else {
				requestAnimationFrame(updateStatus)
			}
		}

		window.addEventListener('gamepadconnected', onGamepadConnected)
	}

	button(index: number): Bndr<boolean> {
		let ret = this.#buttonBndrs.get(index)

		if (!ret) {
			ret = new Bndr({
				value: None,
				defaultValue: false,
			})
			this.#buttonBndrs.set(index, ret)
		}

		return ret
	}

	axis(index: number): Bndr<Vec2> {
		let ret = this.#axisBndrs.get(index)

		if (!ret) {
			ret = new Bndr({
				value: None,
				defaultValue: [0, 0],
				type: Vec2Type,
			})
			this.#axisBndrs.set(index, ret)
		}

		return ret
	}
}
