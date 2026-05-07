# ガイド

## インストール

```sh
npm i rxio rxjs
```

`rxjs` は peer dependency なので、別途インストールしてください。

## クイックスタート

```ts
import {Pointer} from 'rxio'

Pointer.position().subscribe(console.log)
```

`Pointer.position()` は `Observable<vec2>` を返し、ポインタが動くたびに値を発行します。あとは通常の RxJS パイプラインとして扱えます。

## モジュール構成

| subpath | 内容 |
|---|---|
| `rxio` | `Keyboard`, `Pointer`, `Gamepad`, `Midi` の名前空間（`rxio/keyboard` 等としても publish しています） |
| `rxio/operators` | `rising`, `falling`, `lerp`, `tween`, `longPress` — 入力特化の pipeable operator を提供します |
| `rxio/combinators` | `merge`, `combineLatest`, `cascade` — グリフを保持する合流オペレータを提供します |

それ以外のオペレータ（`map`, `filter`, `throttleTime`, `scan`, `pairwise` など）は、素の RxJS から直接 import してください。

## コンビネータ

RxIO はユーザー入力ストリームを合流・組み合わせるためのオペレータをいくつか用意しています。`rxio/combinators` から提供しているのは次の 3 つです。

```ts
import {merge, combineLatest, cascade} from 'rxio/combinators'
import {rising} from 'rxio/operators'

// いずれかのソースが発行した値を下流に流す（RxJS の merge と同じ動作）
merge(Keyboard.shortcut('cmd+s'), Gamepad.button('a').pipe(rising()))

// 各ソースの最新値をタプルにまとめて発行する（RxJS の combineLatest と同じ動作）
combineLatest([Pointer.position(), Pointer.pressed()])

// ソースが先頭から順番に真値（held）状態になったら true を発行する
cascade(
  Keyboard.pressed('a'),
  Keyboard.pressed('b'),
  Keyboard.pressed('c'),
)
```

`merge` と `combineLatest` は、同名の RxJS export を置き換える形で動作します。挙動はまったく同じで、加えて入力のグリフを連結して保持します（詳細は次節で扱います）。両方を import した場合は、グリフを保持する版が優先されます。

`cascade` は格闘ゲームのコマンド（↓→↘+パンチ）、Plover 的な順次ジェスチャ、ペダルとキーの組み合わせなど、**順序を持った保持状態の検出** 用に使います。RxJS には対応するオペレータがないので、RxIO が独自に提供しています。

> **注意**: 修飾キー付きキーボードショートカット（`Cmd+S` や `Ctrl+Shift+P` など）には絶対に使わないでください。これらは `Keyboard.shortcut('cmd+shift+p')` を使うのが正解です。専用関数は macOS の Cmd swallow、focus 喪失、プラットフォーム固有のキー正規化を内部で処理しますが、cascade で同等のことを組もうとするとこれらの処理がすべて欠落します。

## 入力をグリフで表示する

ソースが返す `GlyphedObservable<T>` は、`Observable<T>` に `glyph: Glyphs` プロパティを付加した型です。グリフは「iconify 参照」または「素の文字列リテラル」のいずれかであり、`[⌘, "S"]` のようにアイコンと文字を混在させて表現できます。「`Cmd+S` で保存」のようなツールチップや command palette UI で、入力の見た目をそのまま描画したい場合に利用します。

```ts
import {Keyboard} from 'rxio'

const s = Keyboard.shortcut('cmd+s')
s.glyph // → [{type: 'iconify', icon: 'mdi:apple-keyboard-command'}, 'S']
```

グリフは `rxio/combinators` のオペレータを通しても保持されます。

```ts
import {merge} from 'rxio/combinators'
import {rising} from 'rxio/operators'

const save = merge(
  Keyboard.shortcut('cmd+s'),
  Gamepad.button('a').pipe(rising()),
)
save.glyph // → 両者のグリフが ', ' で連結された値が入る
```

一方、素の RxJS operator で `pipe()` を通した時点でグリフは失われ、戻り値は plain な `Observable` に戻ります。

## ソース cheat sheet

```ts
Pointer.position()           // GlyphedObservable<vec2>      ポインタ座標
Pointer.pressed()            // GlyphedObservable<boolean>   ボタンが押されているか
Pointer.down() / .up()       // GlyphedObservable<void>      押下 / リリースで bang
Pointer.scroll()             // GlyphedObservable<vec2>      ホイール量
Pointer.pinch()              // GlyphedObservable<number>    ピンチズーム量

Keyboard.pressed('a')        // GlyphedObservable<boolean>   キーが押されているか
Keyboard.keydown('a')        // GlyphedObservable<void>      keydown のたびに bang
Keyboard.shortcut('cmd+s')   // GlyphedObservable<void>      chord 確定で bang

Gamepad.axis(0)              // GlyphedObservable<vec2>      アナログスティック
Gamepad.button('a')          // GlyphedObservable<boolean>   ボタンが押されているか
Gamepad.connected()          // GlyphedObservable<boolean>   いずれかのパッドが接続済みか

Midi.note(channel, note)     // GlyphedObservable<number>    velocity 0–127
Midi.all()                   // GlyphedObservable<MIDIData>  生イベント
```

全リストは [API リファレンス](./api/) を参照してください。

## フレームベースのスムージング

`rxio/operators` のスムージング系オペレータは、内部で `requestAnimationFrame` ループを回し、上流の emission の合間を補間しながら値を発行します。カーソルトレイルや gamepad 入力のスムージング処理に役立ちます。

```ts
import {lerp, tween, longPress} from 'rxio/operators'
import {vec2} from 'linearly'

// 各新値に向けて 1 フレームあたり 0.1 のレートで近づける
Pointer.position().pipe(lerp(vec2.lerp, 0.1))

// 各 emission を固定時間で tween する
Pointer.position().pipe(tween(vec2.lerp, 200))

// 上流が 500ms 真値を保ち続けたら bang する
Keyboard.pressed('space').pipe(longPress(500))
```

## クロスプラットフォームの修飾キー

`'cmd'`, `'ctrl'`, `'meta'`, およびシンボルの `'⌘'` は、いずれもプラットフォームの主要修飾キー（macOS では Command、それ以外では Control）にエイリアスされます。`Keyboard.shortcut('cmd+s')` と `Keyboard.shortcut('ctrl+s')` は同一マシン上では同じ意味になります。コード上では読みやすい方を選んで構いません。グリフは実行環境の OS に応じて適切にレンダリングされます。

## ベクトルを扱う

RxIO はベクトルや行列をプレーンな 1 次元の数値配列として表現します（`[x, y]` や `[a, b, c, d, tx, ty]` の形）。操作には [Linearly](https://baku89.github.io/linearly) や [gl-matrix](https://glmatrix.net/) を利用してください。

```ts
import {Pointer} from 'rxio'
import {map} from 'rxjs'
import {vec2} from 'linearly'

Pointer.position()
  .pipe(map(p => vec2.scale(p, 0.5)))
  .subscribe(([x, y]) => circle(x, y, 10))
```
