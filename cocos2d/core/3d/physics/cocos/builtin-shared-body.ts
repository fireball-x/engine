/****************************************************************************
 Copyright (c) 2019 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

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
 ****************************************************************************/

import { Mat4, Quat, Vec3 } from '../../../value-types';
import { intersect } from '../../../geom-utils';
import { BuiltInWorld } from './builtin-world';
import { BuiltinShape } from './shapes/builtin-shape';

const m4_0 = new Mat4();
const v3_0 = new Vec3();
const v3_1 = new Vec3();
const quat_0 = new Quat();

/**
 * Built-in static collider, no physical forces involved
 */
export class BuiltinSharedBody {

    private static readonly sharedBodiesMap = new Map<string, BuiltinSharedBody>();

    static getSharedBody (node: any, wrappedWorld: BuiltInWorld) {
        const key = node._id;
        if (BuiltinSharedBody.sharedBodiesMap.has(key)) {
            return BuiltinSharedBody.sharedBodiesMap.get(key)!;
        } else {
            const newSB = new BuiltinSharedBody(node, wrappedWorld);
            BuiltinSharedBody.sharedBodiesMap.set(node._id, newSB);
            return newSB;
        }
    }

    get id () {
        return this._id;
    }

    /**
     * add or remove from world \
     * add, if enable \
     * remove, if disable & shapes.length == 0 & wrappedBody disable
     */
    set enabled (v: boolean) {
        if (v) {
            if (this.index < 0) {
                this.index = this.world.bodies.length;
                this.world.addSharedBody(this);
                this.syncSceneToCollision();
            }
        } else {
            if (this.index >= 0) {
                const isRemove = (this.shapes.length == 0);
                if (isRemove) {
                    this.index = -1;
                    this.world.removeSharedBody(this);
                }
            }
        }
    }

    set reference (v: boolean) {
        v ? this.ref++ : this.ref--;
        if (this.ref == 0) { this.destory(); }
    }

    /** id generator */
    private static idCounter: number = 0;
    private readonly _id: number;
    private index: number = -1;
    private ref: number = 0;

    readonly node: any;
    readonly world: BuiltInWorld;
    readonly shapes: BuiltinShape[] = [];

    private constructor (node: any, world: BuiltInWorld) {
        this._id = BuiltinSharedBody.idCounter++;
        this.node = node;
        this.world = world;
    }

    intersects (body: BuiltinSharedBody) {
        for (let i = 0; i < this.shapes.length; i++) {
            const shapeA = this.shapes[i];

            for (let j = 0; j < body.shapes.length; j++) {
                const shapeB = body.shapes[j];

                if (intersect.resolve(shapeA.worldShape, shapeB.worldShape)) {
                    this.world.shapeArr.push(shapeA);
                    this.world.shapeArr.push(shapeB);
                }
            }
        }
    }

    addShape (shape: BuiltinShape): void {
        const i = this.shapes.indexOf(shape);
        if (i < 0) {
            this.shapes.push(shape);
        }
    }

    removeShape (shape: BuiltinShape): void {
        const i = this.shapes.indexOf(shape);
        if (i >= 0) {
            this.shapes.splice(i, 1);
        }
    }

    syncSceneToCollision () {
        this.node.getWorldMatrix(m4_0);
        this.node.getWorldPosition(v3_0);
        this.node.getWorldRotation(quat_0);
        this.node.getWorldScale(v3_1);
        for (let i = 0; i < this.shapes.length; i++) {
            this.shapes[i].transform(m4_0, v3_0, quat_0, v3_1);
        }
    }

    private destory () {
        BuiltinSharedBody.sharedBodiesMap.delete(this.node._id);
        (this.node as any) = null;
        (this.world as any) = null;
        (this.shapes as any) = null;
    }
}
