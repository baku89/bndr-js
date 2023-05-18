import Bndr from './Bndr'
import {GamepadBndr} from './generator/GamepadBndr'
import {KeyboardBndr} from './generator/KeyboardBndr'
import {MIDIBndr} from './generator/MIDIBndr'
import {PointerBndr} from './generator/PointerBndr'

Bndr.pointer = new PointerBndr()
Bndr.keyboard = new KeyboardBndr()
Bndr.midi = new MIDIBndr()
Bndr.gamepad = new GamepadBndr()

export default Bndr
