import {Observable, OperatorFunction} from 'rxjs'

/**
 * Emits the upstream value once it has stayed truthy for `waitMs`.
 * If the value goes falsy before the timeout, the timer is cancelled.
 */
export function longPress<T>(waitMs: number): OperatorFunction<T, T> {
	return source =>
		new Observable<T>(sub => {
			let timer: ReturnType<typeof setTimeout> | undefined

			const inner = source.subscribe({
				next: value => {
					if (value) {
						if (!timer) {
							timer = setTimeout(() => {
								sub.next(value)
								timer = undefined
							}, waitMs)
						}
					} else if (timer) {
						clearTimeout(timer)
						timer = undefined
					}
				},
				error: err => sub.error(err),
				complete: () => sub.complete(),
			})

			return () => {
				inner.unsubscribe()
				if (timer) clearTimeout(timer)
			}
		})
}
