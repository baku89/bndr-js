import {type Vec2} from 'linearly'
import {isEqual} from 'lodash'

import {Emitter} from '../Emitter'

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
	| {type: 'axis'; name: AxisName; value: Vec2; id: string}

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
				const p = prev.buttons[i]
				if (c.pressed !== p.pressed) {
					const name = info?.buttons[i] ?? GenericButtonName[i] ?? i
					this.emit({type: 'button', name, pressed: c.pressed, id: curt.id})
				}
			}

			for (let i = 0; i * 2 < curt.axes.length; i++) {
				const p: Vec2 = [prev.axes[i * 2], prev.axes[i * 2 + 1]]
				const c: Vec2 = [curt.axes[i * 2], curt.axes[i * 2 + 1]]

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
	 * Emits `true` if there is at least one gamepad connected.
	 * @returns `true` if there is at least one gamepad connected.
	 */
	connected(): Emitter<boolean> {
		const ret = new Emitter<boolean>({
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
			const gamepads = navigator.getGamepads()
			ret.emit(gamepads.length > 0)
		}

		return ret.change()
	}

	/**
	 * @group Generators
	 */
	button(name: ButtonName): Emitter<boolean> {
		return this.filterMap(e => {
			if (e.type === 'button' && e.name === name) return e.pressed
			return undefined
		})
	}

	/**
	 * @group Generators
	 */
	axis(name?: AxisName): Emitter<Vec2> {
		return this.filterMap(e => {
			if (e.type === 'axis' && (name === undefined || e.name === name)) {
				return e.value
			} else {
				return undefined
			}
		})
	}
}

type GamepadInfo =
	| {
			match: (e: Gamepad) => boolean
			buttons: ButtonName[]
			axes: AxisName[]
	  }
	| {match: (e: Gamepad) => boolean; ignore: true}

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
			'b',
			'a',
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
]

/**
 * @group Generators
 */
export function gamepad() {
	return new GamepadEmitter()
}
