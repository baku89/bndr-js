import Case from 'case'

import {Emitter, GeneratorOptions} from '../Emitter'
import {Memoized} from '../memoize'
import {Icon, IconSequence} from '../types'
import {cancelEventBehavior} from '../utils'

interface KeyboardGeneratorOptions extends GeneratorOptions {
	scope?: string
	capture?: boolean
}

const isApple = /mac|ipod|iphone|ipad/i.test(navigator.userAgent)

const MetaName = isApple ? 'command' : 'ctrl'
const AltName = isApple ? 'option' : 'alt'

const normalizedKeyName = new Map<string, string>([
	// Command / Meta / Ctrl
	['⌘', MetaName],
	['meta', MetaName],
	['cmd', MetaName],
	['ctrl', MetaName],

	// Option / Alt
	['⌥', AltName],
	['option', AltName],
	['alt', AltName],

	// Others
	['⇧', 'shift'],
	['⌃', 'control'],
	['return', 'enter'],
])

const KeyNameToIcon = new Map<string, Icon>([
	[
		'command',
		isApple ? {type: 'iconify', icon: 'mdi:apple-keyboard-command'} : 'Ctrl',
	],
	[
		'option',
		isApple ? {type: 'iconify', icon: 'mdi:apple-keyboard-option'} : 'Alt',
	],
	[
		'shift',
		isApple ? {type: 'iconify', icon: 'mdi:apple-keyboard-shift'} : 'Shift',
	],
	['control', {type: 'iconify', icon: 'mdi:apple-keyboard-control'}],
	['up', {type: 'iconify', icon: 'mdi:arrow-up'}],
	['down', {type: 'iconify', icon: 'mdi:arrow-down'}],
	['left', {type: 'iconify', icon: 'mdi:arrow-left'}],
	['right', {type: 'iconify', icon: 'mdi:arrow-right'}],
])

const KeyCodeToChar = new Map<string, string>([
	// Symbols
	['Minus', '-'],
	['Equal', '='],
	['Comma', ','],
	['Perild', '.'],
	['Slash', '/'],
	['Backquote', '`'],
	['BracketLeft', '['],
	['BracketRight', ']'],
	['Backslash', '\\'],
	['Semicolon', ';'],
	['Quote', "'"],

	// Arrow keys
	['ArrowUp', 'up'],
	['ArrowDown', 'down'],
	['ArrowLeft', 'left'],
	['ArrowRight', 'right'],

	// Special keys
	['MetaLeft', MetaName],
	['MetaRight', MetaName],
	['ShiftLeft', 'shift'],
	['ShiftRight', 'shift'],
	['ControlLeft', 'ctrl'],
	['AltLeft', AltName],
	['AltRight', AltName],
	['Escape', 'esc'],
	['Backspace', 'backspace'],
])

function normalizeHotkey(hotkey: string) {
	const keys = hotkey
		.toLowerCase()
		.replace(/ +?/g, '')
		.split('+')
		.filter(k => k !== '')
		.map(k => normalizedKeyName.get(k) ?? k)

	return convertKeysToHotkey(keys)
}

const SpecialKeys = new Set(['shift', MetaName, AltName, 'control'])

const KeyOrder = new Map(
	[
		MetaName,
		AltName,
		'shift',
		'control',

		'up',
		'down',
		'left',
		'right',

		'space',
		'enter',
		'backspace',
		'capslock',
		'esc',
	].map((k, i) => [k, i] as const)
)

function normalizeCodeToKey(code: string) {
	if (code.startsWith('Key')) {
		return code.slice(3).toLowerCase()
	}
	if (code.startsWith('Digit')) {
		return code.slice(5)
	}

	const char = KeyCodeToChar.get(code)
	if (char) return char

	return code.toLowerCase()
}

interface KeyboardEmitterEvent {
	type: 'keydown' | 'keyup'
	key: string
	pressedKeys: Set<string>
	preventDefault: Event['preventDefault']
	stopPropagation: Event['stopPropagation']
}

