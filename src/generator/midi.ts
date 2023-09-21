import {Emitter} from '../Emitter'

export type MIDIData = [number, number, number]

/**
 * @group Emitters
 */
export class MidiEmitter extends Emitter<MIDIData> {
	constructor() {
		super()
		this.#init()
	}

	async #init() {
		if (!navigator.requestMIDIAccess) {
			console.error('Cannot access MIDI devices on this browser')
			return
		}

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
	 * @group Filters
	 */
	note(channel: number, note: number): Emitter<number> {
		return this.filterMap(([status, _note, velocity]: MIDIData) => {
			if (status === 176 + channel && _note === note) {
				return velocity
			} else {
				return undefined
			}
		}, 0)
	}
}

/**
 * @group Generators
 */
export function midi() {
	return new MidiEmitter()
}
