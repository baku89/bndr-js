import {IterableWeakMap, IterableWeakSet} from 'iterable-weak'
import {debounce, DebounceSettings, throttle, ThrottleSettings} from 'lodash'
import Mousetrap from 'mousetrap'
import {Memoize} from 'typescript-memoize'

import {findEqualProp, lerp} from './utils'

type Listener<T> = (value: T) => void

type MixFn<T> = (a: T, b: T, t: number) => T
type SubtractFn<T> = (a: T, b: T) => T
type DistanceFn<T> = (a: T, b: T) => number

type Vec2 = [number, number]

const Uninitialized: unique symbol = Symbol()

interface BndrOptions<T> {
	on(listener: Listener<T>): void
	off(listener: Listener<T>): void

	mix?: MixFn<T>
	subtract?: SubtractFn<T>
	distance?: DistanceFn<T>
}

const BndrInstances = new IterableWeakSet<Bndr>()

/**
 * A foundational value of the library, an instance representing a single *input event*. This could be user input from a mouse, keyboard, MIDI controller, gamepad etc., or the result of filtering or composing these inputs. Various operations can be attached by method chaining.
 */
export class Bndr<T = any> {
	readonly #on: (listener: Listener<T>) => void
	readonly #off: (listener: Listener<T>) => void
	readonly #listeners = new IterableWeakSet<Listener<T>>()

	/**
	 * A linear combination function for the value of the input event. It will be used in `Bndr.lerp` function.
	 */
	public readonly mix?: MixFn<T>
	public readonly subtract?: SubtractFn<T>
	public readonly distance?: DistanceFn<T>

	constructor(options: BndrOptions<T>) {
		this.#on = options.on
		this.#off = options.off

		this.mix = options.mix
		this.subtract = options.subtract
		this.distance = options.distance

		BndrInstances.add(this)
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
		})
	}

	/**
	 * Transforms the payload of event into number with the given function.
	 * @param fn
	 * @returns A new input event
	 */
	mapToNumber(fn: (value: T) => number): Bndr<number> {
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
		})
	}

	/**
	 * Transforms the payload of event into vec2 with the given function.
	 * @param fn
	 * @returns A new input event
	 */
	mapToVec2(fn: (value: T) => Vec2): Bndr<Vec2> {
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
		})
	}

	changed(): Bndr<void> {
		const map = new WeakMap<Listener<void>, Listener<T>>()
		return new Bndr({
			on: listener => {
				const _listener: Listener<T> = () => listener()
				this.on(_listener)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) this.off(_listener)
			},
		})
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

		const update = () => {
			requestAnimationFrame(update)

			if (value === Uninitialized || target === Uninitialized) return

			const current = mix(value, target, t)

			if (!this.distance || this.distance(value, current) > threshold) {
				for (const listener of listeners) {
					listener(current)
				}
			}

			value = current
		}
		update()

		return new Bndr({
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
		})
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
	static combine<T>(...bndrs: Bndr<T>[]): Bndr<T> {
		return new Bndr({
			on: listener => bndrs.forEach(b => b.on(listener)),
			off: listener => bndrs.forEach(b => b.off(listener)),
			mix: findEqualProp(bndrs, b => b.mix),
			subtract: findEqualProp(bndrs, b => b.subtract),
			distance: findEqualProp(bndrs, b => b.distance),
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
		})
	}

	// Predefined input devices

	@Memoize()
	static get pointer() {
		return new PointerBndr()
	}

	static keyboard(keys: string | string[]) {
		return new Bndr({
			on(listener) {
				Mousetrap.bind(keys, listener)
			},
			off() {
				// TODO: Below should only unbind the listener function
				Mousetrap.unbind(keys)
			},
		})
	}

	@Memoize()
	static get midi() {
		return new MIDIBndr()
	}
}

