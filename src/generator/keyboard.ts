import hotkeys from 'hotkeys-js'

import {Emitter, GeneratorOptions} from '../Emitter'
import {None} from '../utils'

function normalizeHotkey(key: string) {
	key = key.trim().toLocaleLowerCase()

	if (key === 'option') {
		key = 'alt'
	}

	return key
}

/**
 * @group Generators
 */
export class KeyboardEmitter extends Emitter<KeyboardEvent> {
	constructor() {
		super({
			value: None,
			defaultValue: new KeyboardEvent(''),
		})

		window.addEventListener('keydown', e => this.emit(e))
		window.addEventListener('keyup', e => this.emit(e))

		hotkeys('*', {keyup: true}, e => {
			this.emit(e)
		})
	}

	/**
	 * @group Generators
	 */
	key(key: string, options?: GeneratorOptions): Emitter<boolean> {
		const ret = new Emitter({
			value: None,
			defaultValue: false,
		})
		let prev = false

		const handler = (evt: KeyboardEvent) => {
			if (options?.preventDefault) evt.preventDefault()
			if (options?.stopPropagation) evt.stopPropagation()

			const current = evt.type === 'keydown'

			if (prev !== current) {
				ret.emit(current)
			}

			prev = current
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
}
