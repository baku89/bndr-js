import {Emitter, reset} from './Emitter'
import {GamepadEmitter} from './generator/gamepad'
import {KeyboardEmitter} from './generator/keyboard'
import {MidiEmitter} from './generator/midi'
import {PointerEmitter} from './generator/pointer'
import {NumberType, Vec2Type} from './ValueType'

export default {
	pointer: new PointerEmitter(),
	keyboard: new KeyboardEmitter(),
	midi: new MidiEmitter(),
	gamepad: new GamepadEmitter(),

	/**
	 * Collection of “value types”, which defines algebraic structure such as add, scale, and norm. Some of {@link Emitter} instances have a type information so that they can be scaled or lerped without passing a function explicitly. See {@link Emitter.as} and {@link Emitter#map} for more details.
	 * @group Value Type Indicators
	 */
	type: {
		number: NumberType,
		vec2: Vec2Type,
	},
	reset,
	combine: Emitter.combine,
	tuple: Emitter.tuple,
	and: Emitter.and,
	vec2: Emitter.vec2,
}
