import hotkeys from 'hotkeys-js'

import {Emitter, GeneratorOptions} from '../Emitter'
import {cancelEventBehavior} from '../utils'

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
	constructor(target: Window | HTMLElement | string = window) {
		super({
			defaultValue: new KeyboardEvent(''),
		})

		let dom: Element | Window
		if (typeof target === 'string') {
			const _dom = document.querySelector(target)
			if (!_dom) throw new Error('Invalid selector')
			dom = _dom
		} else {
			dom = target
		}

		dom.addEventListener('keydown', e => this.emit(e as KeyboardEvent))
		dom.addEventListener('keyup', e => this.emit(e as KeyboardEvent))

		hotkeys('*', {keyup: true}, e => {
			this.emit(e)
		})
	}

	/**
	 * @group Filters
	 */
	key(key: string, options?: GeneratorOptions): Emitter<KeyboardEvent> {
		const ret = new Emitter({
			defaultValue: new KeyboardEvent(''),
		})

		const handler = (e: KeyboardEvent) => {
			cancelEventBehavior(e, options)
			ret.emit(e)
		}

		key = normalizeHotkey(key)

		if (['alt', 'shift', 'control'].includes(key)) {
			this.on(e => {
				if (e.key.toLowerCase() === key) handler(e)
			})
		} else {
			hotkeys(key, {keyup: true}, handler)
		}

		return ret
	}

	/**
	 * @group Filters
	 */
	pressed(key: string, options?: GeneratorOptions): Emitter<boolean> {
		return this.key(key, options).map(e => e.type === 'keydown')
	}

	/**
	 * @group Filters
	 */
	keydown(key: string, options?: GeneratorOptions): Emitter<true> {
		return this.pressed(key, options).down()
	}

	/**
	 * @group Filters
	 */
	keyup(key: string, options?: GeneratorOptions): Emitter<true> {
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
