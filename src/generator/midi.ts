import {Emitter} from '../Emitter'

type MIDIData = [number, number, number]

/**
 * @group Generators
 */
class MidiEmitter extends Emitter<MIDIData> {
	constructor() {
		super({
			defaultValue: [0, 0, 0],
		})

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
	 * @group Generators
	 */
	note(channel: number, note: number): Emitter<number> {
		const ret = new Emitter({
			defaultValue: 0,
		})

		this.on(([status, _note, velocity]: MIDIData) => {
			if (status === 176 + channel && _note === note) {
				ret.emit(velocity)
			}
		})

		return ret
	}
}

export function midi() {
	return new MidiEmitter()
}
