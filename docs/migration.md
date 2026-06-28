# Migrating from 0.x to 1.0

Bndr 1.0 is a ground-up rebuild on top of [RxJS](https://rxjs.dev/). The old custom `Emitter` is gone; every source is now a plain RxJS `Observable`. This unlocks the entire RxJS operator ecosystem, but it means the 0.x API does not carry over directly. This page maps the old API onto the new one.

## At a glance

| 0.x (Emitter-based) | 1.0 (RxJS-based) |
|---|---|
| `Bndr.pointer(el).position()` | `Pointer.position(el)` |
| `emitter.on(cb)` | `observable.subscribe(cb)` |
| `Bndr.createScope(fn)` → disposer | RxJS `Subscription` (`.unsubscribe()`) |
| `emitter.map(f).filter(g)` | `observable.pipe(map(f), filter(g))` |
| `Bndr.combine(a, b)` | `merge(a, b)` from `bndr-js/combinators` |
| `keyboard.hotkey('cmd+s')` | `Keyboard.shortcut('cmd+s')` |
| `emitter.icon` / `IconSequence` | `observable.glyph` / `Glyphs` |

## Install

`rxjs` is now a peer dependency — install it alongside Bndr.

```sh
npm i bndr-js@^1 rxjs
```

## Namespaces instead of device objects

0.x exposed factory functions that returned stateful device objects you called methods on. 1.0 exposes a namespace per device, and each member is a free function taking the target as its first argument.

```ts
// 0.x
import * as Bndr from 'bndr-js'
const pointer = Bndr.pointer(el)
pointer.position({coordinate: 'offset'})
pointer.left.pressed({pointerCapture: true})

// 1.0
import {Pointer} from 'bndr-js'
Pointer.position(el, {coordinate: 'offset'})
Pointer.pressed(el, {button: 'left', pointerCapture: true})
```

The button-scoped sub-objects (`pointer.left`, `pointer.middle`, `pointer.right`) are replaced by a `button` option on `Pointer.pressed` / `Pointer.drag`.

## Subscribing and disposal

`.on()` becomes `.subscribe()`, which returns an RxJS `Subscription`. There is no global scope/`createScope` anymore — track subscriptions yourself and unsubscribe when you're done.

```ts
// 0.x
const dispose = Bndr.createScope(() => {
  Bndr.pointer(el).position().on(onMove)
})
// later: dispose()

// 1.0
import {Subscription} from 'rxjs'
const scope = new Subscription()
scope.add(Pointer.position(el).subscribe(onMove))
// later: scope.unsubscribe()
```

## Operators: chaining → `pipe`

Most of the old `Emitter` methods map onto standard RxJS operators. Import them from `rxjs`.

| 0.x method | 1.0 equivalent |
|---|---|
| `.map(f)` | `map(f)` |
| `.filter(g)` | `filter(g)` |
| `.constant(v)` | `map(() => v)` |
| `.not()` | `map(v => !v)` |
| `.change()` | `distinctUntilChanged()` |
| `.delta(f)` | `pairwise()` + `map(([a, b]) => f(a, b))` |
| `.fold(f, init)` | `scan(f, init)` |
| `.throttle(ms)` | `throttleTime(ms)` |
| `.debounce(ms)` | `debounceTime(ms)` |
| `.delay(ms)` | `delay(ms)` |
| `.trail(n)` | `bufferCount(n, 1)` |
| `.log()` | `tap(console.log)` |
| `.down()` | `rising()` from `bndr-js/operators` |
| `.up()` | `falling()` from `bndr-js/operators` |
| `.lerp(...)` | `lerp(...)` from `bndr-js/operators` |
| `.tween(...)` | `tween(...)` from `bndr-js/operators` |
| `.longPress(ms)` | `longPress(ms)` from `bndr-js/operators` |

Only the input-specific operators (`rising`, `falling`, `lerp`, `tween`, `longPress`) live in `bndr-js/operators`. Everything else is plain RxJS.

```ts
// 0.x
Bndr.gamepad().button('a').down().on(jump)

// 1.0
import {rising} from 'bndr-js/operators'
Gamepad.button('a').pipe(rising()).subscribe(jump)
```

## Combinators

| 0.x | 1.0 (from `bndr-js/combinators`) |
|---|---|
| `Bndr.combine(a, b)` | `merge(a, b)` |
| `Bndr.tuple(a, b)` | `combineLatest([a, b])` |
| `Bndr.cascade(a, b)` | `cascade(a, b)` |
| `Bndr.and(a, b)` | `combineLatest([a, b]).pipe(map(xs => xs.every(Boolean)))` |
| `Bndr.or(a, b)` | `combineLatest([a, b]).pipe(map(xs => xs.some(Boolean)))` |

`merge` / `combineLatest` from `bndr-js/combinators` are glyph-preserving drop-ins for the same-named RxJS exports. `and` / `or` were dropped — compose them from `combineLatest` as above.

## Two patterns without a direct operator

A couple of old methods have no one-to-one RxJS operator. Express them inline:

### `.while(gate)` → gate with `withLatestFrom`

```ts
// 0.x: pass scroll through only while alt is NOT pressed
scroll.map(vec2.negate).while(altPressed.not(), false)

// 1.0
import {filter, map, startWith, withLatestFrom} from 'rxjs'

// `Keyboard.pressed` only fires on key events, so seed `false`.
const altPressed = Keyboard.pressed('option').pipe(startWith(false))

scroll.pipe(
  map(vec2.negate),
  withLatestFrom(altPressed),
  filter(([, alt]) => !alt),
  map(([v]) => v)
)
```

### `.stash(trigger)` → sample-and-hold with `BehaviorSubject`

```ts
// 0.x: capture the latest position whenever a trigger fires; read .value
const origin = position.stash(trigger)
origin.value

// 1.0
import {BehaviorSubject, withLatestFrom} from 'rxjs'
import {vec2} from 'linearly'

const origin = new BehaviorSubject(vec2.zero)
trigger.pipe(withLatestFrom(position)).subscribe(([, p]) => origin.next(p))
origin.value
```

## Keyboard

- `keyboard.hotkey(combo)` is renamed to `Keyboard.shortcut(combo)`.
- The `capture` option was removed. Bndr now listens on `window` in the **bubble** phase.
- Keyboard sources ignore events whose `defaultPrevented` is already set. A modal (or any closer/earlier handler) can claim a key by calling `preventDefault()` in the capture phase, and Bndr will yield it:

```ts
modalEl.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault()  // Bndr's shortcut('enter') will not fire
    confirm()
  }
}, {capture: true})
```

- Events targeting an `<input>` are skipped, as before.

## Icons → glyphs

The visual metadata attached to a source was called an `icon` (`IconSequence`). It is now a `glyph` (`Glyphs`), exposed as a property on the `GlyphedObservable` a source returns.

```ts
// 0.x
const bind = keyboard.hotkey('cmd+s')
bind.icon // IconSequence

// 1.0
const bind = Keyboard.shortcut('cmd+s')
bind.glyph // Glyphs
```

The shape is unchanged: a `Glyphs` is an array of either iconify references (`{type: 'iconify', icon: string}`) or plain text literals. The glyph is dropped the moment you `pipe()` through an arbitrary RxJS operator — but it survives the `bndr-js/combinators` (`merge`, `combineLatest`, `cascade`) and the edge operators (`rising`, `falling`), which describe the same input as their source.
