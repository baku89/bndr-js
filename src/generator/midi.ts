import {Emitter} from '../Emitter'
import {Memoized, memoizeFunction} from '../memoize'

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
			// eslint-disable-next-line no-console
			console.error('Cannot access MIDI devices on this browser')
			return
		}

		const midi = await navigator.requestMIDIAccess()

		if (!midi) {
			// eslint-disable-next-line no-console
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
	@Memoized()
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
export const midi = memoizeFunction(() => new MidiEmitter())
