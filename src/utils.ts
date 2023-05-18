export function findEqualProp<T, U>(coll: T[], fn: (t: T) => U): U | undefined {
	if (coll.length === 0) return

	const [prop, ...rest] = coll.map(fn)

	return rest.every(r => r === prop) ? prop : undefined
}

export const None: unique symbol = Symbol()
export type Maybe<T> = T | typeof None

export function bindMaybe<T, U>(
	value: Maybe<T>,
	fn: (value: T) => U
): Maybe<U> {
	if (value === None) return None
	return fn(value)
}
