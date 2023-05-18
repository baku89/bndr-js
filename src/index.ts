import {Bndr} from './Bndr'
import {removeAllListeners} from './function'
import {GamepadBndr} from './generator/gamepad'
import {KeyboardBndr} from './generator/keyboard'
import {MIDIBndr} from './generator/midi'
import {PointerBndr} from './generator/pointer'
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

const pointer = new PointerBndr()
const keyboard = new KeyboardBndr()
const midi = new MIDIBndr()
const gamepad = new GamepadBndr()

export {Bndr, pointer, keyboard, midi, gamepad, type, removeAllListeners}
