import {BndrInstances} from './Bndr'

/**
 * Unregisters all listeners of all Bndr instances ever created.
 */
export function removeAllListeners() {
	BndrInstances.forEach(b => {
		b.removeAllListeners()
	})
}
