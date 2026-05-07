---
home: true
---

<div class="badges">
	<p>
		<a href="https://www.npmjs.org/package/rxio">
			<img src="https://img.shields.io/npm/v/rxio.svg?style=flat-square" alt="npm version">
		</a>
		&nbsp;
		<a href="http://spdx.org/licenses/MIT">
			<img src="https://img.shields.io/npm/l/rxio.svg?style=flat-square" alt="npm license">
		</a>
	</p>
</div>

**RxIO** is an [RxJS](https://rxjs.dev/)-based library for composing user-input streams from devices such as mice🖱️, styluses🖊️, touch inputs👆, keyboards⌨️, [MIDI](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) controllers🎹, and [gamepads](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API)🎮. It provides device sources as plain RxJS Observables, plus a few input-specific operators and combinators that the standard RxJS library doesn't cover. Developed and maintained by [Baku Hashimoto](https://baku89.com).

Potential use cases:

- ⚡️ Associating user inputs with arbitrary triggers for VJing
- 🎨 Introducing manual operations in generative art

To get a feel for how it works, please try out [this demo](https://baku89.github.io/bndr-js/).

## Supported devices

- 👆 Pointer (mouse, stylus, touch) — all `PointerEvent` parameters (pressure, tilt, multi-touch)
- ⌨️ Keyboard
- 🎹 MIDI — CC and velocity
- 🎮 Gamepad — vendor-specific button names (JoyCon, PS5, Xbox)

## How to use

- [Full API documentation](https://baku89.github.io/bndr-js/docs/)
