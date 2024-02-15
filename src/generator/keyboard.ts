import Case from 'case'
import hotkeys from 'hotkeys-js'

import {Emitter, GeneratorOptions} from '../Emitter'
import {Memoized} from '../memoize'
import {Icon, IconSequence} from '../types'
import {cancelEventBehavior} from '../utils'

interface KeyboardGeneratorOptions extends GeneratorOptions {
	scope?: string
	capture?: boolean
}

const isApple = /mac|ipod|iphone|ipad/i.test(navigator.userAgent)

const normalizedKeyName = new Map<string, string>([
	// Command / Meta / Ctrl
	['⌘', isApple ? 'command' : 'ctrl'],
	['meta', isApple ? 'command' : 'ctrl'],
	['cmd', isApple ? 'command' : 'ctrl'],
	['ctrl', isApple ? 'command' : 'ctrl'],

	// Option / Alt
	['⌥', isApple ? 'option' : 'alt'],
	['option', isApple ? 'option' : 'alt'],
	['alt', isApple ? 'option' : 'alt'],

	// Others
	['⇧', 'shift'],
	['⌃', 'control'],
	['return', 'enter'],
])

const KeyNameToIcon = new Map<string, Icon>([
	['command', {type: 'iconify', icon: 'mdi:apple-keyboard-command'}],
	['option', {type: 'iconify', icon: 'mdi:apple-keyboard-option'}],
	['shift', {type: 'iconify', icon: 'mdi:apple-keyboard-shift'}],
	['control', {type: 'iconify', icon: 'mdi:apple-keyboard-control'}],
	['up', {type: 'iconify', icon: 'mdi:arrow-up'}],
	['down', {type: 'iconify', icon: 'mdi:arrow-down'}],
	['left', {type: 'iconify', icon: 'mdi:arrow-left'}],
	['right', {type: 'iconify', icon: 'mdi:arrow-right'}],
])

const NormalizedKeyNameToCode = new Map<string, string>([
	['command', 'meta'],
	['option', 'alt'],
])

function normalizeHotkey(hotkey: string) {
	const normalizedHotkey = hotkey
		.trim()
		.toLocaleLowerCase()
		.replace(' ', '')
		.split('+')
		.reduce((keys: string[], k: string) => {
			if (k === '' && keys.at(-1) === '') {
				k = '+'
			}
			return [...keys, k]
		}, [])
		.filter(k => k !== '')
		.map(k => normalizedKeyName.get(k) ?? k)
		.join('+')

	if (normalizedHotkey !== hotkey) {
		// eslint-disable-next-line no-console
		console.warn(
			`[Bndr] Hotkey "${hotkey}" is normalized to "${normalizedHotkey}"`
		)
	}

	return normalizedHotkey
}

function hotkeyToIcon(hotkey: string): IconSequence {
	return hotkey
		.split('+')
		.reduce((keys: string[], k: string) => {
			if (k === '' && keys.at(-1) === '') {
				k = '+'
			}
			return [...keys, k]
		}, [])
		.filter(k => k !== '')
		.map(k => KeyNameToIcon.get(k) ?? Case.title(k))
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

		if (
			['alt', 'shift', 'control', 'option', 'command', 'ctrl'].includes(key)
		) {
			// Hotkeys.js cannot handle modification key only events,
			// so manually assigns to it
			ret = new Emitter({
				sources: this,
			})

			key = NormalizedKeyNameToCode.get(key) ?? key

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
		const ret = this.key(key, options).map(e => e.type === 'keydown', false)
		ret.icon = hotkeyToIcon(key)
		return ret
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
		return this.pressed(key, options).up()
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
