import type {Vec2} from 'linearly'

import {Emitter, GeneratorOptions} from '../Emitter'

interface PointerPressedGeneratorOptions extends GeneratorOptions {
	pointerCapture?: boolean
}

export class PointerEventEmitter extends Emitter<PointerEvent> {
	/**
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

			if (options?.preventDefault) e.preventDefault()
			if (options?.stopPropagation) e.stopPropagation()

			return e.type === 'pointerdown'
		}).filter(v => v !== null) as Emitter<boolean>
	}

	/**
	 * @group Generators
	 */
	position(options?: GeneratorOptions): Emitter<Vec2> {
		const ret = this.map(e => {
			if (e.type !== 'pointermove') {
				return null
			}

			if (options?.preventDefault) e.preventDefault()
			if (options?.stopPropagation) e.stopPropagation()

			return [e.clientX, e.clientY]
		}).filter(v => v !== null)

		return ret as unknown as Emitter<Vec2>
	}

	/**
	 * @group Generators
	 */
	down(options?: GeneratorOptions): Emitter<true> {
		return this.map(e => {
			if (e.type !== 'pointerdown') {
				return null
			}

			if (options?.preventDefault) e.preventDefault()
			if (options?.stopPropagation) e.stopPropagation()

			return true
		}).filter(v => v !== null) as Emitter<true>
	}

	/**
	 * @group Generators
	 */
	up(options?: GeneratorOptions): Emitter<true> {
		return this.map(e => {
			if (e.type === 'pointerdown' || e.type === 'pointermove') {
				return null
			}

			if (options?.preventDefault) e.preventDefault()
			if (options?.stopPropagation) e.stopPropagation()

			return true
		}).filter(v => v !== null) as Emitter<true>
	}

	button(
		button: number | 'primary' | 'secondary' | 'left' | 'middle' | 'right'
	): PointerEventEmitter {
		const ret = new PointerEventEmitter({
			original: this,
			defaultValue: this.defaultValue,
		})

		this.addDerivedEmitter(ret, e => {
			if (button === 'primary') {
				if (e.isPrimary) ret.emit(e)
			} else {
				const index =
					typeof button === 'number'
						? button
						: PointerEventEmitter.ButtonNameToIndex.get(button) ?? 0
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

	pointerType(type: 'mouse' | 'pen' | 'touch'): PointerEventEmitter {
		const ret = new PointerEventEmitter({
			original: this,
			defaultValue: this.defaultValue,
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
}

/**
 * @group Generators
 */
class TargetedPointerEmitter extends PointerEventEmitter {
	#target: Window | HTMLElement

	constructor(target: Window | HTMLElement | string = window) {
		super({
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
	 * @group Generators
	 */
	scroll(options?: GeneratorOptions): Emitter<Vec2> {
		const ret = new Emitter<Vec2>({
			defaultValue: [0, 0],
		})

		const handler = (e: WheelEvent) => {
			if (options?.preventDefault) e.preventDefault()
			if (options?.stopPropagation) e.stopPropagation()

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

	pinch(options?: GeneratorOptions): Emitter<number> {
		const ret = new Emitter<number>({
			defaultValue: 0,
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
}

export function pointer(
	target: Window | HTMLElement | string = window
): TargetedPointerEmitter {
	return new TargetedPointerEmitter(target)
}
