export type Maybe<T> = T | undefined

export function bindMaybe<T, U>(
	value: Maybe<T>,
	fn: (value: T) => U
): Maybe<U> {
	if (value === undefined) return undefined
	return fn(value)
}

/**
 * Returns the first value that is not undefined among the arguments.
 */
export function chainMaybeValue<T>(...values: Maybe<T>[]): Maybe<T> {
	return values.find(v => v !== undefined)
}

export function cancelEventBehavior(
	e: Event,
	options?: {preventDefault?: boolean; stopPropagation?: boolean}
) {
	if (options?.preventDefault) e.preventDefault()
	if (options?.stopPropagation) e.stopPropagation()
}
