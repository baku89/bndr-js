bndr-js

# bndr-js

## Table of contents

### Classes

- [Bndr](classes/Bndr.md)

### Generators

- [gamepad](classes/gamepad.md)
- [keyboard](classes/keyboard.md)
- [midi](classes/midi.md)
- [pointer](classes/pointer.md)

### Combinators

- [combine](README.md#combine)
- [tuple](README.md#tuple)
- [vec2](README.md#vec2)

### Value Type Indicators

- [type](README.md#type)

## Combinators

### combine

▸ **combine**<`T`\>(`...events`): [`Bndr`](classes/Bndr.md)<`T`\>

Integrates multiple input events of the same type. The input event is triggered when any of the input events is triggered.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `...events` | [`Bndr`](classes/Bndr.md)<`T`\>[] |

#### Returns

[`Bndr`](classes/Bndr.md)<`T`\>

A combined input event.

#### Defined in

[combinator.ts:11](https://github.com/baku89/bndr-js/blob/68b6a63/src/combinator.ts#L11)

___

### tuple

▸ **tuple**<`T0`, `T1`\>(`e0`, `e1`): [`Bndr`](classes/Bndr.md)<[`T0`, `T1`]\>

Creates an input event with tuple type from given inputs.

#### Type parameters

| Name |
| :------ |
| `T0` |
| `T1` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `e0` | [`Bndr`](classes/Bndr.md)<`T0`\> |
| `e1` | [`Bndr`](classes/Bndr.md)<`T1`\> |

#### Returns

[`Bndr`](classes/Bndr.md)<[`T0`, `T1`]\>

An integrated input event with the tuple type of given input events.

#### Defined in

[combinator.ts:34](https://github.com/baku89/bndr-js/blob/68b6a63/src/combinator.ts#L34)

▸ **tuple**<`T0`, `T1`, `T2`\>(`e0`, `e1`, `e2`): [`Bndr`](classes/Bndr.md)<[`T0`, `T1`, `T2`]\>

#### Type parameters

| Name |
| :------ |
| `T0` |
| `T1` |
| `T2` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `e0` | [`Bndr`](classes/Bndr.md)<`T0`\> |
| `e1` | [`Bndr`](classes/Bndr.md)<`T1`\> |
| `e2` | [`Bndr`](classes/Bndr.md)<`T2`\> |

#### Returns

[`Bndr`](classes/Bndr.md)<[`T0`, `T1`, `T2`]\>

#### Defined in

[combinator.ts:35](https://github.com/baku89/bndr-js/blob/68b6a63/src/combinator.ts#L35)

▸ **tuple**<`T0`, `T1`, `T2`, `T3`\>(`e0`, `e1`, `e2`, `e3`): [`Bndr`](classes/Bndr.md)<[`T0`, `T1`, `T2`, `T3`]\>

#### Type parameters

| Name |
| :------ |
| `T0` |
| `T1` |
| `T2` |
| `T3` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `e0` | [`Bndr`](classes/Bndr.md)<`T0`\> |
| `e1` | [`Bndr`](classes/Bndr.md)<`T1`\> |
| `e2` | [`Bndr`](classes/Bndr.md)<`T2`\> |
| `e3` | [`Bndr`](classes/Bndr.md)<`T3`\> |

#### Returns

[`Bndr`](classes/Bndr.md)<[`T0`, `T1`, `T2`, `T3`]\>

#### Defined in

[combinator.ts:40](https://github.com/baku89/bndr-js/blob/68b6a63/src/combinator.ts#L40)

▸ **tuple**<`T0`, `T1`, `T2`, `T3`, `T4`\>(`e0`, `e1`, `e2`, `e3`, `e4`): [`Bndr`](classes/Bndr.md)<[`T0`, `T1`, `T2`, `T3`, `T4`]\>

#### Type parameters

| Name |
| :------ |
| `T0` |
| `T1` |
| `T2` |
| `T3` |
| `T4` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `e0` | [`Bndr`](classes/Bndr.md)<`T0`\> |
| `e1` | [`Bndr`](classes/Bndr.md)<`T1`\> |
| `e2` | [`Bndr`](classes/Bndr.md)<`T2`\> |
| `e3` | [`Bndr`](classes/Bndr.md)<`T3`\> |
| `e4` | [`Bndr`](classes/Bndr.md)<`T4`\> |

#### Returns

[`Bndr`](classes/Bndr.md)<[`T0`, `T1`, `T2`, `T3`, `T4`]\>

#### Defined in

[combinator.ts:46](https://github.com/baku89/bndr-js/blob/68b6a63/src/combinator.ts#L46)

▸ **tuple**<`T0`, `T1`, `T2`, `T3`, `T4`, `T5`\>(`e0`, `e1`, `e2`, `e3`, `e4`, `e5`): [`Bndr`](classes/Bndr.md)<[`T0`, `T1`, `T2`, `T3`, `T4`, `T5`]\>

#### Type parameters

| Name |
| :------ |
| `T0` |
| `T1` |
| `T2` |
| `T3` |
| `T4` |
| `T5` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `e0` | [`Bndr`](classes/Bndr.md)<`T0`\> |
| `e1` | [`Bndr`](classes/Bndr.md)<`T1`\> |
| `e2` | [`Bndr`](classes/Bndr.md)<`T2`\> |
| `e3` | [`Bndr`](classes/Bndr.md)<`T3`\> |
| `e4` | [`Bndr`](classes/Bndr.md)<`T4`\> |
| `e5` | [`Bndr`](classes/Bndr.md)<`T5`\> |

#### Returns

[`Bndr`](classes/Bndr.md)<[`T0`, `T1`, `T2`, `T3`, `T4`, `T5`]\>

#### Defined in

[combinator.ts:53](https://github.com/baku89/bndr-js/blob/68b6a63/src/combinator.ts#L53)

___

### vec2

▸ **vec2**(`xAxis`, `yAxis`): [`Bndr`](classes/Bndr.md)<`Vec2`\>

Creates a 2D numeric input event with given input events for each dimension.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `xAxis` | [`Bndr`](classes/Bndr.md)<`number`\> | A numeric input event for X axis. |
| `yAxis` | [`Bndr`](classes/Bndr.md)<`number`\> | A numeric input event for Y axis. |

#### Returns

[`Bndr`](classes/Bndr.md)<`Vec2`\>

An input event of Vec2.

#### Defined in

[combinator.ts:90](https://github.com/baku89/bndr-js/blob/68b6a63/src/combinator.ts#L90)

## Value Type Indicators

### type

• `Const` **type**: `Object`

Collection of “value types”, which defines algebraic structure such as add, scale, and norm. Some of [Bndr](classes/Bndr.md) instances have a type information so that they can be scaled or lerped without passing function explicily. See [as](classes/Bndr.md#as) and [map](classes/Bndr.md#map) for more details.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `number` | `ValueType`<`number`\> |
| `vec2` | `ValueType`<`Vec2`\> |

#### Defined in

[index.ts:14](https://github.com/baku89/bndr-js/blob/68b6a63/src/index.ts#L14)
