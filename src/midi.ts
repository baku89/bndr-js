import {Observable, share} from 'rxjs'
import {filter, map} from 'rxjs/operators'

import {GlyphedObservable, withGlyph} from './types.js'

export type MIDIData = [number, number, number]

let _events$: Observable<MIDIData> | null = null

function events(): Observable<MIDIData> {
	return (_events$ ??= new Observable<MIDIData>(sub => {
		if (!navigator.requestMIDIAccess) {
			sub.error(new Error('Web MIDI API not supported'))
			return
		}

		let cleanup = () => undefined as void

		navigator.requestMIDIAccess().then(midi => {
			const handlers: Array<{
				input: {removeEventListener: (t: string, h: any) => void}
				handler: (e: any) => void
			}> = []
			midi.inputs.forEach((input: any) => {
				const handler = (evt: any) => {
					const data = evt.data
					if (!data) return
					sub.next([...data] as MIDIData)
				}
				input.addEventListener('midimessage', handler)
				handlers.push({input, handler})
			})
			cleanup = () => {
				handlers.forEach(({input, handler}) =>
					input.removeEventListener('midimessage', handler)
				)
			}
		})

		return () => cleanup()
	}).pipe(share()))
}

const GLYPH: GlyphedObservable<unknown>['glyph'] = [
	{type: 'iconify', icon: 'mdi:piano'},
]

export function all(): GlyphedObservable<MIDIData> {
	return withGlyph(events(), GLYPH)
}

/**
 * Emits the velocity (0-127) for the given control-change channel + note.
 */
export function note(channel: number, note: number): GlyphedObservable<number> {
	const obs = events().pipe(
		filter(([status, n]) => status === 176 + channel && n === note),
		map(([, , velocity]) => velocity)
	)
	return withGlyph(obs, GLYPH)
}
