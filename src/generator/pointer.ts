import {Memoize} from 'typescript-memoize'

import {Emitter, GeneratorOptions, Vec2} from '../Emitter'
import {None} from '../utils'
import {Vec2Type} from '../ValueType'

/**
 * @group Generators
 */
class TargetedPointerEmitter extends Emitter<PointerEvent> {
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
	position(options: GeneratorOptions | boolean = {}) {
		const ret = new Emitter<Vec2>({
			value: None,
			defaultValue: [0, 0],
			type: Vec2Type,
		})

		const doPreventDefault =
			typeof options === 'object' && options.preventDefault

		const doStopPropagation =
			typeof options === 'object' && options.stopPropagation

		const handler = (e: PointerEvent) => {
			if (doPreventDefault) e.preventDefault()
			if (doStopPropagation) e.stopPropagation()

			ret.emit([e.clientX, e.clientY])
		}

		this.#target.addEventListener('pointermove', handler as any, options)

		return ret
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
	pressed(options: GeneratorOptions | boolean = {}): Emitter<boolean> {
		const ret = new Emitter({
			value: None,
			defaultValue: false,
		})

		const doPreventDefault =
			typeof options === 'object' && options.preventDefault

		const doStopPropagation =
			typeof options === 'object' && options.stopPropagation

		const createHandler = (value: boolean) => {
			return (e: Event) => {
				if (doPreventDefault) e.preventDefault()
				if (doStopPropagation) e.stopPropagation()

				ret.emit(value)
			}
		}

		const onDown = createHandler(true)
		const onUp = createHandler(false)

		this.#target.addEventListener('pointerdown', onDown, options)
		this.#target.addEventListener('pointerup', onUp, options)

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
