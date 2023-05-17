import hotkeys from 'hotkeys-js'
import {IterableWeakMap, IterableWeakSet} from 'iterable-weak'
import {
	debounce,
	DebounceSettings,
	identity,
	isEqual,
	throttle,
	ThrottleSettings,
} from 'lodash'
import {Memoize} from 'typescript-memoize'

import {findEqualProp, lerp} from './utils'

type Listener<T> = (value: T) => void

type MixFn<T> = (a: T, b: T, t: number) => T
type SubtractFn<T> = (a: T, b: T) => T
type NormFn<T> = (t: T) => number

type Vec2 = [number, number]

const Uninitialized: unique symbol = Symbol()

interface BndrOptions<T> {
	on(listener: Listener<T>): void
	off(listener: Listener<T>): void
	lastValue?: T
	defaultValue: T

	mix?: MixFn<T>
	subtract?: SubtractFn<T>
	norm?: NormFn<T>
}

const BndrInstances = new IterableWeakSet<Bndr>()

/**
 * A foundational value of the library, an instance representing a single *input event*. This could be user input from a mouse, keyboard, MIDI controller, gamepad etc., or the result of filtering or composing these inputs. Various operations can be attached by method chaining.
 */
export class Bndr<T = any> {
	readonly #on: (listener: Listener<T>) => void
	readonly #off: (listener: Listener<T>) => void
	readonly #listeners = new IterableWeakSet<Listener<T>>()

	readonly #defaultValue: T
	readonly #lastValue: typeof Uninitialized | T

	/**
	 * A linear combination function for the value of the input event. It will be used in `Bndr.lerp` function.
	 */
	public readonly mix?: MixFn<T>
	public readonly subtract?: SubtractFn<T>
	public readonly norm?: NormFn<T>

	constructor(options: BndrOptions<T>) {
		this.#on = options.on
		this.#off = options.off

		this.#defaultValue = options.defaultValue

		if (options.lastValue !== undefined) {
			this.#lastValue = options.lastValue
		} else {
			this.#lastValue = Uninitialized
		}

		this.mix = options.mix
		this.subtract = options.subtract
		this.norm = options.norm

		BndrInstances.add(this)
	}

	getValue(): T {
		return this.#lastValue !== Uninitialized
			? this.#lastValue
			: this.#defaultValue
	}

	/**
	 * Adds the `listener` function for the event
	 * @param listener The callback function
	 */
	on(listener: Listener<T>) {
		this.#on(listener)
		this.#listeners.add(listener)
	}

	off(listener: Listener<T>) {
		this.#off(listener)
		this.#listeners.delete(listener)
	}

	emit(value: T) {
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
	map<U>(fn: (value: T) => U): Bndr<U> {
		const map = new IterableWeakMap<Listener<U>, Listener<T>>()
		return new Bndr({
			on: listener => {
				const _listener = (value: T) => listener(fn(value))
				map.set(listener, _listener)
				this.on(_listener)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) this.off(_listener)
			},
			defaultValue: fn(this.#defaultValue),
		})
	}

	/**
	 * Transforms the payload of event into number with the given function.
	 * @param fn
	 * @returns A new input event
	 */
	mapToNumber(fn: (value: T) => number = identity): Bndr<number> {
		const map = new IterableWeakMap<Listener<number>, Listener<T>>()
		return createNumberBndr({
			on: listener => {
				const _listener = (value: T) => listener(fn(value))
				map.set(listener, _listener)
				this.on(_listener)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) this.off(_listener)
			},
			defaultValue: fn(this.#defaultValue),
		})
	}

	/**
	 * Transforms the payload of event into vec2 with the given function.
	 * @param fn
	 * @returns A new input event
	 */
	mapToVec2(fn: (value: T) => Vec2 = identity): Bndr<Vec2> {
		const map = new IterableWeakMap<Listener<Vec2>, Listener<T>>()
		return createVec2Bndr({
			on: listener => {
				const _listener = (value: T) => listener(fn(value))
				map.set(listener, _listener)
				this.on(_listener)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) this.off(_listener)
			},
			defaultValue: fn(this.#defaultValue),
		})
	}

	/**
	 * Filters the events with given predicate function.
	 * @param fn A predicate function. An event is triggered when the return value is truthy.
	 * @returns A new input event
	 */
	filter(fn: (value: T) => any): Bndr<T> {
		const map = new WeakMap<Listener<T>, Listener<T>>()
		return new Bndr({
			...this,
			on: listener => {
				const _listener = (value: T) => {
					if (fn(value)) listener(value)
				}
				map.set(listener, _listener)
				this.on(_listener)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) this.off(_listener)
			},
			defaultValue: fn(this.#defaultValue),
		})
	}

	delta<U>(fn: (prev: T | U, curt: T) => U, initial: U): Bndr<U> {
		const map = new WeakMap<Listener<U>, Listener<T>>()
		let prev: T | U = initial

		return new Bndr({
			on: listener => {
				const _listener = (curt: T) => {
					const delta = fn(prev, curt)
					listener(delta)
					prev = curt
				}
				map.set(listener, _listener)
				this.on(_listener)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) this.off(_listener)
			},
			defaultValue: initial,
		})
	}

