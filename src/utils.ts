export const None: unique symbol = Symbol('None')
export type Maybe<T> = T | typeof None

export function bindMaybe<T, U>(
	value: Maybe<T>,
	fn: (value: T) => U
): Maybe<U> {
	if (value === None) return None
	return fn(value)
}
