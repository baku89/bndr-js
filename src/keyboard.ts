import Case from 'case'
import {Observable, share} from 'rxjs'
import {distinctUntilChanged, filter, map} from 'rxjs/operators'

import {Glyph, Glyphs, GlyphedObservable, withGlyph} from './types.js'

const isApple = /mac|ipod|iphone|ipad/i.test(navigator.userAgent)

const MetaName = isApple ? 'command' : 'ctrl'
const AltName = isApple ? 'option' : 'alt'

const normalizedKeyName = new Map<string, string>([
	['⌘', MetaName],
	['meta', MetaName],
	['cmd', MetaName],
	['ctrl', MetaName],
	['⌥', AltName],
	['option', AltName],
	['alt', AltName],
	['⇧', 'shift'],
	['⌃', 'control'],
	['return', 'enter'],
])

const KeyNameToGlyph = new Map<string, Glyph>([
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
	['ArrowUp', 'up'],
	['ArrowDown', 'down'],
	['ArrowLeft', 'left'],
	['ArrowRight', 'right'],
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

const SpecialKeys = new Set(['shift', MetaName, AltName, 'control'])

/**
 * Maps W3C modifier names (used by `KeyboardEvent.getModifierState()` and
 * available on every UI event) to our internal key names. On non-Apple
 * platforms `Meta` is intentionally omitted because the Win key is conflated
 * into `'ctrl'` by the keycode map; reconciling it would clobber state.
 */
const ReconcilableModifiers: ReadonlyArray<readonly [string, string]> = isApple
	? [
			['Shift', 'shift'],
			['Control', 'ctrl'],
			['Alt', AltName],
			['Meta', MetaName],
		]
	: [
			['Shift', 'shift'],
			['Control', 'ctrl'],
			['Alt', AltName],
		]

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

function normalizeCodeToKey(code: string): string {
	if (code.startsWith('Key')) return code.slice(3).toLowerCase()
	if (code.startsWith('Digit')) return code.slice(5)
	return KeyCodeToChar.get(code) ?? code.toLowerCase()
}

function normalizeHotkey(hotkey: string): string {
	const keys = hotkey
		.toLowerCase()
		.replace(/ +?/g, '')
		.split('+')
		.filter(k => k !== '')
		.map(k => normalizedKeyName.get(k) ?? k)
	return convertKeysToHotkey(keys)
}

function convertKeysToHotkey(keys: Iterable<string>): string {
	return [...keys]
		.sort((a, b) => {
			const orderA = KeyOrder.get(a) ?? a.charCodeAt(0) + 0xff
			const orderB = KeyOrder.get(b) ?? b.charCodeAt(0) + 0xff
			return orderA - orderB
		})
		.join('+')
}

function hotkeyToGlyph(hotkey: string): Glyphs {
	return hotkey
		.split('+')
		.reduce((keys: string[], k: string) => {
			if (k === '' && keys.at(-1) === '') k = '+'
			return [...keys, k]
		}, [])
		.filter(k => k !== '')
		.map(k => KeyNameToGlyph.get(k) ?? Case.title(k))
}

interface KeyEvent {
	type: 'keydown' | 'keyup'
	key: string
	repeat: boolean
	pressedKeys: Set<string>
	preventDefault: () => void
	stopPropagation: () => void
}

interface Options {
	preventDefault?: boolean
	stopPropagation?: boolean
}

interface HotkeyOptions extends Options {
	repeat?: boolean
}

type ModifierStateProvider = {
	getModifierState?: (key: string) => boolean
}

let _events$: Observable<KeyEvent> | null = null

function events(): Observable<KeyEvent> {
	return (_events$ ??= new Observable<KeyEvent>(sub => {
		const pressedKeys = new Set<string>()

		const synth = (type: 'keydown' | 'keyup', key: string): KeyEvent => ({
			type,
			key,
			repeat: false,
			pressedKeys: new Set(pressedKeys),
			preventDefault: () => undefined,
			stopPropagation: () => undefined,
		})

		// macOS swallows the keyup of non-special keys held during a Cmd-up.
		// Force-release them when the meta key goes up on Apple.
		const releaseNonSpecial = () => {
			const released: string[] = []
			for (const k of pressedKeys) {
				if (!SpecialKeys.has(k)) released.push(k)
			}
			for (const key of released) {
				pressedKeys.delete(key)
				sub.next(synth('keyup', key))
			}
		}

		// On focus loss / tab hide we get no keyup events. Force-clear so
		// downstream `pressed()` streams don't get stuck reporting `true`.
		const releaseAll = () => {
			const all = [...pressedKeys]
			pressedKeys.clear()
			for (const key of all) sub.next(synth('keyup', key))
		}

		// Synthesize keydown/keyup for any modifier whose live state (per
		// `getModifierState`) disagrees with our tracked state. Called on
		// every input event so we self-heal even when explicit keyup events
		// were swallowed by the OS, focus changes, or browser shortcuts.
		const reconcileModifiers = (e: ModifierStateProvider) => {
			if (typeof e.getModifierState !== 'function') return
			for (const [w3c, ours] of ReconcilableModifiers) {
				const isHeld = e.getModifierState(w3c)
				const wasHeld = pressedKeys.has(ours)
				if (wasHeld && !isHeld) {
					pressedKeys.delete(ours)
					if (isApple && ours === MetaName) releaseNonSpecial()
					sub.next(synth('keyup', ours))
				} else if (!wasHeld && isHeld) {
					pressedKeys.add(ours)
					sub.next(synth('keydown', ours))
				}
			}
		}

		// IME composition fires phantom keydown/keyup events (often with
		// `key === 'Process'` or keyCode 229) that don't represent the user's
		// real intent — skip them entirely. Modifier reconciliation is still
		// done because modifier state tracking is unaffected by IME.
		const isPhantom = (e: KeyboardEvent) =>
			e.isComposing || e.keyCode === 229

		const onKeydown = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLInputElement) return
			reconcileModifiers(e)
			if (isPhantom(e)) return
			const key = normalizeCodeToKey(e.code)
			pressedKeys.add(key)
			sub.next({
				type: 'keydown',
				key,
				repeat: e.repeat,
				pressedKeys: new Set(pressedKeys),
				preventDefault: e.preventDefault.bind(e),
				stopPropagation: e.stopPropagation.bind(e),
			})
		}

		const onKeyup = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLInputElement) return
			if (isPhantom(e)) {
				reconcileModifiers(e)
				return
			}
			const key = normalizeCodeToKey(e.code)
			pressedKeys.delete(key)
			if (isApple && key === MetaName) releaseNonSpecial()
			sub.next({
				type: 'keyup',
				key,
				repeat: false,
				pressedKeys: new Set(pressedKeys),
				preventDefault: e.preventDefault.bind(e),
				stopPropagation: e.stopPropagation.bind(e),
			})
			reconcileModifiers(e)
		}

		const onPointerOrWheel = (e: PointerEvent | WheelEvent) => {
			reconcileModifiers(e)
		}

		const onBlur = () => releaseAll()
		const onVisibilityChange = () => {
			if (document.hidden) releaseAll()
		}

		window.addEventListener('keydown', onKeydown)
		window.addEventListener('keyup', onKeyup)
		window.addEventListener('pointermove', onPointerOrWheel)
		window.addEventListener('pointerdown', onPointerOrWheel)
		window.addEventListener('wheel', onPointerOrWheel, {passive: true})
		window.addEventListener('blur', onBlur)
		document.addEventListener('visibilitychange', onVisibilityChange)

		return () => {
			window.removeEventListener('keydown', onKeydown)
			window.removeEventListener('keyup', onKeyup)
			window.removeEventListener('pointermove', onPointerOrWheel)
			window.removeEventListener('pointerdown', onPointerOrWheel)
			window.removeEventListener('wheel', onPointerOrWheel)
			window.removeEventListener('blur', onBlur)
			document.removeEventListener('visibilitychange', onVisibilityChange)
		}
	}).pipe(share()))
}

