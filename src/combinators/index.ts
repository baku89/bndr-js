import {
	combineLatest as rxCombineLatest,
	merge as rxMerge,
	Observable,
} from 'rxjs'

import {Glyphs, GlyphedObservable, withGlyph} from '../types.js'

function readGlyph(o: Observable<unknown>): Glyphs | undefined {
	return (o as Partial<GlyphedObservable<unknown>>).glyph
}

function mergeGlyphs(sources: readonly Observable<unknown>[]): Glyphs {
	return sources
		.map(readGlyph)
		.filter((v): v is Glyphs => !!v)
		.reduce<Glyphs>(
			(seq, glyph) => (seq.length === 0 ? glyph : [...seq, ', ', ...glyph]),
			[]
		)
}

/**
 * Glyph-preserving wrapper around RxJS `merge`. Joins each source's glyph
 * sequence with `, ` separators.
 */
export function merge<T>(...sources: Observable<T>[]): GlyphedObservable<T> {
	if (sources.length === 0) throw new Error('Zero-length sources')
	return withGlyph(rxMerge(...sources), mergeGlyphs(sources))
}

type UnwrapObs<T> = T extends Observable<infer U> ? U : never
type UnwrapAll<T> = {[K in keyof T]: UnwrapObs<T[K]>}

/**
 * Glyph-preserving wrapper around RxJS `combineLatest`. Takes an array of
 * sources and emits a tuple of their latest values, with glyphs joined.
 */
export function combineLatest<const T extends readonly Observable<unknown>[]>(
	sources: readonly [...T]
): GlyphedObservable<UnwrapAll<T>> {
	const obs = rxCombineLatest(sources) as Observable<UnwrapAll<T>>
	return withGlyph(obs, mergeGlyphs(sources))
}

/**
 * Emits `true` when the given held-state emitters become truthy in sequence
 * from first to last. Useful for chord-like input combos that the simple
 * `shortcut` helper can't express. Sources must be held-state booleans —
 * one-shot bangs (`Observable<void>`) don't make sense here.
 */
export function cascade(
	...sources: Observable<boolean>[]
): GlyphedObservable<boolean> {
	const obs = new Observable<boolean>(sub => {
		const values = sources.map(() => false)
		let prevIdx = -1
		let idx = -1

		const subs = sources.map((s, i) =>
			s.subscribe(v => {
				values[i] = v

				if (v) {
					if (idx === i - 1) idx = i
				} else if (idx === i) {
					idx = values.findIndex(x => x)
				}

				if (prevIdx < idx && idx === sources.length - 1) {
					sub.next(true)
				} else if (idx < prevIdx && idx < sources.length - 1) {
					sub.next(false)
				}

				prevIdx = idx
			})
		)

		return () => subs.forEach(s => s.unsubscribe())
	})
	return withGlyph(obs, mergeGlyphs(sources))
}
