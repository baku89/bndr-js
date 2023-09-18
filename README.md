<div align="center">
	<h1>Bndr.js</h1>
	<p>🖱️ ⌇ ⌨️ ⌇ 🎹 ⌇ 🎮 ⌇ 🖊️ ⌇ 🖕</p>

  <img src="screenshot.gif" />

<a href="https://baku89.github.io/bndr-js/">Demo</a> ⌇ <a href="https://github.com/baku89/bndr-js/blob/main/docs/README.md">API</a> ⌇ <a href="https://github.com/sponsors/baku89">Become a Sponsor</a>

</div>

**Bndr.js** /ˈbaɪndɚ/ is a library designed to compose events from various user inputs and chain filters in a monadic manner, integrating them into a single event object. It accommodates input devices such as mice🖱️, styluses🖊️, touch inputs🖕, keyboards⌨️, [MIDI](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) controllers🎹, and [gamepads](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API)🎮. Developed and maintained by [Baku Hashimoto](https://baku89.com).

Potential use cases for this library include:

- Associating user inputs with arbitrary triggers for VJing
- Introducing manual operations in generative art.

To get a feel for how it works, please try out [this demo](https://baku89.github.io/bndr-js/).

## How to use

- [Full API documentation](https://github.com/baku89/bndr-js/blob/main/docs/README.md)

### Installation

```
npm install bndr-js
```

### Example

```js
import * as Bndr from 'bndr-js'

Bndr.pointer.on(pressed =>
	console.log('Pointer %s', pressed ? 'pressed' : 'released')
)

Bndr.pointer(window)
	.position()
	.lerp(0.1)
	.on(([x, y]) => console.log('Pointer moved: [%f, %f]', x, y))

Bndr.keyboard
	.key('shift+c')
	.down()
	.on(() => console.log('Hotkey shift+c pressed'))

Bndr.midi
	.note(0, 50)
	.on(velocity => console.log('MIDI slider #50 moved: %d', velocity))

Bndr.gamepad
	.axis(0)
	.on(([x, y]) => console.log('Gamepad axis #0 tilted: [%f, %f]', x, y))
```

## LICENSE

This repository is published under an MIT License. See the included [LICENSE file](./LICENSE).
