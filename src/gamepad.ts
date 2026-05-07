import Case from 'case'
import {scalar, vec2} from 'linearly'
import {isEqual} from 'lodash-es'
import {Observable, share} from 'rxjs'
import {distinctUntilChanged, filter, map} from 'rxjs/operators'

import {GlyphedObservable, withGlyph} from './types.js'

export type ButtonName =
	| number
	| 'b'
	| 'a'
	| 'x'
	| 'y'
	| 'l'
	| 'r'
	| 'zl'
	| 'zr'
	| 'select'
	| 'start'
	| 'stick-left'
	| 'stick-right'
	| 'up'
	| 'down'
	| 'left'
	| 'right'
	| 'home'
	| 'lsl'
	| 'lsr'
	| 'rsl'
	| 'rsr'
	| '+'
	| '-'
	| 'capture'
	| 'triangle'
	| 'circle'
	| 'square'
	| 'l1'
	| 'l2'
	| 'r1'
	| 'r2'
	| 'create'
	| 'option'
	| 'touch-pad'
	| 'lb'
	| 'rb'
	| 'lt'
	| 'rt'
	| 'view'
	| 'menu'
	| 'share'

export type AxisName = 'left' | 'right' | number

const GenericButtonName = [
	'b',
	'a',
	'y',
	'x',
	'l',
	'r',
	'zl',
	'zr',
	'select',
	'start',
	'stick-left',
	'stick-right',
	'up',
	'down',
	'left',
	'right',
	'home',
] as const

type GamepadEvent =
	| {type: 'button'; name: ButtonName; pressed: boolean; id: string}
	| {type: 'axis'; name: AxisName; value: vec2; id: string}
	| {type: 'device'; devices: Gamepad[]}

let _events$: Observable<GamepadEvent> | null = null

function events(): Observable<GamepadEvent> {
	return (_events$ ??= new Observable<GamepadEvent>(sub => {
		let prev = new Map<number, Gamepad>()
		let raf = 0
		let stopped = false

		const scan = () => {
			return new Map(
				navigator
					.getGamepads()
					.filter((g): g is Gamepad => g !== null)
					.map(g => [g.index, g] as const)
			)
		}

		const tick = () => {
			if (stopped) return

			const curr = scan()

			if (curr.size !== prev.size) {
				sub.next({type: 'device', devices: [...curr.values()]})
			}

			for (const [index, c] of curr.entries()) {
				const info = Matchers.find(m => m.match(c))
				if (info && 'ignore' in info) continue

				const p = prev.get(index)
				if (!p || p === c) continue

				for (const [i, {pressed}] of c.buttons.entries()) {
					const prevPressed = p.buttons[i]?.pressed ?? false
					if (pressed === prevPressed) continue
					const name = info?.buttons?.[i] ?? GenericButtonName[i] ?? i
					sub.next({type: 'button', name, pressed, id: c.id})
				}

				for (let i = 0; i * 2 < c.axes.length; i++) {
					const a: vec2 = [p.axes[i * 2], p.axes[i * 2 + 1]]
					const b: vec2 = [c.axes[i * 2], c.axes[i * 2 + 1]]
					if (!isEqual(a, b)) {
						const name = info?.axes?.[i] ?? i
						sub.next({type: 'axis', name, value: b, id: c.id})
					}
				}
			}

			prev = curr
			raf = requestAnimationFrame(tick)
		}

		raf = requestAnimationFrame(tick)

		return () => {
			stopped = true
			cancelAnimationFrame(raf)
		}
	}).pipe(share()))
}

export function devices(): GlyphedObservable<Gamepad[]> {
	const obs = events().pipe(
		filter(
			(e): e is Extract<GamepadEvent, {type: 'device'}> => e.type === 'device'
		),
		map(e => e.devices)
	)
	return withGlyph(obs, [{type: 'iconify', icon: 'solar:gamepad-bold'}])
}

export function connected(): GlyphedObservable<boolean> {
	const obs = devices().pipe(
		map(d => d.length > 0),
		distinctUntilChanged()
	)
	return withGlyph(obs, [{type: 'iconify', icon: 'solar:gamepad-bold'}])
}

function buttonGlyph(name: ButtonName): GlyphedObservable<unknown>['glyph'] {
	const s = name.toString()
	return [
		{type: 'iconify', icon: 'solar:gamepad-bold'},
		s.length > 3 ? Case.title(s) : s.toUpperCase(),
	]
}

