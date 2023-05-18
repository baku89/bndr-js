import Bndr, {BndrGeneratorOptions, Vec2} from '../Bndr'
import {None} from '../utils'

class TargetedPointerBndr extends Bndr<PointerEvent> {
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

	position(options: BndrGeneratorOptions | boolean = {}) {
		const ret = new Bndr<Vec2>({
			value: None,
			defaultValue: [0, 0],
			type: Bndr.type.vec2,
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

	scroll(options: BndrGeneratorOptions | boolean = {}): Bndr<Vec2> {
		const ret = new Bndr<Vec2>({
			value: None,
			defaultValue: [0, 0],
			type: Bndr.type.vec2,
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

	pressed(options: BndrGeneratorOptions | boolean = {}): Bndr<boolean> {
		const ret = new Bndr({
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

	down(options?: BndrGeneratorOptions | boolean): Bndr<true> {
		return this.pressed(options).down()
	}

	up(options?: BndrGeneratorOptions | boolean): Bndr<true> {
		return this.pressed(options).up()
	}
}

export class PointerBndr extends TargetedPointerBndr {
	constructor() {
		super(window)
	}

	target(target: string | HTMLElement): TargetedPointerBndr {
		let dom: HTMLElement
		if (typeof target === 'string') {
			const _dom = document.querySelector(target) as HTMLElement | null
			if (!_dom) throw new Error('Invalid selector')
			dom = _dom
		} else {
			dom = target
		}

		return new TargetedPointerBndr(dom)
	}
}