function applyOptions(e: KeyEvent, opts?: Options) {
	if (opts?.preventDefault) e.preventDefault()
	if (opts?.stopPropagation) e.stopPropagation()
}

/**
 * Emits `true` while `key` is held, `false` otherwise.
 */
export function pressed(key: string, opts?: Options): GlyphedObservable<boolean> {
	const obs = events().pipe(
		filter(e => e.key === key && !e.repeat),
		map(e => {
			applyOptions(e, opts)
			return e.type === 'keydown'
		}),
		distinctUntilChanged()
	)
	return withGlyph(obs, hotkeyToGlyph(key))
}

/**
 * Bangs on each keydown of `key`.
 */
export function keydown(key: string, opts?: Options): GlyphedObservable<void> {
	const obs = events().pipe(
		filter(e => e.type === 'keydown' && e.key === key && !e.repeat),
		map((e): void => {
			applyOptions(e, opts)
		})
	)
	return withGlyph(obs, hotkeyToGlyph(key))
}

/**
 * Bangs on each keyup of `key`.
 */
export function keyup(key: string, opts?: Options): GlyphedObservable<void> {
	const obs = events().pipe(
		filter(e => e.type === 'keyup' && e.key === key),
		map((e): void => {
			applyOptions(e, opts)
		})
	)
	return withGlyph(obs, hotkeyToGlyph(key))
}

/**
 * Bangs when `combo` (e.g. `'cmd+s'`) is pressed.
 */
export function shortcut(combo: string, opts?: HotkeyOptions): GlyphedObservable<void> {
	const normalized = normalizeHotkey(combo)
	const obs = events().pipe(
		filter(
			e =>
				e.type === 'keydown' &&
				convertKeysToHotkey(e.pressedKeys) === normalized &&
				(opts?.repeat ? true : !e.repeat)
		),
		map((e): void => {
			applyOptions(e, opts)
		})
	)
	return withGlyph(obs, hotkeyToGlyph(normalized))
}

/**
 * Raw key event stream. Useful for advanced cases.
 */
export function all(): Observable<KeyEvent> {
	return events()
}

export type {KeyEvent}
