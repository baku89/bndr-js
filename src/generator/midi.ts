import {Emitter} from '../Emitter'
import {None} from '../utils'
import {NumberType} from '../ValueType'

type MIDIData = [number, number, number]

/**
 * @group Generators
 */
export class MidiEmitter extends Emitter<MIDIData> {
	constructor() {
		super({
			value: None,
			defaultValue: [0, 0, 0],
		})

		this.#init()
	}

	async #init() {
		const midi = await navigator.requestMIDIAccess()

		if (!midi) {
			console.error('Cannot access MIDI devices on this browser')
			return
		}

		midi.inputs.forEach(input => {
			input.addEventListener('midimessage', evt => {
				const value = [...evt.data] as MIDIData
				this.emit(value)
			})
		})
	}

	/**
	 * @group Generators
	 */
	note(channel: number, note: number): Emitter<number> {
		const ret = new Emitter({
			value: None,
			defaultValue: 0,
			type: NumberType,
		})

		this.on(([status, _note, velocity]: MIDIData) => {
			if (status === 176 + channel && _note === note) {
				ret.emit(velocity)
			}
		})

		return ret
	}
}
