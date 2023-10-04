import {type Emitter} from './Emitter'

/**
 * Adds an Emitter instance to the global list, for disposing them later
 * @private
 */
export function addEmitterInstance(emitter: Emitter) {
	EmitterInstances.add(emitter)

	onEmitterCreatedCallbacks.forEach(cb => cb(emitter))
}

/**
 * Stores all Emitter instances for resetting the listeners at once
 */
const EmitterInstances = new Set<Emitter>()

const onEmitterCreatedCallbacks = new Set<(emitter: Emitter) => void>()

/**
 * Disposes all Emitter instances
 * @group Global Functions
 */
export function disposeAllEmitters() {
	EmitterInstances.forEach(emitter => {
		emitter.dispose()
	})
}

/**
 * Creates a scope for Emitter instances so that they can be disposed by calling the return value.
 *
 * @param fn The function to run in the scope
 * @returns A function that disposes all Emitter instances created in the scope
 */
export function createScope(fn: () => void) {
	const instances = new Set<Emitter>()

	function onCreated(emitter: Emitter) {
		instances.add(emitter)
	}

	try {
		onEmitterCreatedCallbacks.add(onCreated)
		fn()
	} finally {
		onEmitterCreatedCallbacks.delete(onCreated)
	}

	return () => {
		instances.forEach(instance => {
			instance.dispose()
		})
	}
}