function convertKeysToHotkey(keys: Iterable<string>): string {
	const hotkey = [...keys].sort((a, b) => {
		const orderA = KeyOrder.get(a) ?? a.charCodeAt(0) + 0xff
		const orderB = KeyOrder.get(b) ?? b.charCodeAt(0) + 0xff
		return orderA - orderB
	})
	return hotkey.join('+')
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
export class KeyboardEmitter extends Emitter<KeyboardEmitterEvent> {
	constructor(target: Window | HTMLElement | string = window) {
		let dom: Element | Window
		if (typeof target === 'string') {
			const _dom = document.querySelector(target)
			if (!_dom) throw new Error('Invalid selector')
			dom = _dom
		} else {
			dom = target
		}

		const pressedKeys = new Set<string>()

		const onReleaseCommand = () => {
			const releasedKeys = new Set<string>()
			for (const key of pressedKeys) {
				if (!SpecialKeys.has(key)) {
					pressedKeys.delete(key)
					releasedKeys.add(key)
				}
			}

			for (const key of releasedKeys) {
				this.emit({
					type: 'keyup',
					key,
					pressedKeys: new Set(pressedKeys),
					preventDefault: () => undefined,
					stopPropagation: () => undefined,
				})
			}
		}

		const onKeydown = (e: KeyboardEvent) => {
			if ('bndr' in e) return

			if (e.repeat) return

			const key = normalizeCodeToKey(e.code)

			pressedKeys.add(key)

			this.emit({
				type: 'keydown',
				key,
				pressedKeys: new Set(pressedKeys),
				preventDefault: e.preventDefault.bind(e),
				stopPropagation: e.stopPropagation.bind(e),
			})
		}

		const onKeyup = (e: KeyboardEvent) => {
			const key = normalizeCodeToKey(e.code)
			pressedKeys.delete(key)

			if (key === 'command') {
				onReleaseCommand()
			}

			this.emit({
				type: 'keyup',
				key,
				pressedKeys: new Set(pressedKeys),
				preventDefault: e.preventDefault.bind(e),
				stopPropagation: e.stopPropagation.bind(e),
			})
		}

		dom.addEventListener('keydown', onKeydown)
		dom.addEventListener('keyup', onKeyup)

		const onPointerEvent = (e: PointerEvent) => {
			if (pressedKeys.has('command') && !e.metaKey) {
				pressedKeys.delete('command')
				onReleaseCommand()

				this.emit({
					type: 'keyup',
					key: 'command',
					pressedKeys: new Set(pressedKeys),
					preventDefault: () => undefined,
					stopPropagation: () => undefined,
				})
			}
		}

		window.addEventListener('pointermove', onPointerEvent)

		super({
			onDispose() {
				dom.removeEventListener('keydown', onKeydown)
				dom.removeEventListener('keyup', onKeyup)
				window.removeEventListener('pointermove', onPointerEvent)
			},
		})
	}

	/**
	 * @group Generators
	 */
	@Memoized()
	pressed(key: string, options?: KeyboardGeneratorOptions): Emitter<boolean> {
		const ret = this.filter(e => e.key === key)
			.on(e => cancelEventBehavior(e, options))
			.map(e => e.type === 'keydown')

		ret.icon = hotkeyToIcon(key)

		return ret
	}

	/**
	 * @group Generators
	 */
	@Memoized()
	keydown(key: string, options?: KeyboardGeneratorOptions): Emitter<true> {
		const ret = this.filter(e => e.type === 'keydown' && e.key === key)
			.on(e => cancelEventBehavior(e, options))
			.constant(true)

		ret.icon = hotkeyToIcon(key)

		return ret
	}

	/**
	 * @group Generators
	 */
	@Memoized()
	keyup(key: string, options?: KeyboardGeneratorOptions): Emitter<true> {
		const ret = this.filter(e => e.type === 'keyup' && e.key === key)
			.on(e => cancelEventBehavior(e, options))
			.constant(true)

		ret.icon = hotkeyToIcon(key)

		return ret
	}

	/**
	 * @group Generators
	 */
	@Memoized()
	hotkey(hotkey: string, options?: KeyboardGeneratorOptions): Emitter<true> {
		const normalizedHotkey = normalizeHotkey(hotkey)

		const ret = this.filter(
			e =>
				e.type === 'keydown' &&
				convertKeysToHotkey(e.pressedKeys) === normalizedHotkey
		)
			.on(e => cancelEventBehavior(e, options))
			.constant(true)

		ret.icon = hotkeyToIcon(normalizedHotkey)

		return ret
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
