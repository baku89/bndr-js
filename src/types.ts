import {Observable} from 'rxjs'

export type Glyph = {type: 'iconify'; icon: string} | string
export type Glyphs = Glyph[]

/**
 * An Observable created directly from an RxIO source carries a sequence of
 * glyphs (iconify references and/or text literals) describing the input
 * visually. Once piped through a non-RxIO operator, the glyph is dropped
 * and the result is a plain Observable.
 */
export type GlyphedObservable<T> = Observable<T> & {readonly glyph: Glyphs}

export function withGlyph<T>(
	source: Observable<T>,
	glyph: Glyphs
): GlyphedObservable<T> {
	Object.defineProperty(source, 'glyph', {
		value: glyph,
		enumerable: true,
		writable: false,
	})
	return source as GlyphedObservable<T>
}
