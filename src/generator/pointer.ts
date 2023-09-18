import type {Vec2} from 'linearly'

import {Emitter, EmitterOptions, GeneratorOptions} from '../Emitter'
import {cancelEventBehavior} from '../utils'

interface PointerPressedGeneratorOptions extends GeneratorOptions {
	pointerCapture?: boolean
}
/**
 * @group Generators
 */
class PointerEmitter extends Emitter<PointerEvent> {
	#target: Window | HTMLElement

	constructor(
		target: Window | HTMLElement | string = window,
		options: Pick<EmitterOptions<PointerEvent>, 'original'> = {}
	) {
		super({
			...options,
			defaultValue: new PointerEvent('pointermove'),
		})

		let dom: HTMLElement | Window
		if (typeof target === 'string') {
			const _dom = document.querySelector(target) as HTMLElement | null
			if (!_dom) throw new Error('Invalid selector')
			dom = _dom
		} else {
			dom = target
		}

		this.#target = dom

		const onPointerEvent = (evt: any) => this.emit(evt)

		this.#target.addEventListener('pointermove', onPointerEvent)
		this.#target.addEventListener('pointerdown', onPointerEvent)
		this.#target.addEventListener('pointerup', onPointerEvent)
		this.#target.addEventListener('pointercancel', onPointerEvent)
		this.#target.addEventListener('pointerout', onPointerEvent)
		this.#target.addEventListener('pointerleave', onPointerEvent)
	}

	/**
	 * Creates a generator that emits `true` when the pointer is pressed.
	 * @group Generators
	 */
	pressed(options?: PointerPressedGeneratorOptions): Emitter<boolean> {
		return this.map(e => {
			if (e.type === 'pointermove') {
				return null
			}

			if (options?.pointerCapture) {
				if (e.type === 'pointerdown') {
					const element = e.target as HTMLElement
					element.setPointerCapture(e.pointerId)
				}
			}

			cancelEventBehavior(e, options)

			return e.type === 'pointerdown'
		}).filter(v => v !== null) as Emitter<boolean>
	}

	/**
	 * Creates a generator that emits the position of the pointer.
	 * @group Generators
	 */
	position(options?: GeneratorOptions): Emitter<Vec2> {
		const ret = this.map(e => {
			if (e.type !== 'pointermove') {
				return null
			}

			cancelEventBehavior(e, options)

			return [e.clientX, e.clientY]
		}).filter(v => v !== null)

		return ret as unknown as Emitter<Vec2>
	}

	/**
	 * Creates a generator that emits the pressure of the pointer.
	 */
	pressure(options?: GeneratorOptions): Emitter<number> {
		const ret = this.filterMap(e => {
			if (e.type !== 'pointermove') {
				return undefined
			}

			cancelEventBehavior(e, options)

			return e.pressure
		})

		return ret as unknown as Emitter<number>
	}

	/**
	 * Creates an emitter that emits `true` at the moment the pointer is pressed.
	 * @group Generators
	 */
	down(options?: GeneratorOptions): Emitter<true> {
		return this.map(e => {
			if (e.type !== 'pointerdown') {
				return null
			}

			cancelEventBehavior(e, options)

			return true
		}).filter(v => v !== null) as Emitter<true>
	}

	/**
	 * Creates an emitter that emits `true` at the moment the pointer is released.
	 * @group Generators
	 */
	up(options?: GeneratorOptions): Emitter<true> {
		return this.map(e => {
			if (e.type === 'pointerdown' || e.type === 'pointermove') {
				return null
			}

			cancelEventBehavior(e, options)

			return true
		}).filter(v => v !== null) as Emitter<true>
	}

	/**
	 * Creates a emitter that emits only when the given button is pressed.
	 * @param button Button to watch.
	 * @returns A new emitter.
	 */
	button(
		button: number | 'primary' | 'secondary' | 'left' | 'middle' | 'right'
	): PointerEmitter {
		const ret = new PointerEmitter(this.#target, {
			original: this,
		})

		this.addDerivedEmitter(ret, e => {
			if (button === 'primary') {
				if (e.isPrimary) ret.emit(e)
			} else {
				const index =
					typeof button === 'number'
						? button
						: PointerEmitter.ButtonNameToIndex.get(button) ?? 0
				if (e.button === index) ret.emit(e)
			}
		})

		return ret
	}

	get primary() {
		return this.button('primary')
	}

	get secondary() {
		return this.button('secondary')
	}

	get left() {
		return this.button('left')
	}

	get middle() {
		return this.button('middle')
	}

	get right() {
		return this.button('right')
	}

	private static ButtonNameToIndex = new Map([
		['secondary', 2],
		['left', 0],
		['middle', 1],
		['right', 2],
	])

	/**
	 * Creates a emitter that emits only when the pointer type is the given type.
	 * @param type Pointer type to watch.
	 * @returns A new emitter.
	 */
	pointerType(type: 'mouse' | 'pen' | 'touch'): PointerEmitter {
		const ret = new PointerEmitter(this.#target, {
			original: this,
		})

		this.addDerivedEmitter(ret, e => {
			if (e.pointerType === type) ret.emit(e)
		})

		return ret
	}

	get mouse() {
		return this.pointerType('mouse')
	}

	get pen() {
		return this.pointerType('pen')
	}

	get touch() {
		return this.pointerType('touch')
	}

	/**
	 * Creates a generator that emits the scroll delta of the pointer.
	 * @group Generators
	 */
	scroll(options?: GeneratorOptions): Emitter<Vec2> {
		const ret = new Emitter<Vec2>({
			defaultValue: [0, 0],
		})

		const handler = (e: WheelEvent) => {
			cancelEventBehavior(e, options)

			// NOTE: Exclude pinch gesture on trackpad by checking e.ctrlKey === true,
			// but it does not distinghish between pinch and ctrl+wheel.
			// https://github.com/pmndrs/use-gesture/discussions/518
			if (e.ctrlKey) return

			ret.emit([e.deltaX, e.deltaY])
		}

		this.#target.addEventListener('wheel', handler as any, {
			passive: false,
		})

		return ret
	}

	/**
	 * Creates a generator that emits the pinch delta of the pointer.
	 * @see https://kenneth.io/post/detecting-multi-touch-trackpad-gestures-in-javascript
	 * @param options
	 * @returns
	 */
	pinch(options?: GeneratorOptions): Emitter<number> {
		const ret = new Emitter<number>({
			defaultValue: 0,
		})

		const handler = (e: WheelEvent) => {
			cancelEventBehavior(e, options)

			// NOTE: Exclude pinch gesture on trackpad by checking e.ctrlKey === true,
			// but it does not distinghish between pinch and ctrl+wheel.
			// https://github.com/pmndrs/use-gesture/discussions/518
			if (!e.ctrlKey) return

			ret.emit(e.deltaY)
		}

		this.#target.addEventListener('wheel', handler as any, {
			passive: false,
		})

		return ret
	}
}

export function pointer(
	target: Window | HTMLElement | string = window
): PointerEmitter {
	return new PointerEmitter(target, {})
}

export function mouse(
	target: Window | HTMLElement | string = window
): PointerEmitter {
	return new PointerEmitter(target, {}).mouse
}
