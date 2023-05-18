import {Bndr} from './Bndr'
import {GamepadBndr as gamepad} from './generator/gamepad'
import {KeyboardBndr as keyboard} from './generator/keyboard'
import {MIDIBndr as midi} from './generator/midi'
import {PointerBndr as pointer} from './generator/pointer'
import {NumberType, Vec2Type} from './ValueType'

export * from './combinator'

/**
 * Collection of “value types”, which defines algebraic structure such as add, scale, and norm. Some of {@link Bndr} instances have a type information so that they can be scaled or lerped without passing function explicily. See {@link Bndr.as} and {@link Bndr#map} for more details.
 * @group Value Type Indicators
 */
const type = {
	number: NumberType,
	vec2: Vec2Type,
}

export {Bndr, pointer, keyboard, midi, gamepad, type}
