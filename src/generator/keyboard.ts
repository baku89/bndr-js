import hotkeys from 'hotkeys-js'

import {Emitter, GeneratorOptions} from '../Emitter'
import {Memoized} from '../memoize'
import {cancelEventBehavior} from '../utils'

interface KeyboardGeneratorOptions extends GeneratorOptions {
	scope?: string
	capture?: boolean
}

function normalizeHotkey(key: string) {
	return key
		.trim()
		.toLocaleLowerCase()
		.replace(' ', '')
		.replace('option', 'alt')
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
	@Memoized()
	key(key: string, options?: KeyboardGeneratorOptions): Emitter<KeyboardEvent> {
		key = normalizeHotkey(key)

		let ret: Emitter<KeyboardEvent>

		if (['alt', 'shift', 'control'].includes(key)) {
			// Hotkeys.js cannot handle modification key only events,
			// so manually assigns to it
			ret = new Emitter({
				sources: this,
			})

			this.registerDerived(ret, value => {
				if (value.key.toLowerCase() === key) ret.emit(value)
			})
		} else {
			ret = new Emitter({
				onDispose() {
					hotkeys.unbind(key, ret.emit)
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
				ret.emit.bind(ret)
			)
		}

		ret.on(e => cancelEventBehavior(e, options))

		return ret
	}

	/**
	 * @group Generators
	 */
	@Memoized()
	pressed(key: string, options?: KeyboardGeneratorOptions): Emitter<boolean> {
		return this.key(key, options).map(e => e.type === 'keydown', false)
	}

	/**
	 * @group Generators
	 */
	@Memoized()
	keydown(key: string, options?: KeyboardGeneratorOptions): Emitter<true> {
		return this.pressed(key, options).filter(key => key) as Emitter<true>
	}

	/**
	 * @group Generators
	 */
	@Memoized()
	keyup(key: string, options?: KeyboardGeneratorOptions): Emitter<true> {
		return this.pressed(key, options)
			.filter(key => !key)
			.constant(true)
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
