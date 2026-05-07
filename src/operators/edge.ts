import {OperatorFunction, pipe} from 'rxjs'
import {filter, map, scan} from 'rxjs/operators'

/**
 * Bangs at the moment the upstream value transitions from falsy to truthy.
 */
export function rising<T>(): OperatorFunction<T, void> {
	return pipe(
		scan((acc, curr) => ({prev: acc.curr, curr}), {
			prev: undefined as T | undefined,
			curr: undefined as T | undefined,
		}),
		filter(({prev, curr}) => !prev && !!curr),
		map((): void => undefined)
	)
}

/**
 * Bangs at the moment the upstream value transitions from truthy to falsy.
 */
export function falling<T>(): OperatorFunction<T, void> {
	return pipe(
		scan((acc, curr) => ({prev: acc.curr, curr}), {
			prev: undefined as T | undefined,
			curr: undefined as T | undefined,
		}),
		filter(({prev, curr}) => !!prev && !curr),
		map((): void => undefined)
	)
}
