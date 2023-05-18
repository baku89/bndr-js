[bndr-js](../README.md) / pointer

# Class: pointer

## Hierarchy

- `TargetedPointerBndr`

  ↳ **`pointer`**

## Table of contents

### Generators

- [position](pointer.md#position)
- [scroll](pointer.md#scroll)
- [pressed](pointer.md#pressed)
- [down](pointer.md#down)
- [up](pointer.md#up)
- [target](pointer.md#target)

### Filters

- [as](pointer.md#as)
- [map](pointer.md#map)

### Event Handlers

- [on](pointer.md#on)
- [off](pointer.md#off)
- [emit](pointer.md#emit)
- [once](pointer.md#once)
- [removeAllListeners](pointer.md#removealllisteners)

### Properties

- [value](pointer.md#value)
- [defaultValue](pointer.md#defaultvalue)
- [emittedValue](pointer.md#emittedvalue)
- [type](pointer.md#type)

### Utilities

- [log](pointer.md#log)

### Constructors

- [constructor](pointer.md#constructor)

### Methods

- [filter](pointer.md#filter)
- [scale](pointer.md#scale)
- [velocity](pointer.md#velocity)
- [norm](pointer.md#norm)
- [constant](pointer.md#constant)
- [throttle](pointer.md#throttle)
- [debounce](pointer.md#debounce)
- [delay](pointer.md#delay)
- [lerp](pointer.md#lerp)
- [state](pointer.md#state)
- [fold](pointer.md#fold)
- [delta](pointer.md#delta)
- [interval](pointer.md#interval)
- [trail](pointer.md#trail)
- [accumlate](pointer.md#accumlate)

## Generators

### position

▸ **position**(`options?`): [`Bndr`](Bndr.md)<`Vec2`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `boolean` \| `BndrGeneratorOptions` |

#### Returns

[`Bndr`](Bndr.md)<`Vec2`\>

#### Inherited from

TargetedPointerBndr.position

#### Defined in

[generator/pointer.ts:29](https://github.com/baku89/bndr-js/blob/68b6a63/src/generator/pointer.ts#L29)

___

### scroll

▸ **scroll**(`options?`): [`Bndr`](Bndr.md)<`Vec2`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `boolean` \| `BndrGeneratorOptions` |

#### Returns

[`Bndr`](Bndr.md)<`Vec2`\>

#### Inherited from

TargetedPointerBndr.scroll

#### Defined in

[generator/pointer.ts:57](https://github.com/baku89/bndr-js/blob/68b6a63/src/generator/pointer.ts#L57)

___

### pressed

▸ **pressed**(`options?`): [`Bndr`](Bndr.md)<`boolean`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `boolean` \| `BndrGeneratorOptions` |

#### Returns

[`Bndr`](Bndr.md)<`boolean`\>

#### Inherited from

TargetedPointerBndr.pressed

#### Defined in

[generator/pointer.ts:85](https://github.com/baku89/bndr-js/blob/68b6a63/src/generator/pointer.ts#L85)

___

### down

▸ **down**(`options?`): [`Bndr`](Bndr.md)<``true``\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `boolean` \| `BndrGeneratorOptions` |

#### Returns

[`Bndr`](Bndr.md)<``true``\>

#### Inherited from

TargetedPointerBndr.down

#### Defined in

[generator/pointer.ts:118](https://github.com/baku89/bndr-js/blob/68b6a63/src/generator/pointer.ts#L118)

___

### up

▸ **up**(`options?`): [`Bndr`](Bndr.md)<``true``\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `boolean` \| `BndrGeneratorOptions` |

#### Returns

[`Bndr`](Bndr.md)<``true``\>

#### Inherited from

TargetedPointerBndr.up

#### Defined in

[generator/pointer.ts:125](https://github.com/baku89/bndr-js/blob/68b6a63/src/generator/pointer.ts#L125)

___

### target

▸ **target**(`target`): `TargetedPointerBndr`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `target` | `string` \| `HTMLElement` | A DOM element to watch the pointr event |

#### Returns

`TargetedPointerBndr`

#### Defined in

[generator/pointer.ts:144](https://github.com/baku89/bndr-js/blob/68b6a63/src/generator/pointer.ts#L144)

## Filters

### as

▸ **as**(`type`): [`Bndr`](Bndr.md)<`PointerEvent`\>

Returnes a new instance with the value type annotation

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `ValueType`<`PointerEvent`\> |

#### Returns

[`Bndr`](Bndr.md)<`PointerEvent`\>

#### Inherited from

TargetedPointerBndr.as

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
| `fn` | (`value`: `PointerEvent`) => `U` |
| `type?` | `ValueType`<`U`\> |

#### Returns

[`Bndr`](Bndr.md)<`U`\>

A new input event

#### Inherited from

TargetedPointerBndr.map

#### Defined in

[Bndr.ts:155](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L155)

## Event Handlers

### on

▸ **on**(`listener`): `void`

Adds the `listener` function for the event

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `listener` | `Listener`<`PointerEvent`\> | The callback function |

#### Returns

`void`

#### Inherited from

TargetedPointerBndr.on

#### Defined in

[Bndr.ts:86](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L86)

___

### off

▸ **off**(`listener`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `listener` | `Listener`<`PointerEvent`\> |

#### Returns

`void`

#### Inherited from

TargetedPointerBndr.off

#### Defined in

[Bndr.ts:95](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L95)

___

### emit

▸ **emit**(`value`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `PointerEvent` |

#### Returns

`void`

#### Inherited from

TargetedPointerBndr.emit

#### Defined in

[Bndr.ts:104](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L104)

___

### once

▸ **once**(`listener`): `void`

Adds a *one-time* `listener` function for the event

#### Parameters

| Name | Type |
| :------ | :------ |
| `listener` | `Listener`<`PointerEvent`\> |

#### Returns

`void`

#### Inherited from

TargetedPointerBndr.once

#### Defined in

[Bndr.ts:116](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L116)

___

### removeAllListeners

▸ **removeAllListeners**(): `void`

Removes all listeners.

#### Returns

`void`

#### Inherited from

TargetedPointerBndr.removeAllListeners

#### Defined in

[Bndr.ts:128](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L128)

## Properties

### value

• `get` **value**(): `T`

The latest value emitted from the event. If the event has never fired before, it fallbacks to [defaultValue](Bndr.md#defaultvalue).

#### Returns

`T`

#### Inherited from

TargetedPointerBndr.value

#### Defined in

[Bndr.ts:58](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L58)

___

### defaultValue

• `Readonly` **defaultValue**: `PointerEvent`

The default value of the event.

#### Inherited from

TargetedPointerBndr.defaultValue

#### Defined in

[Bndr.ts:66](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L66)

___

### emittedValue

• `get` **emittedValue**(): `Maybe`<`T`\>

The latest value emitted from the event. If the event has never fired before, it just returns `None`.

#### Returns

`Maybe`<`T`\>

#### Inherited from

TargetedPointerBndr.emittedValue

#### Defined in

[Bndr.ts:72](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L72)

___

### type

• `Optional` `Readonly` **type**: `ValueType`<`PointerEvent`\>

The value type of the current event. Use [as](Bndr.md#as) to manually indicate other value type.

#### Inherited from

TargetedPointerBndr.type

#### Defined in

[Bndr.ts:79](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L79)

## Utilities

### log

▸ **log**(`message?`): [`pointer`](pointer.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `message` | `string` | `'Bndr'` |

#### Returns

[`pointer`](pointer.md)

#### Inherited from

TargetedPointerBndr.log

#### Defined in

[Bndr.ts:540](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L540)

## Constructors

### constructor

• **new pointer**()

#### Overrides

TargetedPointerBndr.constructor

#### Defined in

[generator/pointer.ts:134](https://github.com/baku89/bndr-js/blob/68b6a63/src/generator/pointer.ts#L134)

## Methods

### filter

▸ **filter**(`fn`): [`Bndr`](Bndr.md)<`PointerEvent`\>

Filters events with the given predicate function

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`value`: `PointerEvent`) => `any` | Return truthy value to pass events |

#### Returns

[`Bndr`](Bndr.md)<`PointerEvent`\>

#### Inherited from

TargetedPointerBndr.filter

#### Defined in

[Bndr.ts:172](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L172)

___

### scale

▸ **scale**(`factor`): [`Bndr`](Bndr.md)<`PointerEvent`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `factor` | `number` |

#### Returns

[`Bndr`](Bndr.md)<`PointerEvent`\>

#### Inherited from

TargetedPointerBndr.scale

#### Defined in

[Bndr.ts:186](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L186)

___

### velocity

▸ **velocity**(): [`Bndr`](Bndr.md)<`PointerEvent`\>

Creates an event that fires the velocity of current events.

#### Returns

[`Bndr`](Bndr.md)<`PointerEvent`\>

#### Inherited from

TargetedPointerBndr.velocity

#### Defined in

[Bndr.ts:198](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L198)

___

### norm

▸ **norm**(): [`Bndr`](Bndr.md)<`number`\>

Creates an event that fires the norm of current events.

#### Returns

[`Bndr`](Bndr.md)<`number`\>

#### Inherited from

TargetedPointerBndr.norm

#### Defined in

[Bndr.ts:225](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L225)

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

TargetedPointerBndr.constant

#### Defined in

[Bndr.ts:256](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L256)

___

### throttle

▸ **throttle**(`wait`, `options?`): [`Bndr`](Bndr.md)<`PointerEvent`\>

Creates debounced version of the current event.

**`See`**

[https://lodash.com/docs/4.17.15#debounced](https://lodash.com/docs/4.17.15#debounced)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `wait` | `number` | Milliseconds to wait. |
| `options?` | `ThrottleSettings` |  |

#### Returns

[`Bndr`](Bndr.md)<`PointerEvent`\>

#### Inherited from

TargetedPointerBndr.throttle

#### Defined in

[Bndr.ts:286](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L286)

___

### debounce

▸ **debounce**(`wait`, `options`): [`Bndr`](Bndr.md)<`PointerEvent`\>

Creates debounced version of the current event.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `wait` | `number` | Milliseconds to wait. |
| `options` | `DebounceSettings` |  |

#### Returns

[`Bndr`](Bndr.md)<`PointerEvent`\>

A new input event

#### Inherited from

TargetedPointerBndr.debounce

#### Defined in

[Bndr.ts:303](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L303)

___

### delay

▸ **delay**(`wait`): [`Bndr`](Bndr.md)<`PointerEvent`\>

Creates delayed version of the current event.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `wait` | `number` | Milliseconds to wait. |

#### Returns

[`Bndr`](Bndr.md)<`PointerEvent`\>

A new input event

#### Inherited from

TargetedPointerBndr.delay

#### Defined in

[Bndr.ts:320](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L320)

___

### lerp

▸ **lerp**(`t`, `threshold?`): [`Bndr`](Bndr.md)<`PointerEvent`\>

Smoothen the change rate of the input value.

**`Mix`**

An optional linear interpolation function. `this.mix` is used by default.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `t` | `number` | `undefined` | The ratio of linear interpolation from the current value to the target value with each update. |
| `threshold` | `number` | `1e-4` | - |

#### Returns

[`Bndr`](Bndr.md)<`PointerEvent`\>

A new input event

#### Inherited from

TargetedPointerBndr.lerp

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
| `update` | (`value`: `PointerEvent`, `state`: `S`) => [`U`, `S`] | A update function, which takes the current value and a value representing the internal state as arguments, and returns a tuple of the updated value and the new state. |
| `initialState` | `S` | A initial value of the internal state. |

#### Returns

[`Bndr`](Bndr.md)<`U`\>

A new input event

#### Inherited from

TargetedPointerBndr.state

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
| `fn` | (`prev`: `U`, `value`: `PointerEvent`) => `U` |  |
| `initial` | `U` | A initial value |

#### Returns

[`Bndr`](Bndr.md)<`U`\>

#### Inherited from

TargetedPointerBndr.fold

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
| `fn` | (`prev`: `PointerEvent` \| `U`, `curt`: `PointerEvent`) => `U` | A function to calculate the difference |
| `initial` | `U` |  |
| `type?` | `ValueType`<`U`\> |  |

#### Returns

[`Bndr`](Bndr.md)<`U`\>

#### Inherited from

TargetedPointerBndr.delta

#### Defined in

[Bndr.ts:435](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L435)

___

### interval

▸ **interval**(`ms?`): [`Bndr`](Bndr.md)<`PointerEvent`\>

Creates an event that keeps to emit the last value of the current event at specified interval.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `ms` | `number` | `0` | The interval in milliseconds. Set `0` to use `requestAnimationFrame`. |

#### Returns

[`Bndr`](Bndr.md)<`PointerEvent`\>

#### Inherited from

TargetedPointerBndr.interval

#### Defined in

[Bndr.ts:462](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L462)

___

### trail

▸ **trail**(`count?`, `emitAtCount?`): [`Bndr`](Bndr.md)<`PointerEvent`[]\>

Emits an array caching a specified number of values that were fired in the past.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `count` | `number` | `2` | The number of cache frames. Set `0` to store caches infinitely. |
| `emitAtCount` | `boolean` | `true` | When set to `true`, the new event will not be fired until the trail cache reaches to the number of `count`. |

#### Returns

[`Bndr`](Bndr.md)<`PointerEvent`[]\>

#### Inherited from

TargetedPointerBndr.trail

#### Defined in

[Bndr.ts:488](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L488)

___

### accumlate

▸ **accumlate**(`update?`, `initial?`): [`Bndr`](Bndr.md)<`PointerEvent`\>

Continually accumulate the fired values using the given 'addition' function.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `update` | `undefined` \| ``null`` \| `Magma`<`PointerEvent`\> | `null` | If nullish value is given, it fallbacks to `this.type.add`. |
| `initial` | `PointerEvent` | `undefined` | Used `this.defaultValue` as a default if it's not specified. |

#### Returns

[`Bndr`](Bndr.md)<`PointerEvent`\>

#### Inherited from

TargetedPointerBndr.accumlate

#### Defined in

[Bndr.ts:509](https://github.com/baku89/bndr-js/blob/68b6a63/src/Bndr.ts#L509)