const createNumberBndr = (() => {
	const subtract = (a: number, b: number) => a - b
	const distance = (a: number, b: number) => Math.abs(a - b)

	return function (options: BndrOptions<number>): Bndr<number> {
		return new Bndr({
			...options,
			mix: lerp,
			subtract,
			distance,
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

	function distance(a: Vec2, b: Vec2): number {
		return Math.hypot(a[0] - b[0], a[1] - b[0])
	}

	return function (options: BndrOptions<Vec2>): Bndr<Vec2> {
		return new Bndr({
			...options,
			mix,
			subtract,
			distance,
		})
	}
})()

class PointerBndr extends Bndr<PointerEvent> {
	#pointerListeners = new Set<Listener<PointerEvent>>()
	#lastEvent: null | PointerEvent = null

	constructor() {
		super({
			on: listener => this.#pointerListeners.add(listener),
			off: listener => this.#pointerListeners.delete(listener),
		})

		const onPointerEvent = (evt: PointerEvent) => {
			this.#pointerListeners.forEach(listener => listener(evt))
			this.#lastEvent = evt
		}

		window.addEventListener('pointermove', onPointerEvent)
		window.addEventListener('pointerdown', onPointerEvent)
		window.addEventListener('pointerup', onPointerEvent)
	}

	position(options?: boolean | AddEventListenerOptions) {
		const map = new WeakMap<Listener<Vec2>, any>()

		return createVec2Bndr({
			on(listener) {
				const _listener: any = (evt: PointerEvent) =>
					listener([evt.clientX, evt.clientY])
				map.set(listener, _listener)
				window.addEventListener('pointermove', _listener, options)
			},
			off(listener) {
				const _listener = map.get(listener)
				if (_listener) window.removeEventListener('pointermove', _listener)
			},
		})
	}

	pressed(options?: boolean | AddEventListenerOptions): Bndr<boolean> {
		const map = new WeakMap<Listener<boolean>, [any, any]>()

		return new Bndr({
			on(listener) {
				const onDown = () => listener(true)
				const onUp = () => listener(false)
				map.set(listener, [onDown, onUp])
				window.addEventListener('pointerdown', onDown, options)
				window.addEventListener('pointerup', onUp, options)
			},
			off(listener) {
				const _listeners = map.get(listener)
				if (_listeners) {
					const [onDown, onUp] = _listeners
					window.removeEventListener('pointerdown', onDown)
					window.removeEventListener('pointerup', onUp)
				}
			},
		})
	}

	down(options?: boolean | AddEventListenerOptions): Bndr<void> {
		const map = new WeakMap<
			Listener<void>,
			EventListenerOrEventListenerObject
		>()

		return new Bndr({
			on: listener => {
				const _listener = () => listener()
				map.set(listener, _listener)
				window.addEventListener('pointerdown', _listener, options)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) window.removeEventListener('pointerdown', _listener)
			},
		})
	}

	up(options?: boolean | AddEventListenerOptions): Bndr<void> {
		const map = new WeakMap<
			Listener<void>,
			EventListenerOrEventListenerObject
		>()

		return new Bndr({
			on: listener => {
				const _listener = () => listener()
				map.set(listener, _listener)
				window.addEventListener('pointerup', _listener, options)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) window.removeEventListener('pointeup', _listener)
			},
		})
	}
}

type MIDIData = [number, number, number]

class MIDIBndr extends Bndr<MIDIData> {
	private midiListeners = new Set<Listener<MIDIData>>()

	constructor() {
		super({
			on: listener => this.midiListeners.add(listener),
			off: listener => this.midiListeners.delete(listener),
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

				for (const listener of this.midiListeners) {
					listener(value)
				}
			})
		})
	}

	controlChange(channel: number, pitch: number): Bndr<number> {
		const map = new WeakMap<Listener<number>, Listener<MIDIData>>()

		return createNumberBndr({
			on: listener => {
				const _listener = ([status, _pitch, velocity]: MIDIData) => {
					if (status === 176 + channel && _pitch === pitch) {
						listener(velocity)
					}
				}
				this.on(_listener)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) this.off(_listener)
			},
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
		})
	}

	controlChange(channel: number, pitch: number) {
		return this.midiBndr.controlChange(channel, pitch).mapToNumber(v => v / 127)
	}
}
