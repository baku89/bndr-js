# 0.x から 1.0 への移行

Bndr 1.0 は [RxJS](https://rxjs.dev/) を基盤に作り直したバージョンです。独自の `Emitter` は廃止され、すべてのソースは素の RxJS `Observable` になりました。これにより RxJS の全オペレータが使える反面、0.x の API はそのままでは動きません。このページで旧 API と新 API の対応を示します。

## 一覧

| 0.x（Emitter ベース） | 1.0（RxJS ベース） |
|---|---|
| `Bndr.pointer(el).position()` | `Pointer.position(el)` |
| `emitter.on(cb)` | `observable.subscribe(cb)` |
| `Bndr.createScope(fn)` → disposer | RxJS `Subscription`（`.unsubscribe()`） |
| `emitter.map(f).filter(g)` | `observable.pipe(map(f), filter(g))` |
| `Bndr.combine(a, b)` | `bndr-js/combinators` の `merge(a, b)` |
| `keyboard.hotkey('cmd+s')` | `Keyboard.shortcut('cmd+s')` |
| `emitter.icon` / `IconSequence` | `observable.glyph` / `Glyphs` |

## インストール

`rxjs` は peer dependency になりました。Bndr と一緒にインストールしてください。

```sh
npm i bndr-js@^1 rxjs
```

## デバイスオブジェクト → 名前空間

0.x はファクトリ関数がステートフルなデバイスオブジェクトを返し、そのメソッドを呼ぶ形でした。1.0 はデバイスごとの名前空間を公開し、各メンバーは対象を第一引数に取る関数です。

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

ボタン別のサブオブジェクト（`pointer.left`, `pointer.middle`, `pointer.right`）は、`Pointer.pressed` / `Pointer.drag` の `button` オプションに置き換わりました。

## 購読と破棄

`.on()` は `.subscribe()` になり、RxJS の `Subscription` を返します。グローバルな scope / `createScope` は廃止されたので、購読は自分で管理して、不要になったら `unsubscribe` してください。

```ts
// 0.x
const dispose = Bndr.createScope(() => {
  Bndr.pointer(el).position().on(onMove)
})
// 後で: dispose()

// 1.0
import {Subscription} from 'rxjs'
const scope = new Subscription()
scope.add(Pointer.position(el).subscribe(onMove))
// 後で: scope.unsubscribe()
```

## オペレータ: メソッドチェーン → `pipe`

旧 `Emitter` のメソッドの多くは標準 RxJS オペレータに対応します。`rxjs` から import してください。

| 0.x メソッド | 1.0 の対応 |
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
| `.down()` | `bndr-js/operators` の `rising()` |
| `.up()` | `bndr-js/operators` の `falling()` |
| `.lerp(...)` | `bndr-js/operators` の `lerp(...)` |
| `.tween(...)` | `bndr-js/operators` の `tween(...)` |
| `.longPress(ms)` | `bndr-js/operators` の `longPress(ms)` |

入力特化のオペレータ（`rising`, `falling`, `lerp`, `tween`, `longPress`）だけが `bndr-js/operators` にあります。それ以外は素の RxJS です。

```ts
// 0.x
Bndr.gamepad().button('a').down().on(jump)

// 1.0
import {rising} from 'bndr-js/operators'
Gamepad.button('a').pipe(rising()).subscribe(jump)
```

## コンビネータ

| 0.x | 1.0（`bndr-js/combinators` から） |
|---|---|
| `Bndr.combine(a, b)` | `merge(a, b)` |
| `Bndr.tuple(a, b)` | `combineLatest([a, b])` |
| `Bndr.cascade(a, b)` | `cascade(a, b)` |
| `Bndr.and(a, b)` | `combineLatest([a, b]).pipe(map(xs => xs.every(Boolean)))` |
| `Bndr.or(a, b)` | `combineLatest([a, b]).pipe(map(xs => xs.some(Boolean)))` |

`bndr-js/combinators` の `merge` / `combineLatest` は、同名の RxJS エクスポートをグリフ保持つきで置き換えるドロップイン版です。`and` / `or` は廃止したので、上記のように `combineLatest` から合成してください。

## 直接の対応がない 2 つのパターン

いくつかの旧メソッドは 1 対 1 の RxJS オペレータがありません。インラインで表現します。

### `.while(gate)` → `withLatestFrom` でゲート

```ts
// 0.x: alt を押していない間だけ scroll を通す
scroll.map(vec2.negate).while(altPressed.not(), false)

// 1.0
import {filter, map, startWith, withLatestFrom} from 'rxjs'

// `Keyboard.pressed` はキーイベント時しか発行しないので `false` で seed する
const altPressed = Keyboard.pressed('option').pipe(startWith(false))

scroll.pipe(
  map(vec2.negate),
  withLatestFrom(altPressed),
  filter(([, alt]) => !alt),
  map(([v]) => v)
)
```

### `.stash(trigger)` → `BehaviorSubject` でサンプル＆ホールド

```ts
// 0.x: trigger 発火時に最新の position を捕捉し、.value で読む
const origin = position.stash(trigger)
origin.value

// 1.0
import {BehaviorSubject, withLatestFrom} from 'rxjs'
import {vec2} from 'linearly'

const origin = new BehaviorSubject(vec2.zero)
trigger.pipe(withLatestFrom(position)).subscribe(([, p]) => origin.next(p))
origin.value
```

## キーボード

- `keyboard.hotkey(combo)` は `Keyboard.shortcut(combo)` に改名されました。
- `capture` オプションは廃止しました。Bndr は `window` の **bubble** phase で購読します。
- キーボードソースは、すでに `defaultPrevented` が立っているイベントを無視します。モーダル（やより近く・より早いハンドラ）が capture phase で `preventDefault()` を呼べば、そのキーは Bndr に拾われません。

```ts
modalEl.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault()  // Bndr の shortcut('enter') は発火しない
    confirm()
  }
}, {capture: true})
```

- `<input>` を対象としたイベントは従来どおりスキップします。

## アイコン → グリフ

ソースに付く視覚メタデータは旧称 `icon`（`IconSequence`）でした。これは `glyph`（`Glyphs`）になり、ソースが返す `GlyphedObservable` のプロパティとして公開されます。

```ts
// 0.x
const bind = keyboard.hotkey('cmd+s')
bind.icon // IconSequence

// 1.0
const bind = Keyboard.shortcut('cmd+s')
bind.glyph // Glyphs
```

形は変わりません。`Glyphs` は iconify 参照（`{type: 'iconify', icon: string}`）かテキストリテラルの配列です。グリフは任意の RxJS オペレータを `pipe()` した時点で落ちますが、`bndr-js/combinators`（`merge`, `combineLatest`, `cascade`）と edge オペレータ（`rising`, `falling`）は、ソースと同じ入力を指すためグリフを保持します。
