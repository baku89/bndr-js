import {IterableWeakMap, IterableWeakSet} from 'iterable-weak'
import {debounce, DebounceSettings, throttle, ThrottleSettings} from 'lodash'
import Mousetrap from 'mousetrap'

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

export default class Bndr<T = any> {
	protected readonly _on: (listener: Listener<T>) => void
	protected readonly _off: (listener: Listener<T>) => void
	protected readonly listeners = new IterableWeakSet<Listener<T>>()

	public readonly mix?: MixFn<T>
	public readonly subtract?: SubtractFn<T>
	public readonly distance?: DistanceFn<T>

	constructor(options: BndrOptions<T>) {
		this._on = options.on
		this._off = options.off

		this.mix = options.mix
		this.subtract = options.subtract
		this.distance = options.distance

		BndrInstances.add(this)
	}

	on(listener: Listener<T>) {
		this._on(listener)
		this.listeners.add(listener)
	}

	off(listener: Listener<T>) {
		this._off(listener)
		this.listeners.delete(listener)
	}

	once(listener: Listener<T>) {
		const _listener = (value: T) => {
			this.off(_listener)
			listener(value)
		}
		this.on(_listener)
	}

	removeAllListeners() {
		this.listeners.forEach(listener => this.off(listener))
	}

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

	mapToNumber(fn: (value: T) => number): Bndr<number> {
		const map = new IterableWeakMap<Listener<number>, Listener<T>>()
		return createNumerilistenerndr({
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

	changed(): Bndr<null> {
		const map = new WeakMap<Listener<null>, Listener<T>>()
		return new Bndr({
			on: listener => {
				const _listener: Listener<T> = () => listener(null)
				this.on(_listener)
			},
			off: listener => {
				const _listener = map.get(listener)
				if (_listener) this.off(_listener)
			},
		})
	}

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
			mix: this.mix,
			subtract: this.subtract,
			distance: this.distance,
		})
	}

	state<S, U>(
		update: (value: T, state: S) => [U, S],
		initialState: () => S
	): Bndr<U> {
		const map = new WeakMap<Listener<U>, Listener<T>>()
		let state = initialState()

		return new Bndr({
			on: listener => {
				const _listener = (value: T) => {
					const [v, s] = update(value, state)
					state = s
					listener(v)
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
	static removeAllListeners() {
		BndrInstances.forEach(b => {
			b.removeAllListeners()
		})
	}

	// Combinators
	static combine<T>(...bndrs: Bndr<T>[]): Bndr<T> {
		return new Bndr({
			on: listener => bndrs.forEach(b => b.on(listener)),
			off: listener => bndrs.forEach(b => b.off(listener)),
			mix: findEqualProp(bndrs, b => b.mix),
			subtract: findEqualProp(bndrs, b => b.subtract),
			distance: findEqualProp(bndrs, b => b.distance),
		})
	}
	static mergeToVec2(bndrX: Bndr<number>, bndrY: Bndr<number>): Bndr<Vec2> {
		const map = new WeakMap<
			Listener<Vec2>,
			[Listener<number>, Listener<number>]
		>()

		let lastX = 0,
			lastY = 0

		return createVec2Bndr({
			on: listener => {
				const listenerx = (x: number) => {
					listener([x, lastY])
					lastX = x
				}
				const listenery = (y: number) => {
					listener([lastX, y])
					lastY = y
				}
				bndrX.on(listenerx)
				bndrY.on(listenery)
				map.set(listener, [listenerx, listenery])
			},
			off: listener => {
				const listeners = map.get(listener)
				if (listeners) {
					const [listenerx, listenery] = listeners
					bndrX.off(listenerx)
					bndrY.off(listenery)
				}
			},
		})
	}

	// Predefined input devices
	static pointer = {
		position(
			target: EventTarget = window,
			options?: boolean | AddEventListenerOptions
		): Bndr<Vec2> {
			const map = new WeakMap<Listener<Vec2>, any>()

			return createVec2Bndr({
				on(listener) {
					const _listener: any = (evt: PointerEvent) =>
						listener([evt.clientX, evt.clientY])
					map.set(listener, _listener)
					target.addEventListener('pointermove', _listener, options)
				},
				off(listener) {
					const _listener = map.get(listener)
					if (_listener) target.removeEventListener('pointermove', _listener)
				},
			})
		},
		pressed(
			target: EventTarget = window,
			options?: boolean | AddEventListenerOptions
		): Bndr<boolean> {
			const map = new WeakMap<Listener<boolean>, [any, any]>()

			return new Bndr({
				on(listener) {
					const onDown = () => listener(true)
					const onUp = () => listener(false)
					map.set(listener, [onDown, onUp])
					target.addEventListener('pointerdown', onDown, options)
					target.addEventListener('pointerup', onUp, options)
				},
				off(listener) {
					const _listeners = map.get(listener)
					if (_listeners) {
						const [onDown, onUp] = _listeners
						target.removeEventListener('pointerdown', onDown)
						target.removeEventListener('pointerup', onUp)
					}
				},
			})
		},
		down(
			target: EventTarget = window,
			options?: boolean | AddEventListenerOptions
		): Bndr<void> {
			const map = new WeakMap<
				Listener<void>,
				EventListenerOrEventListenerObject
			>()

			return new Bndr({
				on: listener => {
					const _listener = () => listener()
					map.set(listener, _listener)
					target.addEventListener('pointerdown', _listener, options)
				},
				off: listener => {
					const _listener = map.get(listener)
					if (_listener) target.removeEventListener('pointerdown', _listener)
				},
			})
		},
		up(
			target: EventTarget = window,
			options?: boolean | AddEventListenerOptions
		): Bndr<void> {
			const map = new WeakMap<
				Listener<void>,
				EventListenerOrEventListenerObject
			>()

			return new Bndr({
				on: listener => {
					const _listener = () => listener()
					map.set(listener, _listener)
					target.addEventListener('pointerup', _listener, options)
				},
				off: listener => {
					const _listener = map.get(listener)
					if (_listener) target.removeEventListener('pointeup', _listener)
				},
			})
		},
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

	static #midi: null | MIDIBndr = null
	static get midi(): MIDIBndr {
		return (Bndr.#midi ??= new MIDIBndr())
	}
}

function createNumerilistenerndr(options: BndrOptions<number>): Bndr<number> {
	return new Bndr({
		...options,
		mix: lerp,
		subtract: (a, b) => a - b,
		distance: (a, b) => Math.abs(a - b),
	})
}

function createVec2Bndr(options: BndrOptions<Vec2>): Bndr<Vec2> {
	return new Bndr({
		...options,
		mix(a, b, t) {
			return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
		},
		subtract(a, b) {
			return [a[0] - b[0], a[1] - b[1]]
		},
		distance(a, b) {
			return Math.hypot(a[0] - b[0], a[1] - b[0])
		},
	})
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

		return createNumerilistenerndr({
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
