export const lerp = (a: number, b: number, t: number) => (b - a) * t + a

export function findEqualProp<T, U>(coll: T[], fn: (t: T) => U): U | undefined {
	if (coll.length === 0) return

	const [prop, ...rest] = coll.map(fn)

	return rest.every(r => r === prop) ? prop : undefined
}
