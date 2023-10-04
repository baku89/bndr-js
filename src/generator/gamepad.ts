import {type Vec2} from 'linearly'
import {isEqual} from 'lodash'

import {Emitter} from '../Emitter'

type ButtonName = 'a' | 'b' | 'y' | 'x' | number
type AxisName = number

type GamepadData =
	| {type: 'button'; name: ButtonName; pressed: boolean}
	| {type: 'axis'; name: AxisName; value: Vec2}

/**
 * @group Emitters
 */
export class GamepadEmitter extends Emitter<GamepadData> {
	constructor() {
		super({
			onDispose() {
				window.removeEventListener('gamepadconnected', onGamepadConnected)
			},
		})

		const onGamepadConnected = () => {
			this.#updateStatus()
		}

		this.#updateStatus()

		window.addEventListener('gamepadconnected', onGamepadConnected)
	}

	#prevGamepads = new Map<number, Gamepad>()

	#scanGamepads() {
		const gamepadsEntries = navigator
			.getGamepads()
			.filter((g): g is Gamepad => g !== null)
			.map(g => [g.index, g] as const)

		return new Map(gamepadsEntries)
	}

	#updateStatus() {
		const gamepads = this.#scanGamepads()

		for (const [index, curt] of gamepads.entries()) {
			const prev = this.#prevGamepads.get(index)

			if (!prev || prev === curt) continue

			for (const [i, c] of curt.buttons.entries()) {
				const p = prev.buttons[i]
				if (c.pressed !== p.pressed) {
					this.emit({type: 'button', name: i, pressed: c.pressed})
				}
			}

			for (let i = 0; i * 2 < curt.axes.length; i++) {
				const p: Vec2 = [prev.axes[i * 2], prev.axes[i * 2 + 1]]
				const c: Vec2 = [curt.axes[i * 2], curt.axes[i * 2 + 1]]

				if (!isEqual(p, c)) {
					this.emit({type: 'axis', name: i, value: c})
				}
			}
		}

		this.#prevGamepads = gamepads

		if (gamepads.size > 0) {
			requestAnimationFrame(() => this.#updateStatus())
		}

		console.timeEnd('a')
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
	axis(name: AxisName): Emitter<Vec2> {
		return this.filterMap(e => {
			if (e.type === 'axis' && e.name === name) return e.value
			return undefined
		})
	}
}

/**
 * @group Generators
 */
export function gamepad() {
	return new GamepadEmitter()
}
