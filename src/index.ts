import {Emitter, reset} from './Emitter'
import {GamepadEmitter} from './generator/gamepad'
import {KeyboardEmitter} from './generator/keyboard'
import {MidiEmitter} from './generator/midi'
import {pointer} from './generator/pointer'

export default {
	pointer,
	keyboard: new KeyboardEmitter(),
	midi: new MidiEmitter(),
	gamepad: new GamepadEmitter(),

	reset,
	combine: Emitter.combine,
	tuple: Emitter.tuple,
	cascade: Emitter.cascade,
	and: Emitter.and,
	or: Emitter.or,
}
