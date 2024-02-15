import {title} from 'case'
import {scalar, vec2} from 'linearly'
import {isEqual} from 'lodash'

import {Emitter} from '../Emitter'
import {Memoized, memoizeFunction} from '../memoize'

/**
 * Gamepad button name. In addition to [W3C specifications](https://w3c.github.io/gamepad/#remapping), it also supports vendor-specific names such as Nintendo Switch and PlayStation.
 */
export type ButtonName =
	| number
	// Generic
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

	// JoyCon-specific. It distincts SL/SR of Joy-Con (L) and Joy-Con (R)
	| 'lsl'
	| 'lsr'
	| 'rsl'
	| 'rsr'
	| '+'
	| '-'
	| 'capture'

	// PlayStation Specific. X Button is omitted
	// https://controller.dl.playstation.net/controller/lang/en/DS_partnames.html
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

	// Xbox Controller Specific.
	| 'lb'
	| 'rb'
	| 'lt'
	| 'rt'
	| 'view'
	| 'menu'
	| 'share'

// https://w3c.github.io/gamepad/#remapping
// The button name is based on Super Famicon controller
const GenericButtonName = [
	'b', // buttons[0]	Bottom button in right cluster
	'a', // buttons[1]	Right button in right cluster
	'y', // buttons[2]	Left button in right cluster
	'x', // buttons[3]	Top button in right cluster

	'l', // buttons[4]	Top left front button
	'r', // buttons[5]	Top right front button
	'zl', // buttons[6]	Bottom left front button
	'zr', // buttons[7]	Bottom right front button

	'select', // buttons[8]	Left button in center cluster
	'start', // buttons[9]	Right button in center cluster

	'stick-left', // buttons[10]	Left stick pressed button
	'stick-right', // buttons[11]	Right stick pressed button

	'up', // buttons[12]	Top button in left cluster
	'down', // buttons[13]	Bottom button in left cluster
	'left', // buttons[14]	Left button in left cluster
	'right', // buttons[15]	Right button in left cluster

	'home', // buttons[16]	Center button in center cluster
] as const

export type AxisName = 'left' | 'right' | number

type GamepadData =
	| {type: 'button'; name: ButtonName; pressed: boolean; id: string}
	| {type: 'axis'; name: AxisName; value: vec2; id: string}

/**
 * @group Emitters
 */
export class GamepadEmitter extends Emitter<GamepadData> {
	constructor() {
		super({
			onDispose() {
				window.removeEventListener('gamepadconnected', update)
			},
		})

		const update = () => {
			if (this.#updating) return
			this.#update()
		}

		window.addEventListener('gamepadconnected', update)

		update()
	}

	#updating = false
	#prevGamepads = new Map<number, Gamepad>()

	#scanGamepads() {
		const gamepadsEntries = navigator
			.getGamepads()
			.filter((g): g is Gamepad => g !== null)
			.map(g => [g.index, g] as const)

		return new Map(gamepadsEntries)
	}

	#update() {
		this.#updating = true
		const gamepads = this.#scanGamepads()

		for (const [index, curt] of gamepads.entries()) {
			const info = Matchers.find(m => m.match(curt))

			if (info && 'ignore' in info) continue

			const prev = this.#prevGamepads.get(index)

			if (!prev || prev === curt) continue

			for (const [i, c] of curt.buttons.entries()) {
				const p = prev.buttons[i]?.pressed ?? false
				if (c.pressed !== p) {
					const name = info?.buttons[i] ?? GenericButtonName[i] ?? i
					this.emit({type: 'button', name, pressed: c.pressed, id: curt.id})
				}
			}

			for (let i = 0; i * 2 < curt.axes.length; i++) {
				const p: vec2 = [prev.axes[i * 2], prev.axes[i * 2 + 1]]
				const c: vec2 = [curt.axes[i * 2], curt.axes[i * 2 + 1]]

				if (!isEqual(p, c)) {
					const name = info?.axes[i] ?? i
					this.emit({type: 'axis', name, value: c, id: curt.id})
				}
			}
		}

		this.#prevGamepads = gamepads

		if (gamepads.size > 0) {
			requestAnimationFrame(() => this.#update())
		} else {
			this.#updating = false
		}
	}

