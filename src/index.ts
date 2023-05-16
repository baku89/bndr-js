import {IterableWeakMap} from 'iterable-weak'
import {debounce, DebounceSettings, throttle, ThrottleSettings} from 'lodash'
import Mousetrap from 'mousetrap'

import {findEqualProp, lerp} from './utils'

type Callback<T> = (value: T) => void

type MixFn<T> = (a: T, b: T, t: number) => T
type SubtractFn<T> = (a: T, b: T) => T
type DistanceFn<T> = (a: T, b: T) => number

type Vec2 = [number, number]

const Uninitialized: unique symbol = Symbol()

interface BndrOptions<T> {
	on(cb: Callback<T>): void
	off(cb: Callback<T>): void

	mix?: MixFn<T>
	subtract?: SubtractFn<T>
	distance?: DistanceFn<T>
}

export default class Bndr<T> {
	public readonly on: (cb: Callback<T>) => void
	public readonly off: (cb: Callback<T>) => void

	public readonly mix?: MixFn<T>
	public readonly subtract?: SubtractFn<T>
	public readonly distance?: DistanceFn<T>

	constructor(options: BndrOptions<T>) {
		this.on = options.on
		this.off = options.off

		this.mix = options.mix
		this.subtract = options.subtract
		this.distance = options.distance
	}

	once(cb: Callback<T>) {
		const _cb = (value: T) => {
			this.off(_cb)
			cb(value)
		}
		this.on(_cb)
	}

	map<U>(fn: (value: T) => U): Bndr<U> {
		const map = new IterableWeakMap<Callback<U>, Callback<T>>()
		return new Bndr({
			on: cb => {
				const _cb = (value: T) => cb(fn(value))
				map.set(cb, _cb)
				this.on(_cb)
			},
			off: cb => {
				const _cb = map.get(cb)
				if (_cb) this.off(_cb)
			},
		})
	}

	mapToNumber(fn: (value: T) => number): Bndr<number> {
		const map = new IterableWeakMap<Callback<number>, Callback<T>>()
		return createNumericBndr({
			on: cb => {
				const _cb = (value: T) => cb(fn(value))
				map.set(cb, _cb)
				this.on(_cb)
			},
			off: cb => {
				const _cb = map.get(cb)
				if (_cb) this.off(_cb)
			},
		})
	}

	mapToVec2(fn: (value: T) => Vec2): Bndr<Vec2> {
		const map = new IterableWeakMap<Callback<Vec2>, Callback<T>>()
		return createVec2Bndr({
			on: cb => {
				const _cb = (value: T) => cb(fn(value))
				map.set(cb, _cb)
				this.on(_cb)
			},
			off: cb => {
				const _cb = map.get(cb)
				if (_cb) this.off(_cb)
			},
		})
	}

	filter(fn: (value: T) => any): Bndr<T> {
		const map = new WeakMap<Callback<T>, Callback<T>>()
		return new Bndr({
			...this,
			on: cb => {
				const _cb = (value: T) => {
					if (fn(value)) cb(value)
				}
				map.set(cb, _cb)
				this.on(_cb)
			},
			off: cb => {
				const _cb = map.get(cb)
				if (_cb) this.off(_cb)
			},
		})
	}

	changed(): Bndr<null> {
		const map = new WeakMap<Callback<null>, Callback<T>>()
		return new Bndr({
			on: cb => {
				const _cb: Callback<T> = () => cb(null)
				this.on(_cb)
			},
			off: cb => {
				const _cb = map.get(cb)
				if (_cb) this.off(_cb)
			},
		})
	}

	throttle(wait: number, options?: ThrottleSettings): Bndr<T> {
		const map = new WeakMap<Callback<T>, Callback<T>>()

		return new Bndr({
			...this,
			on: cb => {
				const _cb = throttle(cb, wait, options)
				this.on(_cb)
			},
			off: cb => {
				const _cb = map.get(cb)
				if (_cb) this.off(_cb)
			},
		})
	}

	debounce(wait: number, options: DebounceSettings) {
		const map = new WeakMap<Callback<T>, Callback<T>>()

		return new Bndr({
			...this,
			on: cb => {
				const _cb = debounce(cb, wait, options)
				this.on(_cb)
			},
			off: cb => {
				const _cb = map.get(cb)
				if (_cb) this.off(_cb)
			},
		})
	}

