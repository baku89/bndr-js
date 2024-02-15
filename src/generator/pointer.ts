import {mat2d, vec2} from 'linearly'

import {Emitter, EmitterOptions, GeneratorOptions} from '../Emitter'
import {Memoized, memoizeFunction} from '../memoize'
import {cancelEventBehavior} from '../utils'

type PointerEmitterTarget = Window | HTMLElement | string

interface PointerPressedGeneratorOptions extends GeneratorOptions {
	/**
	 * Whether to capture the pointer.
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
	 */
	pointerCapture?: boolean
}

interface PointerPositionGeneratorOptions extends GeneratorOptions {
	/**
	 * 'client' means the position is relative to the client area of the window, and 'offset' means the position is relative to the offset of the target element.
	 * @default 'client'
	 */
	coordinate?: 'client' | 'offset'
}

type PointerDragGeneratorOptions = PointerPressedGeneratorOptions &
	PointerPositionGeneratorOptions & {
		/**
		 * The element to be the origin of the coordinate when options.coordinate is 'offset'
		 */
		origin?: HTMLElement
		/**
		 * The selector to filter the event target.
		 */
		selector?: string
	}

export interface DragData {
	/**
	 * The type of the event.
	 */
	type: 'down' | 'drag' | 'up'
	/**
	 * The position of the pointer when the drag started.
	 */
	start: vec2
	/**
	 * The current position of the pointer.
	 */
	current: vec2
	/**
	 * The delta of the pointer position.
	 */
	delta: vec2
	/**
	 * The original pointer event.
	 */
	event: PointerEvent
}

type WithPointerCountData =
	| {
			type: 'pointerdown' | 'pointermove'

			/**
			 * The list of pointer events.
			 */
			events: PointerEvent[]
	  }
	| {type: 'pointerup'}

interface GestureTransformData {
	justStarted: boolean
	start: mat2d
	current: mat2d
	delta: mat2d
	points: [vec2, vec2]
}

/**
 * @group Emitters
 */
export class PointerEmitter extends Emitter<PointerEvent> {
	#target: Window | HTMLElement

	constructor(
		target: PointerEmitterTarget = window,
		options: Pick<EmitterOptions<PointerEmitter>, 'sources'> = {}
	) {
		super(options)

		let dom: HTMLElement | Window
		if (typeof target === 'string') {
			const _dom = document.querySelector(target) as HTMLElement | null
			if (!_dom) throw new Error('Invalid selector')
			dom = _dom
		} else {
			dom = target
		}

		this.#target = dom

		if (!options.sources) {
			// Register event listeners only when this is the generator emitter
			const onPointerEvent = (evt: any) => this.emit(evt)

			this.#target.addEventListener('pointermove', onPointerEvent)
			this.#target.addEventListener('pointerdown', onPointerEvent)
			this.#target.addEventListener('pointerup', onPointerEvent)
			this.#target.addEventListener('pointerleave', onPointerEvent)
			this.#target.addEventListener('pointercancel', onPointerEvent)
		}
	}

	/**
	 * Creates a generator that emits `true` when the pointer is pressed.
	 * @group Filters
	 */
	@Memoized()
	pressed(options?: PointerPressedGeneratorOptions): Emitter<boolean> {
		return this.filterMap(e => {
			if (e.type === 'pointermove') return

			cancelEventBehavior(e, options)

			if (options?.pointerCapture && e.type === 'pointerdown') {
				const element = e.target as HTMLElement
				element.setPointerCapture(e.pointerId)
			}

			return e.type === 'pointerdown'
		}, false)
	}

	/**
	 * Creates a generator that emits the position of the pointer.
	 * @group Filters
	 */
	@Memoized()
	position(options?: PointerPositionGeneratorOptions): Emitter<vec2> {
		return this.map(event => {
			cancelEventBehavior(event, options)

			if (
				options?.coordinate === 'offset' &&
				this.#target instanceof HTMLElement
			) {
				const {left, top} = this.#target.getBoundingClientRect()
				return [event.clientX - left, event.clientY - top] as vec2
			}

			return [event.clientX, event.clientY]
		})
	}

	/**
	 * Creates a generator that emits the pressure of the pointer.
	 * @group Filters
	 */
	@Memoized()
	pressure(): Emitter<number> {
		return this.map(e => e.pressure).change()
	}

	/**
	 * @group Filters
	 */
	@Memoized()
	twist(): Emitter<number> {
		return this.map(e => e.twist).change()
	}

	/**
	 * @group Filters
	 */
	@Memoized()
	tilt(): Emitter<vec2> {
		return this.map(e => [e.tiltX, e.tiltY] as vec2).change()
	}

	/**
	 * Creates a generator that emits the size of the pointer.
	 * @group Filters
	 */
	@Memoized()
	size(): Emitter<vec2> {
		return this.map(e => [e.width, e.height] as vec2).change()
	}

	/**
	 * Creates a generator that emits the pointer count.
	 * @group Filters
	 */
	@Memoized()
	pointerCount(): Emitter<number> {
		const pointers = new Set<number>()

		return this.filterMap(e => {
			if (e.type === 'pointermove') return undefined

			if (e.type === 'pointerdown') {
				pointers.add(e.pointerId)
			} else {
				pointers.delete(e.pointerId)
			}

			return pointers.size
		}, 0).change()
	}

