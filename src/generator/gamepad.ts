import {isEqual} from 'lodash'

import {Bndr, Vec2} from '../Bndr'
import {None} from '../utils'
import {Vec2Type} from '../ValueType'

/**
 * @group Generators
 */
export class GamepadBndr extends Bndr<Set<Gamepad>> {
	readonly #buttonBndrs = new Map<number, Bndr<boolean>>()
	readonly #axisBndrs = new Map<number, Bndr<Vec2>>()

	constructor() {
		super({
			value: None,
			defaultValue: new Set(),
		})

		let prevControllers = new Map<number, Gamepad>()
		let updating = false

		const onGamepadConnected = () => {
			if (updating) return

			updating = true
			requestAnimationFrame(updateStatus)
		}

		const scanGamepads = () => {
			const gamepads = navigator.getGamepads()

			const controllers = new Map<number, Gamepad>()

			for (const gamepad of gamepads) {
				if (!gamepad) continue
				controllers.set(gamepad.index, gamepad)
			}

			return controllers
		}

		const updateStatus = () => {
			const controllers = scanGamepads()

			const changedGamepads = new Set<Gamepad>()

			for (const [index, curt] of controllers.entries()) {
				const prev = prevControllers.get(index)

				if (!prev || prev === curt) continue

				let changed = false
				curt.buttons.forEach((c, i) => {
					const p = prev.buttons[i]
					if (c.pressed !== p.pressed) {
						changed = true
						this.#buttonBndrs.get(i)?.emit(c.pressed)
					}
				})

				for (let i = 0; i * 2 < curt.axes.length; i++) {
					const p: Vec2 = [prev.axes[i * 2], prev.axes[i * 2 + 1]]
					const c: Vec2 = [curt.axes[i * 2], curt.axes[i * 2 + 1]]

					if (!isEqual(p, c)) {
						changed = true
						this.#axisBndrs.get(i)?.emit(c)
					}
				}

				if (changed) {
					changedGamepads.add(curt)
				}
			}

			if (changedGamepads.size > 0) {
				this.emit(changedGamepads)
			}

			prevControllers = controllers

			if (controllers.size === 0) {
				updating = false
			} else {
				requestAnimationFrame(updateStatus)
			}
		}

		window.addEventListener('gamepadconnected', onGamepadConnected)
	}

	/**
	 * @group Generators
	 */
	button(index: number): Bndr<boolean> {
		let ret = this.#buttonBndrs.get(index)

		if (!ret) {
			ret = new Bndr({
				value: None,
				defaultValue: false,
			})
			this.#buttonBndrs.set(index, ret)
		}

		return ret
	}

	/**
	 * @group Generators
	 */
	axis(index: number): Bndr<Vec2> {
		let ret = this.#axisBndrs.get(index)

		if (!ret) {
			ret = new Bndr({
				value: None,
				defaultValue: [0, 0],
				type: Vec2Type,
			})
			this.#axisBndrs.set(index, ret)
		}

		return ret
	}
}
