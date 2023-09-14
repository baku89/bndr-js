import type {Vec2} from 'linearly'
import {Memoize} from 'typescript-memoize'

import {Emitter, GeneratorOptions} from '../Emitter'
import {None} from '../utils'
import {Vec2Type} from '../ValueType'

export class PointerEventEmitter extends Emitter<PointerEvent> {
	/**
	 * @group Generators
	 */
	@Memoize()
	pressed(options: GeneratorOptions | boolean = {}): Emitter<boolean> {
		const doPreventDefault =
			typeof options === 'object' && options.preventDefault

		const doStopPropagation =
			typeof options === 'object' && options.stopPropagation

		return this.map(e => {
			if (e.type !== 'pointerdown' && e.type !== 'pointerup') {
				return null
			}

			if (doPreventDefault) e.preventDefault()
			if (doStopPropagation) e.stopPropagation()

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
	position(options: GeneratorOptions | boolean = {}): Emitter<Vec2> {
		const doPreventDefault =
			typeof options === 'object' && options.preventDefault

		const doStopPropagation =
			typeof options === 'object' && options.stopPropagation

		const ret = this.map(e => {
			if (e.type !== 'pointermove') {
				return null
			}

			if (doPreventDefault) e.preventDefault()
			if (doStopPropagation) e.stopPropagation()

			return [e.clientX, e.clientY]
		}).filter(v => v !== null)

		return (ret as unknown as Emitter<Vec2>).as(Vec2Type)
	}

	/**
	 * @group Generators
	 */
	@Memoize()
	scroll(options: GeneratorOptions | boolean = {}): Emitter<Vec2> {
		const ret = new Emitter<Vec2>({
			value: None,
			defaultValue: [0, 0],
			type: Vec2Type,
		})

		const doPreventDefault =
			typeof options === 'object' && options.preventDefault

		const doStopPropagation =
			typeof options === 'object' && options.stopPropagation

		const handler = (e: WheelEvent) => {
			if (doPreventDefault) e.preventDefault()
			if (doStopPropagation) e.stopPropagation()

			ret.emit([e.deltaX, e.deltaY])
		}

		this.#target.addEventListener('wheel', handler as any, options)

		return ret
	}

	/**
	 * @group Generators
	 */
	@Memoize()
	down(options?: GeneratorOptions | boolean): Emitter<true> {
		return this.pressed(options).down()
	}

	/**
	 * @group Generators
	 */
	@Memoize()
	up(options?: GeneratorOptions | boolean): Emitter<true> {
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
