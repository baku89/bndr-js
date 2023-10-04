import * as combinator from './combinator'
import {Emitter} from './Emitter'
import * as gamepad from './generator/gamepad'
import * as keyboard from './generator/keyboard'
import * as midi from './generator/midi'
import * as pointer from './generator/pointer'
import {createScope, disposeAllEmitters} from './global'

const Bndr = {
	Emitter,
	...combinator,
	...gamepad,
	...keyboard,
	...midi,
	...pointer,
	disposeAllEmitters,
	createScope,
}

export {Bndr}
