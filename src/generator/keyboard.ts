import hotkeys from 'hotkeys-js'

import {Emitter, GeneratorOptions} from '../Emitter'
import {cancelEventBehavior} from '../utils'

interface KeyboardGeneratorOptions extends GeneratorOptions {
	scope?: string
	capture?: boolean
}

function normalizeHotkey(key: string) {
	key = key.trim().toLocaleLowerCase()

	if (key === 'option') {
		key = 'alt'
	}

	return key
}

/**
 * @group Emitters
 */
export class KeyboardEmitter extends Emitter<KeyboardEvent> {
	#element: Element | Window

	constructor(target: Window | HTMLElement | string = window) {
		let dom: Element | Window
		if (typeof target === 'string') {
			const _dom = document.querySelector(target)
			if (!_dom) throw new Error('Invalid selector')
			dom = _dom
		} else {
			dom = target
		}

		const handler = (e: Event) => this.emit(e as KeyboardEvent)

		dom.addEventListener('keydown', handler)
		dom.addEventListener('keyup', handler)

		super({
			onDispose() {
				dom.removeEventListener('keydown', handler)
				dom.removeEventListener('keyup', handler)
			},
		})

		this.#element = dom
	}

	/**
	 * @group Generators
	 */
	key(key: string, options?: KeyboardGeneratorOptions): Emitter<KeyboardEvent> {
		key = normalizeHotkey(key)

		let ret: Emitter<KeyboardEvent>

		const handler = (e: KeyboardEvent) => {
			cancelEventBehavior(e, options)
			ret.emit(e)
		}

		if (['alt', 'shift', 'control'].includes(key)) {
			ret = new Emitter({
				original: this,
			})
			this.addDerivedEmitter(ret, e => {
				if (e.key.toLowerCase() === key) handler(e)
			})
		} else {
			ret = new Emitter({
				onDispose() {
					hotkeys.unbind(key, handler)
				},
			})

			const element =
				this.#element instanceof HTMLElement ? this.#element : undefined

			hotkeys(
				key,
				{
					keyup: true,
					element,
					...options,
				},
				handler
			)
		}

		return ret
	}

	/**
	 * @group Generators
	 */
	pressed(key: string, options?: KeyboardGeneratorOptions): Emitter<boolean> {
		return this.key(key, options).map(e => e.type === 'keydown', false)
	}

	/**
	 * @group Generators
	 */
	keydown(key: string, options?: KeyboardGeneratorOptions): Emitter<true> {
		return this.pressed(key, options).down()
	}

	/**
	 * @group Generators
	 */
	keyup(key: string, options?: KeyboardGeneratorOptions): Emitter<true> {
		return this.pressed(key, options).down()
	}
}

/**
 * @group Generators
 */
export function keyboard(
	target: Window | HTMLElement | string = window
): KeyboardEmitter {
	return new KeyboardEmitter(target)
}
