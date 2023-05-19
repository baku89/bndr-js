import {Bndr} from './Bndr'
import {GamepadBndr} from './generator/gamepad'
import {KeyboardBndr} from './generator/keyboard'
import {MIDIBndr} from './generator/midi'
import {PointerBndr} from './generator/pointer'

Bndr.pointer = new PointerBndr()
Bndr.keyboard = new KeyboardBndr()
Bndr.midi = new MIDIBndr()
Bndr.gamepad = new GamepadBndr()

export default Bndr
