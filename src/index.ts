export {Emitter, disposeAllEmitters} from './Emitter'
import {GamepadEmitter} from './generator/gamepad'
import {KeyboardEmitter} from './generator/keyboard'
import {MidiEmitter} from './generator/midi'
export {pointer} from './generator/pointer'
export * from './combinator'

export const keyboard = new KeyboardEmitter()
export const midi = new MidiEmitter()
export const gamepad = new GamepadEmitter()
