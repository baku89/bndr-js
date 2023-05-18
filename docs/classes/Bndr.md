[bndr-js](../README.md) / Bndr

# Class: Bndr<T\>

A foundational value of the library, an instance representing a single *input event*. This could be user input from a mouse, keyboard, MIDI controller, gamepad etc., or the result of filtering or composing these inputs. Various operations can be attached by method chaining.

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `any` |

## Hierarchy

- **`Bndr`**

  ↳ [`keyboard`](keyboard.md)

  ↳ [`midi`](midi.md)

  ↳ [`gamepad`](gamepad.md)

## Table of contents

### Filters

- [as](Bndr.md#as)
- [map](Bndr.md#map)

### Event Handlers

- [on](Bndr.md#on)
- [off](Bndr.md#off)
- [emit](Bndr.md#emit)
- [once](Bndr.md#once)
- [removeAllListeners](Bndr.md#removealllisteners)

### Properties

- [value](Bndr.md#value)
- [defaultValue](Bndr.md#defaultvalue)
- [emittedValue](Bndr.md#emittedvalue)
- [type](Bndr.md#type)

### Utilities

- [log](Bndr.md#log)

### Constructors

- [constructor](Bndr.md#constructor)

### Methods

- [filter](Bndr.md#filter)
- [scale](Bndr.md#scale)
- [velocity](Bndr.md#velocity)
- [norm](Bndr.md#norm)
- [down](Bndr.md#down)
- [up](Bndr.md#up)
- [constant](Bndr.md#constant)
- [throttle](Bndr.md#throttle)
- [debounce](Bndr.md#debounce)
- [delay](Bndr.md#delay)
- [lerp](Bndr.md#lerp)
- [state](Bndr.md#state)
- [fold](Bndr.md#fold)
- [delta](Bndr.md#delta)
- [interval](Bndr.md#interval)
- [trail](Bndr.md#trail)
- [accumlate](Bndr.md#accumlate)

## Filters

### as

▸ **as**(`type`): [`Bndr`](Bndr.md)<`T`\>

Returnes a new instance with the value type annotation

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `ValueType`<`T`\> |

#### Returns

[`Bndr`](Bndr.md)<`T`\>

#### Defined in

[Bndr.ts:138](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L138)

___

### map

▸ **map**<`U`\>(`fn`, `type?`): [`Bndr`](Bndr.md)<`U`\>

Transforms the payload of event with the given function.

#### Type parameters

| Name |
| :------ |
| `U` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`value`: `T`) => `U` |
| `type?` | `ValueType`<`U`\> |

#### Returns

[`Bndr`](Bndr.md)<`U`\>

A new input event

#### Defined in

[Bndr.ts:155](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L155)

## Event Handlers

### on

▸ **on**(`listener`): `void`

Adds the `listener` function for the event

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `listener` | `Listener`<`T`\> | The callback function |

#### Returns

`void`

#### Defined in

[Bndr.ts:86](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L86)

___

### off

▸ **off**(`listener`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `listener` | `Listener`<`T`\> |

#### Returns

`void`

#### Defined in

[Bndr.ts:95](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L95)

___

### emit

▸ **emit**(`value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `T` |

#### Returns

`void`

#### Defined in

[Bndr.ts:104](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L104)

___

### once

▸ **once**(`listener`): `void`

Adds a *one-time* `listener` function for the event

#### Parameters

| Name | Type |
| :------ | :------ |
| `listener` | `Listener`<`T`\> |

#### Returns

`void`

#### Defined in

[Bndr.ts:116](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L116)

___

### removeAllListeners

▸ **removeAllListeners**(): `void`

Removes all listeners.

#### Returns

`void`

#### Defined in

[Bndr.ts:128](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L128)

## Properties

### value

• `get` **value**(): `T`

The latest value emitted from the event. If the event has never fired before, it fallbacks to [defaultValue](Bndr.md#defaultvalue).

#### Returns

`T`

#### Defined in

[Bndr.ts:58](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L58)

___

### defaultValue

• `Readonly` **defaultValue**: `T`

The default value of the event.

#### Defined in

[Bndr.ts:66](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L66)

___

### emittedValue

• `get` **emittedValue**(): `Maybe`<`T`\>

The latest value emitted from the event. If the event has never fired before, it just returns `None`.

#### Returns

`Maybe`<`T`\>

#### Defined in

[Bndr.ts:72](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L72)

___

### type

• `Optional` `Readonly` **type**: `ValueType`<`T`\>

The value type of the current event. Use [as](Bndr.md#as) to manually indicate other value type.

#### Defined in

[Bndr.ts:79](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L79)

## Utilities

### log

▸ **log**(`message?`): [`Bndr`](Bndr.md)<`T`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `message` | `string` | `'Bndr'` |

#### Returns

[`Bndr`](Bndr.md)<`T`\>

#### Defined in

[Bndr.ts:540](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L540)

## Constructors

### constructor

• **new Bndr**<`T`\>(`options`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `any` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `BndrOptions`<`T`\> |

#### Defined in

[Bndr.ts:37](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L37)

## Methods

### filter

▸ **filter**(`fn`): [`Bndr`](Bndr.md)<`T`\>

Filters events with the given predicate function

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`value`: `T`) => `any` | Return truthy value to pass events |

#### Returns

[`Bndr`](Bndr.md)<`T`\>

#### Defined in

[Bndr.ts:172](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L172)

___

### scale

▸ **scale**(`factor`): [`Bndr`](Bndr.md)<`T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `factor` | `number` |

#### Returns

[`Bndr`](Bndr.md)<`T`\>

#### Defined in

[Bndr.ts:186](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L186)

___

### velocity

▸ **velocity**(): [`Bndr`](Bndr.md)<`T`\>

Creates an event that fires the velocity of current events.

#### Returns

[`Bndr`](Bndr.md)<`T`\>

#### Defined in

[Bndr.ts:198](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L198)

___

### norm

▸ **norm**(): [`Bndr`](Bndr.md)<`number`\>

Creates an event that fires the norm of current events.

#### Returns

[`Bndr`](Bndr.md)<`number`\>

#### Defined in

[Bndr.ts:225](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L225)

___

### down

▸ **down**(): [`Bndr`](Bndr.md)<``true``\>

Create an event that emits the moment the current value changes from falsy to truthy.

#### Returns

[`Bndr`](Bndr.md)<``true``\>

#### Defined in

[Bndr.ts:237](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L237)

___

### up

▸ **up**(): [`Bndr`](Bndr.md)<``true``\>

Create an event that emits the moment the current value changes from falsy to truthy.

#### Returns

[`Bndr`](Bndr.md)<``true``\>

#### Defined in

[Bndr.ts:246](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L246)

___

### constant

▸ **constant**<`U`\>(`value`, `type?`): [`Bndr`](Bndr.md)<`U`\>

Create an event that emits a constant value every time the current event is emitted.

**`See`**

[https://lodash.com/docs/4.17.15#throttle](https://lodash.com/docs/4.17.15#throttle)

#### Type parameters

| Name |
| :------ |
| `U` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `U` |
| `type?` | `ValueType`<`U`\> |

#### Returns

[`Bndr`](Bndr.md)<`U`\>

#### Defined in

[Bndr.ts:256](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L256)

___

### throttle

▸ **throttle**(`wait`, `options?`): [`Bndr`](Bndr.md)<`T`\>

Creates debounced version of the current event.

**`See`**

[https://lodash.com/docs/4.17.15#debounced](https://lodash.com/docs/4.17.15#debounced)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `wait` | `number` | Milliseconds to wait. |
| `options?` | `ThrottleSettings` |  |

#### Returns

[`Bndr`](Bndr.md)<`T`\>

#### Defined in

[Bndr.ts:286](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L286)

___

### debounce

▸ **debounce**(`wait`, `options`): [`Bndr`](Bndr.md)<`T`\>

Creates debounced version of the current event.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `wait` | `number` | Milliseconds to wait. |
| `options` | `DebounceSettings` |  |

#### Returns

[`Bndr`](Bndr.md)<`T`\>

A new input event

#### Defined in

[Bndr.ts:303](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L303)

___

### delay

▸ **delay**(`wait`): [`Bndr`](Bndr.md)<`T`\>

Creates delayed version of the current event.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `wait` | `number` | Milliseconds to wait. |

#### Returns

[`Bndr`](Bndr.md)<`T`\>

A new input event

#### Defined in

[Bndr.ts:320](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L320)

___

### lerp

▸ **lerp**(`t`, `threshold?`): [`Bndr`](Bndr.md)<`T`\>

Smoothen the change rate of the input value.

**`Mix`**

An optional linear interpolation function. `this.mix` is used by default.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `t` | `number` | `undefined` | The ratio of linear interpolation from the current value to the target value with each update. |
| `threshold` | `number` | `1e-4` | - |

#### Returns

[`Bndr`](Bndr.md)<`T`\>

A new input event

#### Defined in

[Bndr.ts:337](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L337)

___

### state

▸ **state**<`U`, `S`\>(`update`, `initialState`): [`Bndr`](Bndr.md)<`U`\>

Returns an input event with _state_. Used for realizing things like counters and toggles.

#### Type parameters

| Name |
| :------ |
| `U` |
| `S` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `update` | (`value`: `T`, `state`: `S`) => [`U`, `S`] | A update function, which takes the current value and a value representing the internal state as arguments, and returns a tuple of the updated value and the new state. |
| `initialState` | `S` | A initial value of the internal state. |

#### Returns

[`Bndr`](Bndr.md)<`U`\>

A new input event

#### Defined in

[Bndr.ts:386](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L386)

___

### fold

▸ **fold**<`U`\>(`fn`, `initial`): [`Bndr`](Bndr.md)<`U`\>

#### Type parameters

| Name |
| :------ |
| `U` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`prev`: `U`, `value`: `T`) => `U` |  |
| `initial` | `U` | A initial value |

#### Returns

[`Bndr`](Bndr.md)<`U`\>

#### Defined in

[Bndr.ts:412](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L412)

___

### delta

▸ **delta**<`U`\>(`fn`, `initial`, `type?`): [`Bndr`](Bndr.md)<`U`\>

Create an event that fires the 'difference value' between the value when the last event was triggered and the current value.

#### Type parameters

| Name |
| :------ |
| `U` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`prev`: `T` \| `U`, `curt`: `T`) => `U` | A function to calculate the difference |
| `initial` | `U` |  |
| `type?` | `ValueType`<`U`\> |  |

#### Returns

[`Bndr`](Bndr.md)<`U`\>

#### Defined in

[Bndr.ts:435](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L435)

___

### interval

▸ **interval**(`ms?`): [`Bndr`](Bndr.md)<`T`\>

Creates an event that keeps to emit the last value of the current event at specified interval.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `ms` | `number` | `0` | The interval in milliseconds. Set `0` to use `requestAnimationFrame`. |

#### Returns

[`Bndr`](Bndr.md)<`T`\>

#### Defined in

[Bndr.ts:462](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L462)

___

### trail

▸ **trail**(`count?`, `emitAtCount?`): [`Bndr`](Bndr.md)<`T`[]\>

Emits an array caching a specified number of values that were fired in the past.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `count` | `number` | `2` | The number of cache frames. Set `0` to store caches infinitely. |
| `emitAtCount` | `boolean` | `true` | When set to `true`, the new event will not be fired until the trail cache reaches to the number of `count`. |

#### Returns

[`Bndr`](Bndr.md)<`T`[]\>

#### Defined in

[Bndr.ts:488](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L488)

___

### accumlate

▸ **accumlate**(`update?`, `initial?`): [`Bndr`](Bndr.md)<`T`\>

Continually accumulate the fired values using the given 'addition' function.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `update` | `undefined` \| ``null`` \| `Magma`<`T`\> | `null` | If nullish value is given, it fallbacks to `this.type.add`. |
| `initial` | `T` | `undefined` | Used `this.defaultValue` as a default if it's not specified. |

#### Returns

[`Bndr`](Bndr.md)<`T`\>

#### Defined in

[Bndr.ts:509](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L509)
