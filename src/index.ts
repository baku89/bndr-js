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

import {Magma, NumberOperation, Operation, Vec2Operation} from './operation'
import {findEqualProp} from './utils'

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
	operation?: Operation<T> | undefined
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
	public readonly operation?: Operation<T>

	constructor(options: BndrOptions<T>) {
		this.#defaultValue = options.defaultValue

		if (options.value !== undefined) {
			this.#value = options.value
		} else {
			this.#value = None
		}

		this.operation = options.operation

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
	map<U>(fn: (value: T) => U, operation?: Operation<U>): Bndr<U> {
		const ret = new Bndr({
			value: bindMaybe(this.#value, fn),
			defaultValue: fn(this.#defaultValue),
			operation,
		})

		this.on(value => ret.emit(fn(value)))

		return ret
	}

	mapToSelf(fn: (value: T) => T): Bndr<T> {
		return this.map(fn, this.operation)
	}

	/**
	 * Filters the events with given predicate function.
	 * @param fn A predicate function. An event is triggered when the return value is truthy.
	 * @returns A new input event
	 */
	filter(fn: (value: T) => any): Bndr<T> {
		const ret = new Bndr({
			...this,
			defaultValue: fn(this.#defaultValue),
		})

		this.on(value => {
			// console.log('filtere', fn(value))
			if (fn(value)) ret.emit(value)
		})

		return ret
	}

	delta<U>(fn: (prev: T | U, curt: T) => U, initial: U): Bndr<U> {
		let prev: T | U = initial

		const ret = new Bndr({
			value: bindMaybe(this.#value, v => fn(v, v)),
			defaultValue: initial,
		})

		this.on(curt => {
			const delta = fn(prev, curt)
			prev = curt
			ret.emit(delta)
		})

		return ret
	}

	velocity(): Bndr<T> {
		const subtract = this.operation?.subtract

		if (!subtract) {
			throw new Error('Cannot compute the velocity')
		}

		const ret = new Bndr({
			...this,
			value: bindMaybe(this.#value, v => subtract(v, v)),
			defaultValue: this.#defaultValue,
		})

		let prev = this.#value

		this.on(curt => {
			const velocity = subtract(curt, prev !== None ? prev : curt)
			prev = curt
			ret.emit(velocity)
		})

		return ret
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

	constant<U>(value: U): Bndr<U> {
		let operation: Operation<any> | undefined = undefined
		if (isNumber(value)) {
			operation = NumberOperation
		} else if (
			Array.isArray(value) &&
			isNumber(value[0]) &&
			isNumber(value[1])
		) {
			operation = Vec2Operation
		}

		const ret = new Bndr({
			value,
			defaultValue: value,
			operation,
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
		const {lerp, norm, subtract} = this.operation ?? {}
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
	state<S, U>(
		update: (value: T, state: S) => [U, S],
		initialState: S
	): Bndr<U> {
		let state = initialState

		const ret = new Bndr({
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

	scale(factor: number) {
		const {scale} = this.operation ?? {}
		if (!scale) {
			throw new Error('Cannot scale')
		}

		return this.mapToSelf(value => scale(value, factor))
	}

	accumlate(
		update: Magma<T> | undefined | null = null,
		initial = this.#defaultValue
	): Bndr<T> {
		update ??= this.operation?.add
		if (!update) {
			throw new Error('Cannot accumlate')
		}

		const _update = update

		let prev = initial

		const ret = new Bndr({
			value: initial,
			defaultValue: initial,
			operation: this.operation,
		})

		this.on(value => {
			const newValue = _update(prev, value)
			ret.emit(newValue)
			prev = newValue
		})

		return ret
	}

	// Static functions

	/**
	 * Unregisters all listeners of all Bnder instances ever created.
	 */
	static removeAllListeners() {
		BndrInstances.forEach(b => {
			b.removeAllListeners()
		})
	}

	// Combinators

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
			operation: findEqualProp(events, e => e.operation),
		})

		const handler = (value: T) => ret.emit(value)

		events.forEach(bndr => bndr.on(handler))

		return ret
	}

	/**
	 * "Creates an input event of type tuple `[A, B]` from two input events with types `A` and `B`.
	 * @param eventA A first input event.
	 * @param eventB A second input event.
	 * @returns An integrated input event with the tuple type of given input events.
	 */
	static merge<A, B>(eventA: Bndr<A>, eventB: Bndr<B>): Bndr<[A, B]> {
		let lastA: A = eventA.value
		let lastB: B = eventB.value

		const value =
			eventA.#value !== None && eventB.#value !== None
				? ([eventA.#value, eventB.#value] as [A, B])
				: None

		const ret = new Bndr<[A, B]>({
			value,
			defaultValue: [eventA.#defaultValue, eventB.#defaultValue],
		})

		eventA.on(a => {
			lastA = a
			ret.emit([lastA, lastB])
		})

		eventB.on(b => {
			lastB = b
			ret.emit([lastA, lastB])
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

		const value =
			xAxis.#value !== None && yAxis.#value !== None
				? ([xAxis.#value, yAxis.#value] as Vec2)
				: None

		const ret = createVec2Bndr({
			value,
			defaultValue: [xAxis.#defaultValue, yAxis.#defaultValue],
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

	static number = NumberOperation

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

const createVec2Bndr = (() => {
	return function (options: BndrOptions<Vec2>): Bndr<Vec2> {
		return new Bndr({
			...options,
			operation: Vec2Operation,
		})
	}
})()

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
			operation: Vec2Operation,
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
			operation: NumberOperation,
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
				operation: Vec2Operation,
			})
			this.#axisBndrs.set(index, ret)
		}

		return ret
	}
}
