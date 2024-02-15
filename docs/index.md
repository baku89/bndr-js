---
home: true
---

<div class="badges">
	<p>
		<a href="https://www.npmjs.org/package/bndr-js">
			<img src="https://img.shields.io/npm/v/bndr-js.svg?style=flat-square" alt="npm version">
		</a>
		&nbsp;
		<a href="http://spdx.org/licenses/MIT">
			<img src="https://img.shields.io/npm/l/bndr-js.svg?style=flat-square" alt="npm license">
		</a>
	</p>
</div>

**Bndr** /ˈbaɪndɚ/ is a library designed to compose events from various user inputs and chain filters in a monadic manner, integrating them into a single event object. It accommodates input devices such as mice🖱️, styluses🖊️, touch inputs👆, keyboards⌨️, [MIDI](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) controllers🎹, and [gamepads](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API)🎮. Developed and maintained by [Baku Hashimoto](https://baku89.com).

Potential use cases for this library include:

- ⚡️ Associating user inputs with arbitrary triggers for VJing
- 🎨 Introducing manual operations in generative art.

To get a feel for how it works, please try out [this demo](https://baku89.github.io/bndr-js/).

## Supported Parameters

- 👆 Pointer (mouse, stylus, touch)
  - All parameters supported in [PointerEvent](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events). (pressure, tilt, multi-touch)
- ⌨️ Keyboard
- 🎹 MIDI
  - CC and velocity
- 🎮 Gamepad
  - Vendor-specific button name support: JoyCon, PS5 Controller

## How to use

- [Full API documentation](https://baku89.github.io/bndr-js/docs/)