	/**
	 * Creates a generator that emits the list of pointers when the pointer count is the given count.
	 * @group Filters
	 */
	@Memoized()
	withPointerCount(
		count: number,
		options?: GeneratorOptions
	): Emitter<WithPointerCountData> {
		const pointers = new Map<number, PointerEvent>()
		let prevPointerCount = 0

		return this.filterMap<WithPointerCountData>(e => {
			if (e.type === 'pointerdown' || e.type === 'pointermove') {
				pointers.set(e.pointerId, e)
			} else {
				pointers.delete(e.pointerId)
			}

			const wasExpectedCount = prevPointerCount === count
			const isExpectedCount = pointers.size === count
			prevPointerCount = pointers.size

			if (isExpectedCount) {
				cancelEventBehavior(e, options)
				return {
					type: wasExpectedCount ? 'pointermove' : 'pointerdown',
					events: [...pointers.values()],
				}
			} else {
				return wasExpectedCount ? {type: 'pointerup'} : undefined
			}
		})
	}

	/**
	 * Creates a emitter that emits when the pointer is dragged.
	 * @group Filters
	 */
	@Memoized()
	drag(options?: PointerDragGeneratorOptions): Emitter<DragData> {
		let dragging = false
		let start = vec2.zero
		let prev = vec2.zero

		return this.createDerived({
			onReset() {
				dragging = false
				start = prev = vec2.zero
			},
			propagate: (event, emit) => {
				if (options?.selector) {
					const target = event.target as HTMLElement
					if (!target.matches(options.selector)) return
				}

				// Compute current
				let current: vec2 = [event.clientX, event.clientY]

				if (options?.coordinate === 'offset') {
					const target = options?.origin ?? this.#target
					const {left, top} =
						target instanceof HTMLElement
							? target.getBoundingClientRect()
							: {left: 0, top: 0}

					current = vec2.sub(current, [left, top])
				}

				// Compute type and delta
				let type: DragData['type']
				let delta = vec2.zero

				if (event.type === 'pointerdown') {
					if (options?.pointerCapture) {
						const element = event.target as HTMLElement
						element.setPointerCapture(event.pointerId)
					}

					type = 'down'
					start = current
					dragging = true
				} else if (event.type === 'pointermove') {
					if (!dragging || vec2.equals(prev, current)) return

					type = 'drag'
					delta = vec2.sub(current, prev)
				} else {
					if (!dragging) return
					// event.type === 'pointerup' || event.type === 'pointercancel'
					type = 'up'
					dragging = false
				}

				prev = current

				emit({type, start, current, delta, event})
			},
		})
	}

	/**
	 * @group Filters
	 */
	@Memoized()
	gestureTransform(options: GeneratorOptions): Emitter<GestureTransformData> {
		return this.withPointerCount(2, options).fold(
			(state: GestureTransformData, e: WithPointerCountData) => {
				if (e.type === 'pointerdown') {
					const points = e.events.map(e => vec2.of(e.clientX, e.clientY)) as [
						vec2,
						vec2,
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
					) as [vec2, vec2]
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
	@Memoized()
	down(options?: GeneratorOptions): Emitter<true> {
		return this.filterMap(e => {
			if (e.type === 'pointerdown') {
				cancelEventBehavior(e, options)
				return true
			}
		})
	}

	/**
	 * Creates an emitter that emits `true` at the moment the pointer is released.
	 * @group Filters
	 */
	@Memoized()
	up(options?: GeneratorOptions): Emitter<true> {
		return this.filterMap(e => {
			if (e.type.match(/^pointer(up|cancel|leave)$/)) {
				cancelEventBehavior(e, options)
				return true
			}
		})
	}

	/**
	 * Creates a emitter that emits only when the given button is pressed.
	 * @param button Button to watch.
	 * @returns A new emitter.
	 * @group Properties
	 */
	@Memoized()
	button(
		button: number | 'primary' | 'secondary' | 'left' | 'middle' | 'right'
	): PointerEmitter {
		const ret = new PointerEmitter(this.#target, {
			sources: this,
		})

		const buttonIndex =
			typeof button === 'number'
				? button
				: PointerEmitter.ButtonNameToIndex.get(button) ?? 0

		this.registerDerived(ret, value => {
			if (value.type === 'pointermove') ret.emit(value)
			if (button === 'primary') {
				if (value.isPrimary) ret.emit(value)
			} else {
				if (value.button === buttonIndex) ret.emit(value)
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
	@Memoized()
	pointerType(
		type: 'mouse' | 'pen' | 'touch',
		options?: GeneratorOptions
	): PointerEmitter {
		const ret = new PointerEmitter(this.#target, {
			sources: this,
		})

		this.registerDerived(ret, e => {
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
	@Memoized()
	scroll(options?: GeneratorOptions): Emitter<vec2> {
		const ret = new Emitter<vec2>({
			onDispose: () => {
				this.#target.removeEventListener('wheel', handler as any)
			},
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
	@Memoized()
	pinch(options?: GeneratorOptions): Emitter<number> {
		const ret = new Emitter<number>({
			onDispose: () => {
				this.#target.removeEventListener('wheel', handler as any)
			},
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
export const pointer = memoizeFunction(
	(target: PointerEmitterTarget) => new PointerEmitter(target)
)

/**
 * @group Generators
 */
export const mouse = (target: PointerEmitterTarget = window) =>
	pointer(target).mouse

/**
 * @group Generators
 */
export const pen = (target: PointerEmitterTarget = window) =>
	pointer(target).pen

/**
 * @group Generators
 */
export const touch = (target: PointerEmitterTarget = window) =>
	pointer(target).touch