	/**
	 * @group Generators
	 */
	@Memoized()
	devices(): Emitter<Gamepad[]> {
		const ret = new Emitter<Gamepad[]>({
			onDispose() {
				removeEventListener('gamepadconnected', onConnectionEvent)
				removeEventListener('gamepaddisconnected', onConnectionEvent)
				clearInterval(timer)
			},
		})

		addEventListener('gamepadconnected', onConnectionEvent)
		addEventListener('gamepaddisconnected', onConnectionEvent)

		// At least in Chrome 117, gamepaddisconnected event is somehow not fired,
		// so we need to poll the connection status manually.

		const timer = setInterval(onConnectionEvent, 1000)

		function onConnectionEvent() {
			const gamepads = navigator
				.getGamepads()
				.flatMap(g => (g === null ? [] : [g]))

			ret.emit(gamepads)
		}

		return ret.change()
	}

	/**
	 * Emits `true` if there is at least one gamepad connected.
	 * @returns `true` if there is at least one gamepad connected.
	 */
	@Memoized()
	connected(): Emitter<boolean> {
		return this.devices()
			.map(devices => devices.length > 0)
			.change()
	}

	/**
	 * @group Generators
	 */
	@Memoized()
	button(name: ButtonName): Emitter<boolean> {
		const ret = this.filterMap(e => {
			if (e.type === 'button' && e.name === name) return e.pressed
			return undefined
		})
		const nameStr = name.toString()
		ret.icon = [
			{type: 'iconify', icon: 'solar:gamepad-bold'},
			nameStr.length > 3 ? title(name.toString()) : nameStr.toUpperCase(),
		]
		return ret
	}

	/**
	 * @group Generators
	 */
	@Memoized()
	axis(name?: AxisName | null): Emitter<vec2> {
		return this.filterMap(e => {
			if (e.type === 'axis' && (!name || e.name === name)) {
				return e.value
			} else {
				return undefined
			}
		})
	}

	/**
	 * Emits the direction in which the axis is tilted. Each axis is quantized into -1, 0, or 1. If the axis is not tilted, it emits `null`.
	 * @example
	 * [1, 0] // right
	 * [0, -1] // up
	 * [-1, 1] // down-left
	 *
	 * @param name  If omitted, it will watch all axes.
	 * @param options step: quantization step in degrees, threshold: minimum tilt value (0-1) to emit
	 * @returns
	 * @group Generators
	 */
	@Memoized()
	axisDirection(
		name?: AxisName | null,
		{step = 90, threshold = 0.5}: {step?: 45 | 90; threshold?: number} = {}
	): Emitter<vec2 | null> {
		return this.axis(name)
			.map((dir): vec2 | null => {
				if (vec2.length(dir) < threshold) return null

				const angle = scalar.degrees(Math.atan2(dir[1], dir[0]))
				const quantizedAngle = scalar.quantize(angle, step)

				switch (quantizedAngle) {
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
			})
			.change()
	}
}

type GamepadInfo = {
	match: (e: Gamepad) => boolean
	ignore?: boolean

	buttons?: ButtonName[]
	axes?: AxisName[]
}

const Matchers: GamepadInfo[] = [
	{
		match: gamepad => gamepad.id.includes('Joy-Con (R)'),
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
		match: gamepad => gamepad.id.startsWith('Joy-Con (L)'),
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
		match: gamepad => gamepad.id.startsWith('Joy-Con L+R'),
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
		// When you connect both JoyCon left and right to PC, it is recognized as double devices,
		// one of which is "Joy-Con L+R" and the other is "Joy-Con (L/R)".
		// But the latter is not actually usable, so we ignore it.
		match: gamepad => gamepad.id.startsWith('Joy-Con (L/R)'),
		ignore: true,
	},
	{
		match: gamepad => gamepad.id.startsWith('Pro Controller'),
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
		match: gamepad => gamepad.id.startsWith('DualSense Wireless Controller'),
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
		match: gamepad => gamepad.id.includes('Xbox'),
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

/**
 * @group Generators
 */
export const gamepad = memoizeFunction(() => new GamepadEmitter())
