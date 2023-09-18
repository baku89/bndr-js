export type Maybe<T> = T | undefined

export function bindMaybe<T, U>(
	value: Maybe<T>,
	fn: (value: T) => U
): Maybe<U> {
	if (value === undefined) return undefined
	return fn(value)
}
