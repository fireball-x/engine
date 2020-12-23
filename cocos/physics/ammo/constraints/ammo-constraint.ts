/*
 Copyright (c) 2020 Xiamen Yaji Software Co., Ltd.

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
 */

/**
 * @packageDocumentation
 * @hidden
 */

/* eslint-disable new-cap */
import Ammo from '../ammo-instantiated';
import { IBaseConstraint } from '../../spec/i-physics-constraint';
import { Constraint, RigidBody } from '../../framework';
import { AmmoRigidBody } from '../ammo-rigid-body';

export class AmmoConstraint implements IBaseConstraint {
    setConnectedBody (v: RigidBody | null): void {
        // TODO: support dynamic change connected body
    }

    setEnableCollision (v: boolean): void {
        if (this._collided !== v) {
            this._collided = v;
            this.updateByReAdd();
        }
    }

    get impl (): Ammo.btTypedConstraint {
        return this._impl;
    }

    get constraint (): Constraint {
        return this._com;
    }

    dirty = 0;
    index = -1;

    protected _impl!: Ammo.btTypedConstraint;
    protected _com!: Constraint;
    protected _rigidBody!: RigidBody;
    protected _collided = false;

    updateByReAdd () {
        if (this._rigidBody && this.index >= 0) {
            const sb = (this._rigidBody.body as AmmoRigidBody).sharedBody;
            sb.wrappedWorld.removeConstraint(this);
            sb.wrappedWorld.addConstraint(this);
        }
    }

    initialize (v: Constraint): void {
        this._com = v;
        this._rigidBody = v.attachedBody!;
        this._collided = v.enableCollision;
        this.onComponentSet();
    }

    // virtual
    protected onComponentSet () { }

    onLoad (): void {

    }

    onEnable (): void {
        if (this._rigidBody) {
            const sb = (this._rigidBody.body as AmmoRigidBody).sharedBody;
            sb.wrappedWorld.addConstraint(this);
        }
    }

    onDisable (): void {
        if (this._rigidBody) {
            const sb = (this._rigidBody.body as AmmoRigidBody).sharedBody;
            sb.wrappedWorld.removeConstraint(this);
        }
    }

    onDestroy (): void {
        Ammo.destroy(this._impl);
        (this._com as any) = null;
        (this._rigidBody as any) = null;
        (this._impl as any) = null;
    }
}
