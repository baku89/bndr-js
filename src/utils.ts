export function cancelEventBehavior(
	e: Pick<Event, 'preventDefault' | 'stopPropagation'>,
	options?: {preventDefault?: boolean; stopPropagation?: boolean}
) {
	if (options?.preventDefault) e.preventDefault()
	if (options?.stopPropagation) e.stopPropagation()
}

export interface EventOptions {
	preventDefault?: boolean
	stopPropagation?: boolean
}
