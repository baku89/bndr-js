import {uniqueId} from 'lodash'

import {Emitter} from './Emitter'

const idForObject = new WeakMap<object, string>()

function replacer(_: string, value: any) {
	if (
		value instanceof Element ||
		value instanceof Window ||
		value instanceof Emitter
	) {
		if (!idForObject.has(value)) {
			idForObject.set(value, '__object_' + uniqueId())
		}

		return idForObject.get(value)
	}

	return value
}

/**
 * Memoize an instance method.
 */
export function Memoized() {
	return (
		_target: Emitter,
		_propertyKey: string,
		descriptor: TypedPropertyDescriptor<any>
	) => {
		if (descriptor.value) {
			descriptor.value = memoizeFunction(descriptor.value)
		} else if (descriptor.get) {
			descriptor.get = memoizeFunction(descriptor.get)
		} else {
			throw new Error('Memoize can only be applied to methods')
		}
	}
}

export function memoizeFunction<Args extends unknown[], ReturnType>(
	fn: (this: any, ...args: Args) => ReturnType
) {
	const memoizeMaps = new WeakMap<object, Map<string, ReturnType>>()

	return function (this: any, ...args: Args): ReturnType {
		let map = memoizeMaps.get(this)

		if (!map) {
			map = new Map()
			memoizeMaps.set(this, map)
		}

		const hash = JSON.stringify(args, replacer)

		const memoized = map.get(hash)

		if (
			memoized === undefined ||
			(memoized instanceof Emitter && memoized.disposed)
		) {
			const ret = fn.apply(this, args)
			map.set(hash, ret)
			return ret
		} else {
			return memoized
		}
	}
}
