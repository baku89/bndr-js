import {Observable, OperatorFunction} from 'rxjs'

type Lerp<T> = (a: T, b: T, t: number) => T

/**
 * Smoothly interpolates between emissions using rAF, easing toward the latest
 * upstream value at the given rate.
 *
 * @param lerpFn   Interpolation function (e.g. `vec2.lerp`)
 * @param rate     Per-frame interpolation rate, 0–1.
 * @param threshold When the change is smaller than this, snap to the target.
 */
export function lerp<T>(
	lerpFn: Lerp<T>,
	rate: number,
	threshold = 1e-4
): OperatorFunction<T, T> {
	return source =>
		new Observable<T>(sub => {
			let t = 1
			let start: T | undefined
			let end: T | undefined
			let curr: T | undefined
			let raf = 0

			const tick = () => {
				if (start === undefined || end === undefined) return
				t = 1 - (1 - t) * (1 - rate)
				curr = lerpFn(start, end, t)
				if (t < 1 - threshold) {
					sub.next(curr)
					raf = requestAnimationFrame(tick)
				} else {
					sub.next(end)
					t = 1
					start = end = undefined
				}
			}

			const inner = source.subscribe({
				next: value => {
					const updating = start !== undefined && end !== undefined
					if (curr === undefined) curr = value
					t = 0
					start = curr
					end = value
					if (!updating) tick()
				},
				error: err => sub.error(err),
				complete: () => sub.complete(),
			})

			return () => {
				inner.unsubscribe()
				cancelAnimationFrame(raf)
				start = end = undefined
			}
		})
}

/**
 * Tween from the previous emission to the latest one over a fixed duration.
 *
 * @param lerpFn      Interpolation function.
 * @param durationMs  Tween duration in milliseconds.
 */
export function tween<T>(
	lerpFn: Lerp<T>,
	durationMs: number
): OperatorFunction<T, T> {
	return source =>
		new Observable<T>(sub => {
			let startTime = 0
			let start: T | undefined
			let target: T | undefined
			let last: T | undefined
			let raf = 0

			const tick = () => {
				if (start === undefined || target === undefined) return
				const elapsed = Date.now() - startTime
				const t = elapsed / durationMs
				if (t < 1) {
					last = lerpFn(start, target, t)
					sub.next(last)
					raf = requestAnimationFrame(tick)
				} else {
					last = target
					sub.next(target)
					start = target = undefined
				}
			}

			const inner = source.subscribe({
				next: value => {
					const updating = start !== undefined && target !== undefined
					startTime = Date.now()
					start = last ?? value
					target = value
					if (!updating) tick()
				},
				error: err => sub.error(err),
				complete: () => sub.complete(),
			})

			return () => {
				inner.unsubscribe()
				cancelAnimationFrame(raf)
				start = target = undefined
			}
		})
}