	delay(wait: number) {
		const map = new WeakMap<Callback<T>, Callback<T>>()

		return new Bndr({
			...this,
			on: cb => {
				const _cb = (value: T) => setTimeout(() => cb(value), wait)
				this.on(_cb)
			},
			off: cb => {
				const _cb = map.get(cb)
				if (_cb) this.off(_cb)
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

		const cbs = new Set<Callback<T>>()

		let value: typeof Uninitialized | T = Uninitialized
		let target: typeof Uninitialized | T = Uninitialized

		const update = () => {
			requestAnimationFrame(update)

			if (value === Uninitialized || target === Uninitialized) return

			const current = mix(value, target, t)

			if (!this.distance || this.distance(value, current) > threshold) {
				for (const cb of cbs) {
					cb(current)
				}
			}

			value = current
		}
		update()

		return new Bndr({
			...this,
			on: cb => {
				this.on(v => {
					if (value === Uninitialized) {
						value = v
					}
					target = v

					cbs.add(cb)
				})
			},
			off: cb => cbs.delete(cb),
			mix: this.mix,
			subtract: this.subtract,
			distance: this.distance,
		})
	}

	state<S, U>(
		update: (value: T, state: S) => [U, S],
		initialState: () => S
	): Bndr<U> {
		const map = new WeakMap<Callback<U>, Callback<T>>()
		let state = initialState()

		return new Bndr({
			on: cb => {
				const _cb = (value: T) => {
					const [v, s] = update(value, state)
					state = s
					cb(v)
				}
				map.set(cb, _cb)
				this.on(_cb)
			},
			off: cb => {
				const _cb = map.get(cb)
				if (_cb) this.off(_cb)
			},
		})
	}

	// Combinators
	static combine<T>(...bndrs: Bndr<T>[]): Bndr<T> {
		return new Bndr({
			on: cb => bndrs.forEach(b => b.on(cb)),
			off: cb => bndrs.forEach(b => b.off(cb)),
			mix: findEqualProp(bndrs, b => b.mix),
			subtract: findEqualProp(bndrs, b => b.subtract),
			distance: findEqualProp(bndrs, b => b.distance),
		})
	}

	static mergeToVec2(bndrX: Bndr<number>, bndrY: Bndr<number>): Bndr<Vec2> {
		const map = new WeakMap<
			Callback<Vec2>,
			[Callback<number>, Callback<number>]
		>()

		let lastX = 0,
			lastY = 0

		return createVec2Bndr({
			on: cb => {
				const cbx = (x: number) => {
					cb([x, lastY])
					lastX = x
				}
				const cby = (y: number) => {
					cb([lastX, y])
					lastY = y
				}
				bndrX.on(cbx)
				bndrY.on(cby)
				map.set(cb, [cbx, cby])
			},
			off: cb => {
				const cbs = map.get(cb)
				if (cbs) {
					const [cbx, cby] = cbs
					bndrX.off(cbx)
					bndrY.off(cby)
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
			const map = new WeakMap<Callback<Vec2>, any>()

			return createVec2Bndr({
				on(cb) {
					const _cb: any = (evt: PointerEvent) => cb([evt.clientX, evt.clientY])
					map.set(cb, _cb)
					target.addEventListener('pointermove', _cb, options)
				},
				off(cb) {
					const _cb = map.get(cb)
					if (_cb) target.removeEventListener('pointerdown', _cb)
				},
			})
		},
		pressed(
			target: EventTarget = window,
			options?: boolean | AddEventListenerOptions
		): Bndr<boolean> {
			const map = new WeakMap<Callback<boolean>, [any, any]>()

			return new Bndr({
				on(cb) {
					const onDown = () => cb(true)
					const onUp = () => cb(false)
					map.set(cb, [onDown, onUp])
					target.addEventListener('pointerdown', onDown, options)
					target.addEventListener('pointerup', onUp, options)
				},
				off(cb) {
					const _cbs = map.get(cb)
					if (_cbs) {
						const [onDown, onUp] = _cbs
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
				Callback<void>,
				EventListenerOrEventListenerObject
			>()

			return new Bndr({
				on: cb => {
					const _cb = () => cb()
					map.set(cb, _cb)
					target.addEventListener('pointerdown', _cb, options)
				},
				off: cb => {
					const _cb = map.get(cb)
					if (_cb) target.removeEventListener('pointerdown', _cb)
				},
			})
		},
	}

	static keyboard(keys: string | string[]) {
		return new Bndr({
			on(cb) {
				Mousetrap.bind(keys, cb)
			},
			off() {
				// TODO: Below should only unbind the cb function
				Mousetrap.unbind(keys)
			},
		})
	}

	static #midi: null | MIDIBndr = null
	static get midi(): MIDIBndr {
		return (Bndr.#midi ??= new MIDIBndr())
	}
}

function createNumericBndr(options: BndrOptions<number>): Bndr<number> {
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

class MIDIBndr extends Bndr<[number, number, number]> {
	private callbacks = new Set<Callback<[number, number, number]>>()

	constructor() {
		super({
			on: cb => this.callbacks.add(cb),
			off: cb => this.callbacks.delete(cb),
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
				const value = [...evt.data] as [number, number, number]

				for (const cb of this.callbacks) {
					cb(value)
				}
			})
		})
	}

	controlChange(channel: number, pitch: number): Bndr<number> {
		const map = new WeakMap<
			Callback<number>,
			Callback<[number, number, number]>
		>()

		return createNumericBndr({
			on: cb => {
				const _cb = ([status, _pitch, velocity]: [number, number, number]) => {
					if (status === 176 + channel && _pitch === pitch) {
						cb(velocity)
					}
				}
				this.on(_cb)
			},
			off: cb => {
				const _cb = map.get(cb)
				if (_cb) this.off(_cb)
			},
		})
	}
}
