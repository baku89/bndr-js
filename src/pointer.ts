import {mat2d, vec2} from 'linearly'
import {isEqual} from 'lodash-es'
import {Observable, share} from 'rxjs'
import {distinctUntilChanged, filter, map, scan} from 'rxjs/operators'

import {GlyphedObservable, withGlyph} from './types.js'
import {cancelEventBehavior, EventOptions} from './utils.js'

export type PointerTarget = Document | HTMLElement | SVGElement | string

interface PressedOptions extends EventOptions {
	pointerCapture?: boolean
}

interface PositionOptions extends EventOptions {
	coordinate?: 'client' | 'offset'
}

interface DragOptions extends PressedOptions, PositionOptions {
	origin?: HTMLElement
	selector?: string
}

export interface DragData {
	type: 'down' | 'drag' | 'up'
	start: vec2
	current: vec2
	delta: vec2
	event: PointerEvent
}

type WithPointerCountData =
	| {type: 'pointerdown' | 'pointermove'; events: PointerEvent[]}
	| {type: 'pointerup'}

export interface GestureTransformData {
	justStarted: boolean
	start: mat2d
	current: mat2d
	delta: mat2d
	points: [vec2, vec2]
}

const ButtonNameToIndex = new Map<string, number>([
	['secondary', 2],
	['left', 0],
	['middle', 1],
	['right', 2],
])

const GLYPH: GlyphedObservable<unknown>['glyph'] = [
	{type: 'iconify', icon: 'mdi:cursor-default'},
]

function resolveTarget(target: PointerTarget): Exclude<PointerTarget, string> {
	if (typeof target !== 'string') return target
	const dom = document.querySelector(target) as HTMLElement | null
	if (!dom) throw new Error(`Invalid selector: ${target}`)
	return dom
}

const eventCache = new WeakMap<object, Observable<PointerEvent>>()

function events(target: PointerTarget = document): Observable<PointerEvent> {
	const dom = resolveTarget(target)
	const cached = eventCache.get(dom)
	if (cached) return cached

	const stream = new Observable<PointerEvent>(sub => {
		const handler = (e: Event) => sub.next(e as PointerEvent)
		const types = [
			'pointermove',
			'pointerdown',
			'pointerup',
			'pointerleave',
			'pointercancel',
			'contextmenu',
		] as const
		types.forEach(t => dom.addEventListener(t, handler))
		return () => types.forEach(t => dom.removeEventListener(t, handler))
	}).pipe(share())

	eventCache.set(dom, stream)
	return stream
}

export function all(target: PointerTarget = document) {
	return events(target)
}

export function pressed(
	target: PointerTarget = document,
	opts?: PressedOptions
): GlyphedObservable<boolean> {
	const obs = events(target).pipe(
		filter(e => e.type !== 'pointermove'),
		map(e => {
			cancelEventBehavior(e, opts)

			if (e.type === 'contextmenu' && opts?.preventDefault) return null
			if (opts?.pointerCapture && e.type === 'pointerdown') {
				;(e.target as HTMLElement).setPointerCapture(e.pointerId)
			}
			return e.type === 'pointerdown'
		}),
		filter((v): v is boolean => v !== null),
		distinctUntilChanged()
	)
	return withGlyph(obs, GLYPH)
}

export function position(
	target: PointerTarget = document,
	opts?: PositionOptions
): GlyphedObservable<vec2> {
	const dom = resolveTarget(target)
	const obs = events(dom).pipe(
		map(e => {
			cancelEventBehavior(e, opts)
			if (opts?.coordinate === 'offset' && dom instanceof HTMLElement) {
				const {left, top} = dom.getBoundingClientRect()
				return [e.clientX - left, e.clientY - top] as vec2
			}
			return [e.clientX, e.clientY] as vec2
		})
	)
	return withGlyph(obs, GLYPH)
}

export function pressure(target: PointerTarget = document): GlyphedObservable<number> {
	const obs = events(target).pipe(
		map(e => e.pressure),
		distinctUntilChanged()
	)
	return withGlyph(obs, GLYPH)
}

