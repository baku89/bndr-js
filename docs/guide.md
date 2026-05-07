# Guide

## Install

```sh
npm i rxio rxjs
```

`rxjs` is a peer dependency.

## Quickstart

```ts
import {Pointer} from 'rxio'

Pointer.position().subscribe(console.log)
```

`Pointer.position()` returns an `Observable<vec2>` that fires whenever the pointer moves. Everything downstream is a plain RxJS pipeline.

## Module layout

| subpath | exports |
|---|---|
| `rxio` | `Keyboard`, `Pointer`, `Gamepad`, `Midi` namespaces (also published as `rxio/keyboard` etc.) |
| `rxio/operators` | `rising`, `falling`, `lerp`, `tween`, `longPress` — input-specific pipeable operators |
| `rxio/combinators` | `merge`, `combineLatest`, `cascade` — glyph-aware combinators |

`merge` / `combineLatest` are drop-in replacements for the same-named RxJS exports. They behave identically except they preserve the glyph metadata of their inputs (see below). When both are imported, the glyph-aware versions win.

Everything else (`map`, `filter`, `throttleTime`, `scan`, `pairwise`, …) is a plain RxJS import.

## Displaying inputs as glyphs

Sources return a `GlyphedObservable<T>` — an `Observable<T>` with a `glyph: Glyphs` property describing the input visually. Each glyph is either an iconify reference or a plain text literal, so a sequence like `[⌘, "S"]` can mix iconography with letter characters. This is what you render in a "press cmd+S to save" tooltip or command palette.

```ts
import {Keyboard} from 'rxio'

const s = Keyboard.shortcut('cmd+s')
s.glyph // → [{type: 'iconify', icon: 'mdi:apple-keyboard-command'}, 'S']
```

The glyph survives through `rxio/combinators`:

```ts
import {merge} from 'rxio/combinators'
import {rising} from 'rxio/operators'

const save = merge(
  Keyboard.shortcut('cmd+s'),
  Gamepad.button('a').pipe(rising()),
)
save.glyph // → both glyphs joined with ', '
```

It's dropped the moment you `pipe()` through any plain RxJS operator (the result is a plain `Observable`).

## Combinators

```ts
import {merge, combineLatest, cascade} from 'rxio/combinators'

// Either source fires.
merge(Keyboard.shortcut('cmd+s'), Gamepad.button('a').pipe(rising()))

// Latest of each, packed as a tuple.
combineLatest([Pointer.position(), Pointer.pressed()])

// Held-state chord: A held, then B held, then C held — in order.
cascade(
  Keyboard.pressed('a'),
  Keyboard.pressed('b'),
  Keyboard.pressed('c'),
)
```

`cascade` is for **ordered held-state combos** — fighting-game inputs, Plover-style sequential gestures, sequenced pedal+key combinations. It is **not** for keyboard shortcuts that involve modifier keys. Use `Keyboard.shortcut('cmd+shift+p')` for those: the dedicated path handles macOS Cmd swallowing, focus loss, and platform-specific key normalization, none of which a DIY cascade can replicate.

## Sources cheat sheet

```ts
Pointer.position()           // GlyphedObservable<vec2>      pointer x/y
Pointer.pressed()            // GlyphedObservable<boolean>   button is held
Pointer.down() / .up()       // GlyphedObservable<void>      bang on press / release
Pointer.scroll()             // GlyphedObservable<vec2>      wheel delta
Pointer.pinch()              // GlyphedObservable<number>    pinch zoom delta

Keyboard.pressed('a')        // GlyphedObservable<boolean>   held
Keyboard.keydown('a')        // GlyphedObservable<void>      bang per keydown
Keyboard.shortcut('cmd+s')   // GlyphedObservable<void>      bang on chord

Gamepad.axis(0)              // GlyphedObservable<vec2>      analog stick
Gamepad.button('a')          // GlyphedObservable<boolean>   button held
Gamepad.connected()          // GlyphedObservable<boolean>   any pad connected

Midi.note(channel, note)     // GlyphedObservable<number>    velocity 0–127
Midi.all()                   // GlyphedObservable<MIDIData>  raw events
```

Full list in the [API reference](./api/).

## Frame-based smoothing

The smoothing operators in `rxio/operators` drive an internal `requestAnimationFrame` loop, emitting interpolated values between upstream emissions — useful for cursor trails and smoothed gamepad input.

```ts
import {lerp, tween, longPress} from 'rxio/operators'
import {vec2} from 'linearly'

// Ease toward each new value at rate 0.1 per frame.
Pointer.position().pipe(lerp(vec2.lerp, 0.1))

// Tween over a fixed duration on each emission.
Pointer.position().pipe(tween(vec2.lerp, 200))

// Bang once the upstream has stayed truthy for 500ms.
Keyboard.pressed('space').pipe(longPress(500))
```

## Cross-platform modifier keys

`'cmd'`, `'ctrl'`, `'meta'`, and the symbol `'⌘'` all alias to the platform's primary modifier — Command on macOS, Control elsewhere. `Keyboard.shortcut('cmd+s')` and `Keyboard.shortcut('ctrl+s')` mean the same thing on a given machine. Use whichever reads better; the glyph renders appropriately for the user's OS.

## Working with vectors

RxIO represents vectors and matrices as plain 1D arrays of numbers (`[x, y]`, `[a, b, c, d, tx, ty]`). Manipulate them with [Linearly](https://baku89.github.io/linearly) or [gl-matrix](https://glmatrix.net/).

```ts
import {Pointer} from 'rxio'
import {map} from 'rxjs'
import {vec2} from 'linearly'

Pointer.position()
  .pipe(map(p => vec2.scale(p, 0.5)))
  .subscribe(([x, y]) => circle(x, y, 10))
```
