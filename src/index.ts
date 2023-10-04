import * as combinator from './combinator'
import * as Emitter from './Emitter'
import * as gamepad from './generator/gamepad'
import * as keyboard from './generator/keyboard'
import * as midi from './generator/midi'
import * as pointer from './generator/pointer'
import {createScope, disposeAllEmitters, GeneratorPath} from './global'

/**
 * @private
 */
const Bndr = {
	...Emitter,
	...combinator,
	...gamepad,
	...keyboard,
	...midi,
	...pointer,
	disposeAllEmitters,
	createScope,
}

export {Bndr}

export * from './combinator'
export * from './Emitter'
export * from './generator/gamepad'
export * from './generator/keyboard'
export * from './generator/midi'
export * from './generator/pointer'
export {createScope, disposeAllEmitters, type GeneratorPath}
