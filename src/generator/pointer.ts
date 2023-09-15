import type {Vec2} from 'linearly'
import {Memoize} from 'typescript-memoize'

import {Emitter, GeneratorOptions} from '../Emitter'
import {None} from '../utils'
import {NumberType, Vec2Type} from '../ValueType'

interface PointerPressedGeneratorOptions extends GeneratorOptions {
	pointerCapture?: boolean
}

export class PointerEventEmitter extends Emitter<PointerEvent> {
	/**
	 * @group Generators
	 */
	@Memoize()
	pressed(options?: PointerPressedGeneratorOptions): Emitter<boolean> {
		return this.map(e => {
			if (e.type !== 'pointerdown' && e.type !== 'pointerup') {
				return null
			}

			if (options?.pointerCapture) {
				const element = e.target as HTMLElement
				if (e.type === 'pointerdown') {
					element.setPointerCapture(e.pointerId)
				} else {
					element.releasePointerCapture(e.pointerId)
				}
			}

			if (options?.preventDefault) e.preventDefault()
			if (options?.stopPropagation) e.stopPropagation()

			return e.type === 'pointerdown'
		}).filter(v => v !== null) as Emitter<boolean>
	}
}

/**
 * @group Generators
 */
class TargetedPointerEmitter extends PointerEventEmitter {
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

	/**
	 * @group Generators
	 */
	@Memoize()
	position(options?: GeneratorOptions): Emitter<Vec2> {
		const ret = this.map(e => {
			if (e.type !== 'pointermove') {
				return null
			}

			if (options?.preventDefault) e.preventDefault()
			if (options?.stopPropagation) e.stopPropagation()

			return [e.clientX, e.clientY]
		}).filter(v => v !== null)

		return (ret as unknown as Emitter<Vec2>).as(Vec2Type)
	}

	/**
	 * @group Generators
	 */
	@Memoize()
	scroll(options?: GeneratorOptions): Emitter<Vec2> {
		const ret = new Emitter<Vec2>({
			value: None,
			defaultValue: [0, 0],
			type: Vec2Type,
		})

		const handler = (e: WheelEvent) => {
			if (options?.preventDefault) e.preventDefault()

			// Exclude pinch gesture on trackpad by checking e.ctrlKey === true,
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

	@Memoize()
	pinch(options?: GeneratorOptions): Emitter<number> {
		const ret = new Emitter<number>({
			value: None,
			defaultValue: 0,
			type: NumberType,
		})

		const handler = (e: WheelEvent) => {
			if (options?.preventDefault) e.preventDefault()

			// Exclude pinch gesture on trackpad by checking e.ctrlKey === true,
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

	/**
	 * @group Generators
	 */
	@Memoize()
	down(options?: GeneratorOptions): Emitter<true> {
		return this.pressed(options).down()
	}

	/**
	 * @group Generators
	 */
	@Memoize()
	up(options?: GeneratorOptions): Emitter<true> {
		return this.pressed(options).up()
	}

	@Memoize()
	button(
		button: number | 'primary' | 'secondary' | 'left' | 'middle' | 'right'
	): PointerEventEmitter {
		const ret = new PointerEventEmitter({
			original: this,
			value: None,
			defaultValue: new PointerEvent('pointermove'),
		})

		this.addDerivedEvent(ret, e => {
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
}

/**
 * @group Generators
 */
export class PointerEmitter extends TargetedPointerEmitter {
	constructor() {
		super(window)
	}

	/**
	 *
	 * @param target A DOM element to watch the pointer event
	 * @returns
	 * @group Generators
	 */
	target(target: string | HTMLElement): TargetedPointerEmitter {
		let dom: HTMLElement
		if (typeof target === 'string') {
			const _dom = document.querySelector(target) as HTMLElement | null
			if (!_dom) throw new Error('Invalid selector')
			dom = _dom
		} else {
			dom = target
		}

		return new TargetedPointerEmitter(dom)
	}
}
