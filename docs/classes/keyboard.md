[bndr-js](../README.md) / keyboard

# Class: keyboard

## Hierarchy

- [`Bndr`](Bndr.md)<`string`\>

  ↳ **`keyboard`**

## Table of contents

### Generators

- [key](keyboard.md#key)

### Filters

- [as](keyboard.md#as)
- [map](keyboard.md#map)

### Event Handlers

- [on](keyboard.md#on)
- [off](keyboard.md#off)
- [emit](keyboard.md#emit)
- [once](keyboard.md#once)
- [removeAllListeners](keyboard.md#removealllisteners)

### Properties

- [value](keyboard.md#value)
- [defaultValue](keyboard.md#defaultvalue)
- [emittedValue](keyboard.md#emittedvalue)
- [type](keyboard.md#type)

### Utilities

- [log](keyboard.md#log)

### Constructors

- [constructor](keyboard.md#constructor)

### Methods

- [filter](keyboard.md#filter)
- [scale](keyboard.md#scale)
- [velocity](keyboard.md#velocity)
- [norm](keyboard.md#norm)
- [down](keyboard.md#down)
- [up](keyboard.md#up)
- [constant](keyboard.md#constant)
- [throttle](keyboard.md#throttle)
- [debounce](keyboard.md#debounce)
- [delay](keyboard.md#delay)
- [lerp](keyboard.md#lerp)
- [state](keyboard.md#state)
- [fold](keyboard.md#fold)
- [delta](keyboard.md#delta)
- [interval](keyboard.md#interval)
- [trail](keyboard.md#trail)
- [accumlate](keyboard.md#accumlate)

## Generators

### key

▸ **key**(`key`, `options?`): [`Bndr`](Bndr.md)<`boolean`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `options` | `boolean` \| `BndrGeneratorOptions` |

#### Returns

[`Bndr`](Bndr.md)<`boolean`\>

#### Defined in

[generator/keyboard.ts:25](https://github.com/baku89/bndr-js/blob/68b6a63/src/generator/keyboard.ts#L25)

## Filters

### as

▸ **as**(`type`): [`Bndr`](Bndr.md)<`string`\>

Returnes a new instance with the value type annotation

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `ValueType`<`string`\> |

#### Returns

[`Bndr`](Bndr.md)<`string`\>

#### Inherited from

[Bndr](Bndr.md).[as](Bndr.md#as)

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
| `fn` | (`value`: `string`) => `U` |
| `type?` | `ValueType`<`U`\> |

#### Returns

[`Bndr`](Bndr.md)<`U`\>

A new input event

#### Inherited from

[Bndr](Bndr.md).[map](Bndr.md#map)

#### Defined in

[Bndr.ts:155](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L155)

## Event Handlers

### on

▸ **on**(`listener`): `void`

Adds the `listener` function for the event

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `listener` | `Listener`<`string`\> | The callback function |

#### Returns

`void`

#### Inherited from

[Bndr](Bndr.md).[on](Bndr.md#on)

#### Defined in

[Bndr.ts:86](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L86)

___

### off

▸ **off**(`listener`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `listener` | `Listener`<`string`\> |

#### Returns

`void`

#### Inherited from

[Bndr](Bndr.md).[off](Bndr.md#off)

#### Defined in

[Bndr.ts:95](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L95)

___

### emit

▸ **emit**(`value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` |

#### Returns

`void`

#### Inherited from

[Bndr](Bndr.md).[emit](Bndr.md#emit)

#### Defined in

[Bndr.ts:104](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L104)

___

### once

▸ **once**(`listener`): `void`

Adds a *one-time* `listener` function for the event

#### Parameters

| Name | Type |
| :------ | :------ |
| `listener` | `Listener`<`string`\> |

#### Returns

`void`

#### Inherited from

[Bndr](Bndr.md).[once](Bndr.md#once)

#### Defined in

[Bndr.ts:116](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L116)

___

### removeAllListeners

▸ **removeAllListeners**(): `void`

Removes all listeners.

#### Returns

`void`

#### Inherited from

[Bndr](Bndr.md).[removeAllListeners](Bndr.md#removealllisteners)

#### Defined in

[Bndr.ts:128](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L128)

## Properties

### value

• `get` **value**(): `T`

The latest value emitted from the event. If the event has never fired before, it fallbacks to [defaultValue](Bndr.md#defaultvalue).

#### Returns

`T`

#### Inherited from

Bndr.value

#### Defined in

[Bndr.ts:58](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L58)

___

### defaultValue

• `Readonly` **defaultValue**: `string`

The default value of the event.

#### Inherited from

[Bndr](Bndr.md).[defaultValue](Bndr.md#defaultvalue)

#### Defined in

[Bndr.ts:66](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L66)

___

### emittedValue

• `get` **emittedValue**(): `Maybe`<`T`\>

The latest value emitted from the event. If the event has never fired before, it just returns `None`.

#### Returns

`Maybe`<`T`\>

#### Inherited from

Bndr.emittedValue

#### Defined in

[Bndr.ts:72](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L72)

___

### type

• `Optional` `Readonly` **type**: `ValueType`<`string`\>

The value type of the current event. Use [as](Bndr.md#as) to manually indicate other value type.

#### Inherited from

[Bndr](Bndr.md).[type](Bndr.md#type)

#### Defined in

[Bndr.ts:79](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L79)

## Utilities

### log

▸ **log**(`message?`): [`keyboard`](keyboard.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `message` | `string` | `'Bndr'` |

#### Returns

[`keyboard`](keyboard.md)

#### Inherited from

[Bndr](Bndr.md).[log](Bndr.md#log)

#### Defined in

[Bndr.ts:540](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L540)

## Constructors

### constructor

• **new keyboard**()

#### Overrides

[Bndr](Bndr.md).[constructor](Bndr.md#constructor)

#### Defined in

[generator/keyboard.ts:11](https://github.com/baku89/bndr-js/blob/68b6a63/src/generator/keyboard.ts#L11)

## Methods

### filter

▸ **filter**(`fn`): [`Bndr`](Bndr.md)<`string`\>

Filters events with the given predicate function

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`value`: `string`) => `any` | Return truthy value to pass events |

#### Returns

[`Bndr`](Bndr.md)<`string`\>

#### Inherited from

[Bndr](Bndr.md).[filter](Bndr.md#filter)

#### Defined in

[Bndr.ts:172](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L172)

___

### scale

▸ **scale**(`factor`): [`Bndr`](Bndr.md)<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `factor` | `number` |

#### Returns

[`Bndr`](Bndr.md)<`string`\>

#### Inherited from

[Bndr](Bndr.md).[scale](Bndr.md#scale)

#### Defined in

[Bndr.ts:186](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L186)

___

### velocity

▸ **velocity**(): [`Bndr`](Bndr.md)<`string`\>

Creates an event that fires the velocity of current events.

#### Returns

[`Bndr`](Bndr.md)<`string`\>

#### Inherited from

[Bndr](Bndr.md).[velocity](Bndr.md#velocity)

#### Defined in

[Bndr.ts:198](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L198)

___

### norm

▸ **norm**(): [`Bndr`](Bndr.md)<`number`\>

Creates an event that fires the norm of current events.

#### Returns

[`Bndr`](Bndr.md)<`number`\>

#### Inherited from

[Bndr](Bndr.md).[norm](Bndr.md#norm)

#### Defined in

[Bndr.ts:225](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L225)

___

### down

▸ **down**(): [`Bndr`](Bndr.md)<``true``\>

Create an event that emits the moment the current value changes from falsy to truthy.

#### Returns

[`Bndr`](Bndr.md)<``true``\>

#### Inherited from

[Bndr](Bndr.md).[down](Bndr.md#down)

#### Defined in

[Bndr.ts:237](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L237)

___

### up

▸ **up**(): [`Bndr`](Bndr.md)<``true``\>

Create an event that emits the moment the current value changes from falsy to truthy.

#### Returns

[`Bndr`](Bndr.md)<``true``\>

#### Inherited from

[Bndr](Bndr.md).[up](Bndr.md#up)

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

#### Inherited from

[Bndr](Bndr.md).[constant](Bndr.md#constant)

#### Defined in

[Bndr.ts:256](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L256)

___

### throttle

▸ **throttle**(`wait`, `options?`): [`Bndr`](Bndr.md)<`string`\>

Creates debounced version of the current event.

**`See`**

[https://lodash.com/docs/4.17.15#debounced](https://lodash.com/docs/4.17.15#debounced)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `wait` | `number` | Milliseconds to wait. |
| `options?` | `ThrottleSettings` |  |

#### Returns

[`Bndr`](Bndr.md)<`string`\>

#### Inherited from

[Bndr](Bndr.md).[throttle](Bndr.md#throttle)

#### Defined in

[Bndr.ts:286](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L286)

___

### debounce

▸ **debounce**(`wait`, `options`): [`Bndr`](Bndr.md)<`string`\>

Creates debounced version of the current event.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `wait` | `number` | Milliseconds to wait. |
| `options` | `DebounceSettings` |  |

#### Returns

[`Bndr`](Bndr.md)<`string`\>

A new input event

#### Inherited from

[Bndr](Bndr.md).[debounce](Bndr.md#debounce)

#### Defined in

[Bndr.ts:303](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L303)

___

### delay

▸ **delay**(`wait`): [`Bndr`](Bndr.md)<`string`\>

Creates delayed version of the current event.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `wait` | `number` | Milliseconds to wait. |

#### Returns

[`Bndr`](Bndr.md)<`string`\>

A new input event

#### Inherited from

[Bndr](Bndr.md).[delay](Bndr.md#delay)

#### Defined in

[Bndr.ts:320](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L320)

___

### lerp

▸ **lerp**(`t`, `threshold?`): [`Bndr`](Bndr.md)<`string`\>

Smoothen the change rate of the input value.

**`Mix`**

An optional linear interpolation function. `this.mix` is used by default.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `t` | `number` | `undefined` | The ratio of linear interpolation from the current value to the target value with each update. |
| `threshold` | `number` | `1e-4` | - |

#### Returns

[`Bndr`](Bndr.md)<`string`\>

A new input event

#### Inherited from

[Bndr](Bndr.md).[lerp](Bndr.md#lerp)

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
| `update` | (`value`: `string`, `state`: `S`) => [`U`, `S`] | A update function, which takes the current value and a value representing the internal state as arguments, and returns a tuple of the updated value and the new state. |
| `initialState` | `S` | A initial value of the internal state. |

#### Returns

[`Bndr`](Bndr.md)<`U`\>

A new input event

#### Inherited from

[Bndr](Bndr.md).[state](Bndr.md#state)

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
| `fn` | (`prev`: `U`, `value`: `string`) => `U` |  |
| `initial` | `U` | A initial value |

#### Returns

[`Bndr`](Bndr.md)<`U`\>

#### Inherited from

[Bndr](Bndr.md).[fold](Bndr.md#fold)

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
| `fn` | (`prev`: `string` \| `U`, `curt`: `string`) => `U` | A function to calculate the difference |
| `initial` | `U` |  |
| `type?` | `ValueType`<`U`\> |  |

#### Returns

[`Bndr`](Bndr.md)<`U`\>

#### Inherited from

[Bndr](Bndr.md).[delta](Bndr.md#delta)

#### Defined in

[Bndr.ts:435](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L435)

___

### interval

▸ **interval**(`ms?`): [`Bndr`](Bndr.md)<`string`\>

Creates an event that keeps to emit the last value of the current event at specified interval.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `ms` | `number` | `0` | The interval in milliseconds. Set `0` to use `requestAnimationFrame`. |

#### Returns

[`Bndr`](Bndr.md)<`string`\>

#### Inherited from

[Bndr](Bndr.md).[interval](Bndr.md#interval)

#### Defined in

[Bndr.ts:462](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L462)

___

### trail

▸ **trail**(`count?`, `emitAtCount?`): [`Bndr`](Bndr.md)<`string`[]\>

Emits an array caching a specified number of values that were fired in the past.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `count` | `number` | `2` | The number of cache frames. Set `0` to store caches infinitely. |
| `emitAtCount` | `boolean` | `true` | When set to `true`, the new event will not be fired until the trail cache reaches to the number of `count`. |

#### Returns

[`Bndr`](Bndr.md)<`string`[]\>

#### Inherited from

[Bndr](Bndr.md).[trail](Bndr.md#trail)

#### Defined in

[Bndr.ts:488](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L488)

___

### accumlate

▸ **accumlate**(`update?`, `initial?`): [`Bndr`](Bndr.md)<`string`\>

Continually accumulate the fired values using the given 'addition' function.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `update` | `undefined` \| ``null`` \| `Magma`<`string`\> | `null` | If nullish value is given, it fallbacks to `this.type.add`. |
| `initial` | `string` | `undefined` | Used `this.defaultValue` as a default if it's not specified. |

#### Returns

[`Bndr`](Bndr.md)<`string`\>

#### Inherited from

[Bndr](Bndr.md).[accumlate](Bndr.md#accumlate)

#### Defined in

[Bndr.ts:509](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L509)
