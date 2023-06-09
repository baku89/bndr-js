import hotkeys from 'hotkeys-js'
import {Memoize} from 'typescript-memoize'

import {Bndr, BndrGeneratorOptions} from '../Bndr'
import {None} from '../utils'

/**
 * @group Generators
 */
export class KeyboardBndr extends Bndr<string> {
	constructor() {
		super({
			value: None,
			defaultValue: '',
		})

		hotkeys('*', e => {
			this.emit(e.key.toLowerCase())
		})
	}

	/**
	 * @group Generators
	 */
	@Memoize()
	key(
		key: string,
		options: BndrGeneratorOptions | boolean = {}
	): Bndr<boolean> {
		const ret = new Bndr({
			value: None,
			defaultValue: false,
		})

		const doPreventDefault =
			typeof options === 'object' && options.preventDefault

		const doStopPropagation =
			typeof options === 'object' && options.stopPropagation

		const handler = (evt: KeyboardEvent) => {
			if (doPreventDefault) evt.preventDefault()
			if (doStopPropagation) evt.stopPropagation()

			ret.emit(evt.type === 'keydown')
		}

		hotkeys(key, {keyup: true}, handler)

		return ret
	}
}