export function twist(target: PointerTarget = document): GlyphedObservable<number> {
	const obs = events(target).pipe(
		map(e => e.twist),
		distinctUntilChanged()
	)
	return withGlyph(obs, GLYPH)
}

export function tilt(target: PointerTarget = document): GlyphedObservable<vec2> {
	const obs = events(target).pipe(
		map(e => [e.tiltX, e.tiltY] as vec2),
		distinctUntilChanged(isEqual)
	)
	return withGlyph(obs, GLYPH)
}

export function size(target: PointerTarget = document): GlyphedObservable<vec2> {
	const obs = events(target).pipe(
		map(e => [e.width, e.height] as vec2),
		distinctUntilChanged(isEqual)
	)
	return withGlyph(obs, GLYPH)
}

export function pointerCount(target: PointerTarget = document): GlyphedObservable<number> {
	const pointers = new Set<number>()
	const obs = events(target).pipe(
		filter(e => e.type !== 'pointermove'),
		map(e => {
			if (e.type === 'pointerdown') pointers.add(e.pointerId)
			else pointers.delete(e.pointerId)
			return pointers.size
		}),
		distinctUntilChanged()
	)
	return withGlyph(obs, GLYPH)
}

export function withPointerCount(
	count: number,
	target: PointerTarget = document,
	opts?: EventOptions
): GlyphedObservable<WithPointerCountData> {
	const pointers = new Map<number, PointerEvent>()
	let prev = 0

	const obs = events(target).pipe(
		map((e): WithPointerCountData | null => {
			if (e.type === 'pointerdown' || e.type === 'pointermove') {
				pointers.set(e.pointerId, e)
			} else {
				pointers.delete(e.pointerId)
			}

			const wasExpected = prev === count
			const isExpected = pointers.size === count
			prev = pointers.size

			if (isExpected) {
				cancelEventBehavior(e, opts)
				return {
					type: wasExpected ? 'pointermove' : 'pointerdown',
					events: [...pointers.values()],
				}
			}
			return wasExpected ? {type: 'pointerup'} : null
		}),
		filter((v): v is WithPointerCountData => v !== null)
	)
	return withGlyph(obs, GLYPH)
}

export function drag(
	target: PointerTarget = document,
	opts?: DragOptions
): GlyphedObservable<DragData> {
	const dom = resolveTarget(target)
	let dragging = false
	let start = vec2.zero
	let prev = vec2.zero

	const obs = events(dom).pipe(
		map((e): DragData | null => {
			cancelEventBehavior(e, opts)

			if (opts?.selector) {
				const t = e.target as HTMLElement
				if (!t.matches(opts.selector)) return null
			}

			let current: vec2 = [e.clientX, e.clientY]
			if (opts?.coordinate === 'offset') {
				const origin = opts?.origin ?? dom
				const {left, top} =
					origin instanceof HTMLElement
						? origin.getBoundingClientRect()
						: {left: 0, top: 0}
				current = vec2.sub(current, [left, top])
			}

			let type: DragData['type'] | undefined
			let delta = vec2.zero

			if (e.type === 'pointerdown') {
				if (opts?.pointerCapture ?? true) {
					;(e.target as HTMLElement).setPointerCapture(e.pointerId)
				}
				type = 'down'
				start = current
				dragging = true
			} else if (e.type === 'pointermove') {
				if (!dragging || vec2.equals(prev, current)) return null
				type = 'drag'
				delta = vec2.sub(current, prev)
			} else if (
				e.type === 'pointerup' ||
				e.type === 'pointercancel' ||
				e.type === 'pointerleave' ||
				(e.type === 'contextmenu' && !opts?.preventDefault)
			) {
				if (!dragging) return null
				type = 'up'
				dragging = false
			}

			if (type === undefined) return null
			prev = current
			return {type, start, current, delta, event: e}
		}),
		filter((v): v is DragData => v !== null)
	)
	return withGlyph(obs, GLYPH)
}

