import {Mat2d, mat2d, type Vec2, vec2} from 'linearly'

import {Emitter, EmitterOptions, GeneratorOptions} from '../Emitter'
import {cancelEventBehavior} from '../utils'

interface PointerPressedGeneratorOptions extends GeneratorOptions {
	pointerCapture?: boolean
}

interface DragData {
	justStarted: boolean
	dragging: boolean
	start: Vec2
	current: Vec2
	delta: Vec2
}

type WithPointerCountData =
	| {type: 'pointerdown' | 'pointermove'; events: PointerEvent[]}
	| {type: 'pointerup'}

interface GestureTransformData {
	justStarted: boolean
	start: Mat2d
	current: Mat2d
	delta: Mat2d
	points: [Vec2, Vec2]
}

/**
 * @group Emitters
 */
export class PointerEmitter extends Emitter<PointerEvent> {
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

		if (!options.original) {
			// Register event listeners only when this is the generator emitter
			const onPointerEvent = (evt: any) => this.emit(evt)

			this.#target.addEventListener('pointermove', onPointerEvent)
			this.#target.addEventListener('pointerdown', onPointerEvent)
			this.#target.addEventListener('pointerup', onPointerEvent)
			this.#target.addEventListener('pointercancel', onPointerEvent)
		}
	}

	/**
	 * Creates a generator that emits `true` when the pointer is pressed.
	 * @group Filters
	 */
	pressed(options?: PointerPressedGeneratorOptions): Emitter<boolean> {
		return this.filterMap(e => {
			if (e.type === 'pointermove') {
				return undefined
			}

			if (options?.pointerCapture) {
				if (e.type === 'pointerdown') {
					const element = e.target as HTMLElement
					element.setPointerCapture(e.pointerId)
				}
			}

			cancelEventBehavior(e, options)

			return e.type === 'pointerdown'
		}, false)
	}

	/**
	 * Creates a generator that emits the position of the pointer.
	 * @group Filters
	 */
	position(options?: GeneratorOptions): Emitter<Vec2> {
		return this.map(e => {
			cancelEventBehavior(e, options)
			return [e.clientX, e.clientY] as Vec2
		})
	}

	/**
	 * Creates a generator that emits the pressure of the pointer.
	 * @group Filters
	 */
	pressure(): Emitter<number> {
		return this.map(e => e.pressure).change()
	}

	/**
	 * @group Filters
	 */
	twist(): Emitter<number> {
		return this.map(e => e.twist).change()
	}

	/**
	 * @group Filters
	 */
	tilt(): Emitter<Vec2> {
		return this.map(e => [e.tiltX, e.tiltY] as Vec2).change()
	}

	/**
	 * @group Filters
	 */
	size(): Emitter<Vec2> {
		return this.map(e => [e.width, e.height] as Vec2).change()
	}

	/**
	 * @group Filters
	 */
	touchCount(): Emitter<number> {
		const pointers = new Set<number>()

		return this.filterMap(e => {
			if (e.type === 'pointermove') return undefined

			console.log(e.type, e.pointerId)
			if (e.type === 'pointerdown') {
				pointers.add(e.pointerId)
			} else if (e.type === 'pointerup' || e.type === 'pointercancel') {
				pointers.delete(e.pointerId)
			}

			return pointers.size
		}, 0)
	}

	/**
	 * @group Filters
	 */
	withPointerCount(count: number): Emitter<WithPointerCountData> {
		const pointers = new Map<number, PointerEvent>()
		const prevPointerCount = 0

		return this.filterMap<WithPointerCountData>(
			e => {
				if (e.type === 'pointerdown') {
					pointers.set(e.pointerId, e)
				} else if (e.type === 'pointerup' || e.type === 'pointercancel') {
					pointers.delete(e.pointerId)
				}

				if (pointers.size !== count) {
					if (prevPointerCount === count) {
						return {type: 'pointerup'}
					} else {
						return undefined
					}
				}

				return {
					type: prevPointerCount !== count ? 'pointerdown' : 'pointermove',
					events: Array.from(pointers.values()),
				}
			},
			{type: 'pointerup'}
		)
	}

	/**
	 * @group Filters
	 */
	drag(options?: GeneratorOptions): Emitter<Omit<DragData, 'dragging'>> {
		return this.primary
			.fold<DragData>(
				(state, e) => {
					cancelEventBehavior(e, options)

					if (e.type === 'pointerdown') {
						return {
							dragging: true,
							justStarted: true,
							start: [e.clientX, e.clientY],
							current: [e.clientX, e.clientY],
							delta: [0, 0],
						}
					} else if (e.type === 'pointermove') {
						if (!state.dragging) return undefined

						const current: Vec2 = [e.clientX, e.clientY]
						const delta = vec2.sub(current, state.current)

						if (vec2.equals(delta, [0, 0])) return undefined

						return {
							dragging: true,
							justStarted: false,
							start: state.start,
							current,
							delta,
						}
					} else {
						return {
							...state,
							dragging: false,
						}
					}
				},
				{
					dragging: false,
					justStarted: false,
					start: [0, 0],
					current: [0, 0],
					delta: [0, 0],
				}
			)
			.filter(state => state.dragging)
			.map(state => {
				return {
					justStarted: state.justStarted,
					start: state.start,
					current: state.current,
					delta: state.delta,
				}
			})
	}

	/**
	 * @group Filters
	 */
	gestureTransform(): Emitter<GestureTransformData> {
		return this.withPointerCount(2).fold(
			(state: GestureTransformData, e: WithPointerCountData) => {
				if (e.type === 'pointerdown') {
					const points = e.events.map(e => vec2.of(e.clientX, e.clientY)) as [
						Vec2,
						Vec2
					]

					return {
						points,
						justStarted: true,
						start: mat2d.identity,
						current: mat2d.identity,
						delta: mat2d.identity,
					}
				} else if (e.type === 'pointermove') {
					const prevPoints = state.points
					const currentPoints = e.events.map(e =>
						vec2.of(e.clientX, e.clientY)
					) as [Vec2, Vec2]

					const delta = mat2d.fromPoints(
						[prevPoints[0], currentPoints[0]],
						[prevPoints[1], currentPoints[1]]
					)

					if (!delta) throw new Error('Invalid delta')

					return {
						points: currentPoints,
						justStarted: false,
						start: state.start,
						current: mat2d.multiply(delta, state.current),
						delta,
					}
				} else {
					return undefined
				}
			},
			{
				points: [vec2.zero, vec2.zero],
				justStarted: false,
				start: mat2d.identity,
				current: mat2d.identity,
				delta: mat2d.identity,
			}
		)
	}

	/**
	 * Creates an emitter that emits `true` at the moment the pointer is pressed.
	 * @group Filters
	 */
	down(options?: GeneratorOptions): Emitter<true> {
		return this.filterMap(e => {
			if (e.type !== 'pointerdown') {
				return undefined
			}

			cancelEventBehavior(e, options)

			return true as const
		}, true)
	}

	/**
	 * Creates an emitter that emits `true` at the moment the pointer is released.
	 * @group Filters
	 */
	up(options?: GeneratorOptions): Emitter<true> {
		return this.filterMap(e => {
			if (e.type !== 'pointerup' && e.type !== 'pointercancel') {
				return undefined
			}

			cancelEventBehavior(e, options)

			return true as const
		}, true)
	}

	/**
	 * Creates a emitter that emits only when the given button is pressed.
	 * @param button Button to watch.
	 * @returns A new emitter.
	 * @group Properties
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

	/**
	 * @group Filters
	 */
	get primary() {
		return this.button('primary')
	}

	/**
	 * @group Filters
	 */
	get secondary() {
		return this.button('secondary')
	}

	/**
	 * @group Filters
	 */
	get left() {
		return this.button('left')
	}

	/**
	 * @group Filters
	 */
	get middle() {
		return this.button('middle')
	}

	/**
	 * @group Filters
	 */
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
	 * @group Filters
	 */
	pointerType(
		type: 'mouse' | 'pen' | 'touch',
		options?: GeneratorOptions
	): PointerEmitter {
		const ret = new PointerEmitter(this.#target, {
			original: this,
		})

		this.addDerivedEmitter(ret, e => {
			if (e.pointerType === type) {
				cancelEventBehavior(e, options)
				ret.emit(e)
			}
		})

		return ret
	}

	/**
	 * @group Filters
	 */
	get mouse() {
		return this.pointerType('mouse')
	}

	/**
	 * @group Filters
	 */
	get pen() {
		return this.pointerType('pen')
	}

	/**
	 * @group Filters
	 */
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
	 * @group Generators
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

/**
 * @group Generators
 */
export function pointer(
	target: Window | HTMLElement | string = window
): PointerEmitter {
	return new PointerEmitter(target, {})
}

/**
 * @group Generators
 */
export function mouse(
	target: Window | HTMLElement | string = window
): PointerEmitter {
	return new PointerEmitter(target, {}).mouse
}

/**
 * @group Generators
 */
export function pen(
	target: Window | HTMLElement | string = window
): PointerEmitter {
	return new PointerEmitter(target, {}).pen
}

/**
 * @group Generators
 */
export function touch(
	target: Window | HTMLElement | string = window
): PointerEmitter {
	return new PointerEmitter(target, {}).touch
}