	onRise(): Bndr<null> {
		return this.delta<boolean>((prev, curt) => !prev && !!curt, false)
			.filter(identity)
			.constant(null)
	}

	onFall(): Bndr<null> {
		return this.delta<boolean>((prev, curt) => !!prev && !curt, true)
			.filter(identity)
			.constant(null)
	}

	changed(): Bndr<null> {
		return this.constant(null)
	}

	constant<U>(value: U): Bndr<U> {
		const map = new WeakMap<Listener<U>, Listener<T>>()
		return new Bndr({
			on: listener => {
				const _listener = () => listener(value)
				this.on(_listener)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) this.off(_listener)
			},
			defaultValue: value,
		})
	}

	/**
	 * Creates throttled version of the input event.
	 * @param wait Milliseconds to wait.
	 * @param options
	 * @returns A new input event
	 */
	throttle(wait: number, options?: ThrottleSettings): Bndr<T> {
		const map = new WeakMap<Listener<T>, Listener<T>>()

		return new Bndr({
			...this,
			on: listener => {
				const _listener = throttle(listener, wait, options)
				this.on(_listener)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) this.off(_listener)
			},
			defaultValue: this.#defaultValue,
		})
	}

	/**
	 * Creates debounced version of the input event.
	 * @param wait Milliseconds to wait.
	 * @param options
	 * @returns A new input event
	 */
	debounce(wait: number, options: DebounceSettings) {
		const map = new WeakMap<Listener<T>, Listener<T>>()

		return new Bndr({
			...this,
			on: listener => {
				const _listener = debounce(listener, wait, options)
				this.on(_listener)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) this.off(_listener)
			},
			defaultValue: this.#defaultValue,
		})
	}

	/**
	 * Creates delayed version of the input event.
	 * @param wait Milliseconds to wait.
	 * @param options
	 * @returns A new input event
	 */
	delay(wait: number) {
		const map = new WeakMap<Listener<T>, Listener<T>>()

		return new Bndr({
			...this,
			on: listener => {
				const _listener = (value: T) => setTimeout(() => listener(value), wait)
				this.on(_listener)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) this.off(_listener)
			},
			defaultValue: this.#defaultValue,
		})
	}

	/**
	 * Smoothen the change rate of the input value.
	 * @param t The ratio of linear interpolation from the current value to the target value with each update.
	 * @mix An optional linear interpolation function. `this.mix` is used by default.
	 * @returns A new input event
	 */
	lerp(
		t: number,
		mix: MixFn<T> | undefined = this.mix,
		threshold = 1e-4
	): Bndr<T> {
		if (!mix) {
			throw new Error('Cannot lerp')
		}

		const listeners = new Set<Listener<T>>()

		let value: typeof Uninitialized | T = Uninitialized
		let target: typeof Uninitialized | T = Uninitialized

		const lerped = new Bndr({
			...this,
			on: listener => {
				this.on(v => {
					if (value === Uninitialized) {
						value = v
					}
					target = v

					listeners.add(listener)
				})
			},
			off: listener => listeners.delete(listener),
			defaultValue: this.#defaultValue,
		})

		const update = () => {
			requestAnimationFrame(update)

			if (value === Uninitialized || target === Uninitialized) return

			const current = mix(value, target, t)

			if (
				!(this.subtract && this.norm) ||
				this.norm(this.subtract(value, current)) > threshold
			) {
				lerped.emit(current)
			}

			value = current
		}
		update()

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
		const map = new WeakMap<Listener<U>, Listener<T>>()
		let state = initialState

		return new Bndr({
			on: listener => {
				const _listener = (value: T) => {
					const [newValue, newState] = update(value, state)
					state = newState
					listener(newValue)
				}
				map.set(listener, _listener)
				this.on(_listener)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) this.off(_listener)
			},
			defaultValue: update(this.#defaultValue, state)[0],
		})
	}

	accumlate(update: (prev: T, value: T) => T): Bndr<T> {
		const map = new WeakMap<Listener<T>, Listener<T>>()

		let prev = this.#defaultValue

		return new Bndr({
			on: listener => {
				const _listener = (value: T) => {
					const newValue = update(prev, value)
					listener(newValue)
					prev = newValue
				}
				map.set(listener, _listener)
				this.on(_listener)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) this.off(_listener)
			},
			defaultValue: this.#defaultValue,
		})
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

		return new Bndr({
			on: listener => events.forEach(b => b.on(listener)),
			off: listener => events.forEach(b => b.off(listener)),
			defaultValue: events[0].#defaultValue,
			mix: findEqualProp(events, b => b.mix),
			subtract: findEqualProp(events, b => b.subtract),
			norm: findEqualProp(events, b => b.norm),
		})
	}

	/**
	 * "Creates an input event of type tuple `[A, B]` from two input events with types `A` and `B`.
	 * @param eventA A first input event.
	 * @param eventB A second input event.
	 * @returns An integrated input event with the tuple type of given input events.
	 */
	static merge<A, B>(eventA: Bndr<A>, eventB: Bndr<B>): Bndr<[A, B]> {
		const map = new WeakMap<Listener<[A, B]>, [Listener<A>, Listener<B>]>()

		let lastA: typeof Uninitialized | A = Uninitialized
		let lastB: typeof Uninitialized | B = Uninitialized

		return new Bndr({
			on: listener => {
				const aListener = (a: A) => {
					if (lastB !== Uninitialized) {
						listener([a, lastB])
					}
					lastA = a
				}

				const bListener = (b: B) => {
					if (lastA !== Uninitialized) {
						listener([lastA, b])
					}
					lastB = b
				}

				eventA.on(aListener)
				eventB.on(bListener)

				map.set(listener, [aListener, bListener])
			},
			off: listener => {
				const listeners = map.get(listener)
				if (listeners) {
					const [aListener, bListener] = listeners
					eventA.off(aListener)
					eventB.off(bListener)
				}
			},
			defaultValue: [eventA.#defaultValue, eventB.#defaultValue],
		})
	}

	/**
	 * Creates a 2D numeric input event with given input events for each dimension.
	 * @param xAxis A numeric input event for X axis.
	 * @param yAxis A numeric input event for Y axis.
	 * @returns An input event of Vec2.
	 */
	static mergeToVec2(xAxis: Bndr<number>, yAxis: Bndr<number>): Bndr<Vec2> {
		const map = new WeakMap<
			Listener<Vec2>,
			[Listener<number>, Listener<number>]
		>()

		let lastX = 0,
			lastY = 0

		return createVec2Bndr({
			on: listener => {
				const xListener = (x: number) => {
					listener([x, lastY])
					lastX = x
				}
				const yListener = (y: number) => {
					listener([lastX, y])
					lastY = y
				}
				xAxis.on(xListener)
				yAxis.on(yListener)
				map.set(listener, [xListener, yListener])
			},
			off: listener => {
				const listeners = map.get(listener)
				if (listeners) {
					const [listenerx, listenery] = listeners
					xAxis.off(listenerx)
					yAxis.off(listenery)
				}
			},
			defaultValue: [xAxis.#defaultValue, yAxis.#defaultValue],
		})
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

const createNumberBndr = (() => {
	const subtract = (a: number, b: number) => a - b
	const norm = Math.abs

	return function (options: BndrOptions<number>): Bndr<number> {
		return new Bndr({
			...options,
			mix: lerp,
			subtract,
			norm,
		})
	}
})()

const createVec2Bndr = (() => {
	function mix(a: Vec2, b: Vec2, t: number): Vec2 {
		return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
	}

	function subtract(a: Vec2, b: Vec2): Vec2 {
		return [a[0] - b[0], a[1] - b[1]]
	}

	function norm(v: Vec2): number {
		return Math.hypot(v[0], v[1])
	}

	return function (options: BndrOptions<Vec2>): Bndr<Vec2> {
		return new Bndr({
			...options,
			mix,
			subtract,
			norm,
		})
	}
})()

class PointerBndr extends Bndr<PointerEvent> {
	#target: Window | HTMLElement

	constructor(target: Window | HTMLElement) {
		super({
			on: () => null,
			off: () => null,
			defaultValue: new PointerEvent('pointermove'),
		})

		this.#target = target

		const onPointerEvent = (evt: any) => this.emit(evt)

		this.#target.addEventListener('pointermove', onPointerEvent)
		this.#target.addEventListener('pointerdown', onPointerEvent)
		this.#target.addEventListener('pointerup', onPointerEvent)
	}

	position(options?: boolean | AddEventListenerOptions) {
		const ret = createVec2Bndr({
			on: () => null,
			off: () => null,
			defaultValue: [0, 0],
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
			on: () => null,
			off: () => null,
			defaultValue: false,
		})

		this.#target.addEventListener('pointerdown', () => ret.emit(true), options)
		this.#target.addEventListener('pointerup', () => ret.emit(false), options)

		return ret
	}

	down(options?: boolean | AddEventListenerOptions): Bndr<null> {
		return this.pressed(options).onRise()
	}

	up(options?: boolean | AddEventListenerOptions): Bndr<null> {
		return this.pressed(options).onFall()
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
			on: () => null,
			off: () => null,
			defaultValue: '',
		})

		hotkeys('*', e => {
			this.emit(e.key.toLowerCase())
		})
	}

	@Memoize()
	key(key: string): Bndr<boolean> {
		const ret = new Bndr({
			on: () => null,
			off: () => null,
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
			on: () => null,
			off: () => null,
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
		const map = new WeakMap<Listener<number>, Listener<MIDIData>>()

		return createNumberBndr({
			on: listener => {
				const _listener = ([status, _note, velocity]: MIDIData) => {
					if (status === 176 + channel && _note === note) {
						listener(velocity)
					}
				}
				this.on(_listener)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) this.off(_listener)
			},
			defaultValue: 0,
		})
	}

	normalized = new MIDINormalizedBndr(this)
}

class MIDINormalizedBndr extends Bndr<MIDIData> {
	constructor(private readonly midiBndr: MIDIBndr) {
		const map = new WeakMap<Listener<MIDIData>, Listener<MIDIData>>()
		super({
			on: listener => {
				const _listener = ([s, p, v]: MIDIData) => listener([s, p, v / 127])
				map.set(listener, _listener)
				midiBndr.on(_listener)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) midiBndr.off(_listener)
			},
			defaultValue: [0, 0, 0],
		})
	}

	note(channel: number, pitch: number) {
		return this.midiBndr.note(channel, pitch).mapToNumber(v => v / 127)
	}
}

export class GamepadBndr extends Bndr<Set<Gamepad>> {
	readonly #buttonBndrs = new Map<number, Bndr<boolean>>()
	readonly #axisBndrs = new Map<number, Bndr<Vec2>>()

	constructor() {
		super({
			on: () => null,
			off: () => null,
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
				on: () => null,
				off: () => null,
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
				on: () => null,
				off: () => null,
				defaultValue: [0, 0],
			})
			this.#axisBndrs.set(index, ret)
		}

		return ret
	}
}
