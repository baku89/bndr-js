import {Observable, OperatorFunction, pipe} from 'rxjs'
import {filter, map, scan} from 'rxjs/operators'

import {GlyphedObservable, withGlyph} from '../types.js'

/**
 * Wraps an operator so that, if the source is a {@link GlyphedObservable}, the
 * resulting stream keeps the same glyph. Unlike arbitrary RxJS operators which
 * drop the glyph, the input-specific edge operators below describe the *same*
 * input as their source (e.g. a button press), so the glyph should survive.
 */
function preserveGlyph<T, R>(op: OperatorFunction<T, R>): OperatorFunction<T, R> {
	return (source: Observable<T>) => {
		const result = op(source)
		const glyph = (source as Partial<GlyphedObservable<T>>).glyph
		return glyph ? withGlyph(result, glyph) : result
	}
}

/**
 * Bangs at the moment the upstream value transitions from falsy to truthy.
 * Preserves the source glyph.
 */
export function rising<T>(): OperatorFunction<T, void> {
	return preserveGlyph(
		pipe(
			scan((acc, curr) => ({prev: acc.curr, curr}), {
				prev: undefined as T | undefined,
				curr: undefined as T | undefined,
			}),
			filter(({prev, curr}) => !prev && !!curr),
			map((): void => undefined)
		)
	)
}

/**
 * Bangs at the moment the upstream value transitions from truthy to falsy.
 * Preserves the source glyph.
 */
export function falling<T>(): OperatorFunction<T, void> {
	return preserveGlyph(
		pipe(
			scan((acc, curr) => ({prev: acc.curr, curr}), {
				prev: undefined as T | undefined,
				curr: undefined as T | undefined,
			}),
			filter(({prev, curr}) => !!prev && !curr),
			map((): void => undefined)
		)
	)
}
