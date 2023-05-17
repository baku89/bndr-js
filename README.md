# bndr.js

Bndr.js is a library for composing and filtering various types of user inputs in a monadic manner. It can handle inputs devices such as mouse, stylus, touches, keyboard, MIDI, and gamepad.

## Examples

```js
Bndr.pointer.position().throttle(200).on(console.log)

Bndr.pointer
	.pressed()
	.filter(v => !v)
	.on(cosole.log)

// Keyboard inputs
Bndr.keyboard.listen('enter').on(console.log)

Bind.midi.note()
```
