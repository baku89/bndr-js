# ByndJS

## Examples

```js
Bndr.pointer.position().throttle(200).on(console.log)

Bndr.pointer
	.pressed()
	.filter(v => !v)
	.on(cosole.log)

// Keyboard inputs
Bndr.keyboard.listen('enter').on(console.log)

Bndr.merge(Bind.midi())
```
