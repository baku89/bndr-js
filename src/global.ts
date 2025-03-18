import {type Emitter} from './Emitter.js'

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
 * @example
 * ```ts
 * const dispose = createScope(() => {
 * 		Bndr.keyboard()
 * 			.pressed('a')
 * 			.on(console.log)
 * })
 * dispose()
 * ```
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

/**
 * The string representation of a {@link Emitter}. That can be used to create a new Emitter instance.
 * @example
 * "keyboard/command+s"
 * "keyboard/shift+enter"
 * "gamepad/b"
 * "gamepad/square"
 */
export type GeneratorPath = string
