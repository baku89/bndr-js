export {Emitter, disposeAllEmitters} from './Emitter'
import {GamepadEmitter} from './generator/gamepad'
import {MidiEmitter} from './generator/midi'
export {keyboard} from './generator/keyboard'
export {pointer} from './generator/pointer'
export * from './combinator'

export const midi = new MidiEmitter()
export const gamepad = new GamepadEmitter()
