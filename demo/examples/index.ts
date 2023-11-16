import Etch_a_Sketch from './Etch a Sketch.js?raw'
import Gamepad from './Gamepad.js?raw'
import Interval from './Interval.js?raw'
import Keyboard from './Keyboard.js?raw'
import MIDI_Controller from './MIDI Controller.js?raw'
import Pointer from './Pointer.js?raw'
import Position_Interpolation from './Position Interpolation.js?raw'
import Trail from './Trail.js?raw'
import WASD from './WASD.js?raw'
import ZUI from './ZUI.js?raw'

export default new Map<string, string>([
	['Pointer', Pointer],
	['Keyboard', Keyboard],
	['MIDI Controller', MIDI_Controller],
	['Gamepad', Gamepad],
	['Interval', Interval],
	['Trail', Trail],
	['Etch a Sketch', Etch_a_Sketch],
	['WASD', WASD],
	['Position Interpolation', Position_Interpolation],
	['ZUI (Zoom User Interface)', ZUI],
])