export function down(
	target: PointerTarget = document,
	opts?: EventOptions
): GlyphedObservable<void> {
	const obs = events(target).pipe(
		filter(e => e.type === 'pointerdown'),
		map((e): void => {
			cancelEventBehavior(e, opts)
		})
	)
	return withGlyph(obs, GLYPH)
}

export function up(
	target: PointerTarget = document,
	opts?: EventOptions
): GlyphedObservable<void> {
	const obs = events(target).pipe(
		filter(e => /^pointer(up|cancel|leave)$/.test(e.type)),
		map((e): void => {
			cancelEventBehavior(e, opts)
		})
	)
	return withGlyph(obs, GLYPH)
}

export function button(
	name: number | 'primary' | 'secondary' | 'left' | 'middle' | 'right',
	target: PointerTarget = document
): GlyphedObservable<PointerEvent> {
	const idx =
		typeof name === 'number' ? name : (ButtonNameToIndex.get(name) ?? 0)
	const obs = events(target).pipe(
		filter(e => {
			if (e.button === -1) return true
			if (name === 'primary') return e.isPrimary
			return e.button === idx
		})
	)
	return withGlyph(obs, GLYPH)
}

export function pointerType(
	type: 'mouse' | 'pen' | 'touch',
	target: PointerTarget = document,
	opts?: EventOptions
): GlyphedObservable<PointerEvent> {
	const obs = events(target).pipe(
		filter(e => e.pointerType === type),
		map(e => {
			cancelEventBehavior(e, opts)
			return e
		})
	)
	return withGlyph(obs, GLYPH)
}

export const mouse = (target?: PointerTarget) => pointerType('mouse', target)
export const pen = (target?: PointerTarget) => pointerType('pen', target)
export const touch = (target?: PointerTarget) => pointerType('touch', target)

export function scroll(
	target: PointerTarget = document,
	opts?: EventOptions
): GlyphedObservable<vec2> {
	const dom = resolveTarget(target)
	const obs = new Observable<vec2>(sub => {
		const handler = ((e: WheelEvent) => {
			cancelEventBehavior(e, opts)
			if (e.ctrlKey) return
			sub.next([e.deltaX, e.deltaY])
		}) as EventListener
		dom.addEventListener('wheel', handler, {passive: false})
		return () => dom.removeEventListener('wheel', handler)
	}).pipe(share())
	return withGlyph(obs, GLYPH)
}

export function pinch(
	target: PointerTarget = document,
	opts?: EventOptions
): GlyphedObservable<number> {
	const dom = resolveTarget(target)
	const obs = new Observable<number>(sub => {
		const handler = ((e: WheelEvent) => {
			cancelEventBehavior(e, opts)
			if (!e.ctrlKey) return
			sub.next(e.deltaY)
		}) as EventListener
		dom.addEventListener('wheel', handler, {passive: false})
		return () => dom.removeEventListener('wheel', handler)
	}).pipe(share())
	return withGlyph(obs, GLYPH)
}

export function gestureTransform(
	target: PointerTarget = document,
	opts?: EventOptions
): GlyphedObservable<GestureTransformData> {
	const initial: GestureTransformData = {
		points: [vec2.zero, vec2.zero],
		justStarted: false,
		start: mat2d.identity,
		current: mat2d.identity,
		delta: mat2d.identity,
	}
	const obs = withPointerCount(2, target, opts).pipe(
		scan<WithPointerCountData, GestureTransformData | null>((state, e) => {
			if (e.type === 'pointerdown') {
				const points = e.events.map(ev => vec2.of(ev.clientX, ev.clientY)) as [
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
			}
			if (e.type === 'pointermove') {
				if (!state) return null
				const prevPoints = state.points
				const currentPoints = e.events.map(ev =>
					vec2.of(ev.clientX, ev.clientY)
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
			}
			return null
		}, initial),
		filter((v): v is GestureTransformData => v !== null)
	)
	return withGlyph(obs, GLYPH)
}