export function button(name: ButtonName): GlyphedObservable<boolean> {
	const obs = events().pipe(
		filter(
			(e): e is Extract<GamepadEvent, {type: 'button'}> =>
				e.type === 'button' && e.name === name
		),
		map(e => e.pressed)
	)
	return withGlyph(obs, buttonGlyph(name))
}

export function axis(name?: AxisName | null): GlyphedObservable<vec2> {
	const obs = events().pipe(
		filter(
			(e): e is Extract<GamepadEvent, {type: 'axis'}> =>
				e.type === 'axis' && (!name || e.name === name)
		),
		map(e => e.value)
	)
	return withGlyph(obs, [{type: 'iconify', icon: 'solar:gamepad-bold'}])
}

export function axisDirection(
	name?: AxisName | null,
	{step = 90, threshold = 0.5}: {step?: 45 | 90; threshold?: number} = {}
): GlyphedObservable<vec2 | null> {
	const obs = axis(name).pipe(
		map((dir): vec2 | null => {
			if (vec2.length(dir) < threshold) return null
			const angle = scalar.degrees(Math.atan2(dir[1], dir[0]))
			const q = scalar.quantize(angle, step)
			switch (q) {
				case -180:
					return [-1, 0]
				case -135:
					return [-1, -1]
				case -90:
					return [0, -1]
				case -45:
					return [1, -1]
				case 0:
					return [1, 0]
				case 45:
					return [1, 1]
				case 90:
					return [0, 1]
				case 135:
					return [-1, 1]
				case 180:
					return [-1, 0]
				default:
					throw new Error(`Unexpected angle: ${angle}`)
			}
		}),
		distinctUntilChanged(isEqual)
	)
	return withGlyph(obs, [{type: 'iconify', icon: 'solar:gamepad-bold'}])
}

type GamepadInfo = {
	match: (e: Gamepad) => boolean
	ignore?: boolean
	buttons?: ButtonName[]
	axes?: AxisName[]
}

const Matchers: GamepadInfo[] = [
	{
		match: g => g.id.includes('Joy-Con (R)'),
		buttons: [
			'a',
			'x',
			'b',
			'y',
			'rsl',
			'rsr',
			6,
			'zr',
			'r',
			'+',
			'stick-right',
			11,
			12,
			13,
			14,
			15,
			'home',
		],
		axes: ['right'],
	},
	{
		match: g => g.id.startsWith('Joy-Con (L)'),
		buttons: [
			'left',
			'down',
			'up',
			'right',
			'lsl',
			'lsr',
			'zl',
			7,
			'l',
			'-',
			'stick-left',
			11,
			12,
			13,
			14,
			15,
			'capture',
		],
		axes: ['left'],
	},
	{
		match: g => g.id.startsWith('Joy-Con L+R'),
		buttons: [
			'a',
			'b',
			'y',
			'x',
			'l',
			'r',
			'zl',
			'zr',
			'-',
			'+',
			'stick-left',
			'stick-right',
			'up',
			'down',
			'left',
			'right',
			'home',
			'capture',
			'lsl',
			'lsr',
			'rsl',
			'rsr',
		],
		axes: ['left', 'right'],
	},
	{
		match: g => g.id.startsWith('Joy-Con (L/R)'),
		ignore: true,
	},
	{
		match: g => g.id.startsWith('Pro Controller'),
		buttons: [
			'b',
			'a',
			'x',
			'y',
			'l',
			'r',
			'zl',
			'zr',
			'-',
			'+',
			'stick-left',
			'stick-right',
			'up',
			'down',
			'left',
			'right',
			'home',
			'capture',
		],
		axes: ['left', 'right'],
	},
	{
		match: g => g.id.startsWith('DualSense Wireless Controller'),
		buttons: [
			'x',
			'square',
			'circle',
			'triangle',
			'l1',
			'r1',
			'l2',
			'r2',
			'create',
			'option',
			'stick-left',
			'stick-right',
			'up',
			'down',
			'left',
			'right',
			'home',
			'touch-pad',
		],
		axes: ['left', 'right'],
	},
	{
		match: g => g.id.includes('Xbox'),
		buttons: [
			'b',
			'a',
			'x',
			'y',
			'lb',
			'rb',
			'lt',
			'rt',
			'view',
			'menu',
			'stick-left',
			'stick-right',
			'up',
			'down',
			'left',
			'right',
			'home',
			'share',
		],
		axes: ['left', 'right'],
	},
]
