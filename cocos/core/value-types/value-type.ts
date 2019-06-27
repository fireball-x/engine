/*
 Copyright (c) 2013-2016 Chukong Technologies Inc.
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
  worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
  not use Cocos Creator software for developing other software or tools that's
  used for developing games. You are not granted to publish, distribute,
  sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
*/

/**
 * @category core/value-types
 */

import { errorID } from '../platform/CCDebug';
import * as js from '../utils/js';

/**
 * 所有值类型的基类。
 */
export class ValueType {
    /**
     * 克隆当前值。克隆的结果值应与当前值相等，即满足 `this.equals(this, value.clone())`。
     *
     * 本方法的基类版本简单地返回 `this`；
     * 派生类**必须**重写本方法，并且返回的对象不应当为 `this`，即满足 `this !== this.clone()`。
     * @returns 克隆结果值。
     */
    public clone (): ValueType {
        errorID(100, js.getClassName(this) + '.clone');
        return this;
    }

    /**
     * 判断当前值是否与指定值相等。此判断应当具有交换性，即满足 `this.equals(other) === other.equals(this)`。
     * 本方法的基类版本简单地返回 `false`。
     * @param other 相比较的值。
     * @returns 相等则返回 `true`，否则返回 `false`。
     */
    public equals (other: this) {
        // errorID(100, js.getClassName(this) + '.equals');
        return false;
    }

    /**
     * 根据指定的插值比率，从当前值到目标值之间做插值。
     * 当插值比率为 `0` 时，此方法的返回值应和当前值相等，即满足 `this.lerp(other, 0, out).equals(this)`；
     * 当插值比率为 `1` 时，此方法的返回值应和目标值相等，即满足 `this.lerp(other, 1, out).equals(other)`。
     * 本方法的基类版本在插值比率为 `1` 时将目标值的克隆作为插值结果，在其它情况下将当前值的克隆作为插值结果。
     * @param to 目标值。
     * @param ratio 插值比率，范围为 [0,1]。
     * @param out 当此参数定义时，本方法允许将插值结果赋值给此参数并返回此参数。
     * @returns 插值结果。
     */
    public lerp (to: ValueType, ratio: number, out: ValueType) {
        // errorID(100, js.getClassName(this) + '.lerp');
        ratio === 1 ? out.set(to) : out.set(this);
        return out;
    }

    /**
     * 同lerp函数一样，只是会新创建一个value-type
     * @param to 目标值。
     * @param ratio 插值比率，范围为 [0,1]。
     * @returns 插值结果。
     */
    public lerpNew (to: ValueType, ratio: number) {
        // errorID(100, js.getClassName(this) + '.lerp');
        return ratio === 1 ? to.clone() : this.clone();
    }

    /**
     * 赋值当前值使其与指定值相等，即在 `this.set(other)` 之后应有 `this.equals(other)`。
     * 本方法的基类版本简单地返回 `this`，派生类**必须**重写本方法。
     * @param other 相比较的值。
     */
    public set (other: this) {
        errorID(100, js.getClassName(this) + '.set');
    }

    /**
     * 返回当前值的字符串表示。
     * 本方法的基类版本返回空字符串。
     * @returns 当前值的字符串表示。
     */
    public toString () {
        return '' + {};
    }
}
js.setClassName('cc.ValueType', ValueType);

cc.ValueType = ValueType;
