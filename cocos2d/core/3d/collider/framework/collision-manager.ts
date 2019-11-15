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

import { IColliderWorld, IRaycastOptions } from '../spec/i-collider-world';
import { createColliderWorld } from './instance';
import { RecyclePool } from '../../../../renderer/memop';
import { Ray } from '../../../geom-utils';
import { ColliderRayResult } from './collider-ray-result';
import { property, ccclass } from '../../../platform/CCClassDecorator';

let director = cc.director;
let Director = cc.Director;

/**
 * !#en The collision system.
 * !#zh 碰撞系统。
 */
@ccclass("cc.Collision3DManager")
export class Collision3DManager {
    protected _executeInEditMode = false;

    /**
     * !#en Gets or sets whether the collision system is enabled and can be used to suspend or continue running the collision system.
     * !#zh 获取或设置是否启用碰撞系统，可以用于暂停或继续运行碰撞系统。
     */
    get enable (): boolean {
        return this._enable;
    }
    set enable (value: boolean) {
        this._enable = value;
    }

    /**
     * @zh
     * 获取或设置每帧模拟的最大子步数。
     */
    get maxSubStep () {
        return this._maxSubStep;
    }

    set maxSubStep (value: number) {
        this._maxSubStep = value;
    }

    /**
     * @zh
     * 获取或设置每步模拟消耗的固定时间。
     */
    get deltaTime () {
        return this._deltaTime;
    }

    set deltaTime (value: number) {
        this._deltaTime = value;
    }

    /**
     * @zh
     * 获取或设置是否使用固定的时间步长。
     */
    get useFixedTime () {
        return this._useFixedTime;
    }

    set useFixedTime (value: boolean) {
        this._useFixedTime = value;
    }

    static readonly instance: Collision3DManager;

    readonly colliderWorld: IColliderWorld;
    readonly raycastClosestResult = new ColliderRayResult();
    readonly raycastResults: ColliderRayResult[] = [];

    @property
    private _enable = true;

    @property
    private _allowSleep = true;

    @property
    private _maxSubStep = 1;

    @property
    private _deltaTime = 1.0 / 60.0;

    @property
    private _useFixedTime = true;

    private readonly raycastOptions: IRaycastOptions = {
        'groupIndex': -1,
        'maxDistance': Infinity
    }

    private readonly raycastResultPool = new RecyclePool(() => {
        return new ColliderRayResult();
    }, 1);

    private constructor () {
        director._scheduler && director._scheduler.enableForTarget(this);
        this.colliderWorld = createColliderWorld();
    }

    /**
     * @zh
     * 执行一次物理系统的模拟，目前将在每帧自动执行一次。
     * @param deltaTime 与上一次执行相差的时间，目前为每帧消耗时间
     */
    update (deltaTime: number) {
        if (CC_EDITOR && !this._executeInEditMode) {
            return;
        }
        if (!this._enable) {
            return;
        }

        director.emit(Director.EVENT_BEFORE_PHYSICS);

        if (this._useFixedTime) {
            this.colliderWorld.step(this._deltaTime);
        } else {
            this.colliderWorld.step(this._deltaTime, deltaTime, this._maxSubStep);
        }
        // if (this._singleStep) {
        //     this._enable = false;
        // }

        director.emit(Director.EVENT_AFTER_PHYSICS);
    }

    /**
     * @zh
     * 检测所有的碰撞盒，并记录所有被检测到的结果，通过 PhysicsSystem.instance.raycastResults 访问结果
     * @param worldRay 世界空间下的一条射线
     * @param groupIndex 碰撞组
     * @param maxDistance 最大检测距离
     * @return boolean 表示是否有检测到碰撞盒
     * @note 由于目前 Layer 还未完善，mask 暂时失效，请留意更新公告
     */
    raycast (worldRay: Ray, groupIndex: number = 0, maxDistance = Infinity): boolean {
        this.raycastResultPool.reset();
        this.raycastResults.length = 0;
        this.raycastOptions.groupIndex = groupIndex;
        this.raycastOptions.maxDistance = maxDistance;
        return this.colliderWorld.raycast(worldRay, this.raycastOptions, this.raycastResultPool, this.raycastResults);
    }

    /**
     * @zh
     * 检测所有的碰撞盒，并记录与射线距离最短的检测结果，通过 PhysicsSystem.instance.raycastClosestResult 访问结果
     * @param worldRay 世界空间下的一条射线
     * @param groupIndex 碰撞组
     * @param maxDistance 最大检测距离
     * @return boolean 表示是否有检测到碰撞盒
     * @note 由于目前 Layer 还未完善，mask 暂时失效，请留意更新公告
     */
    raycastClosest (worldRay: Ray, groupIndex: number = 0, maxDistance = Infinity): boolean {
        this.raycastOptions.groupIndex = groupIndex;
        this.raycastOptions.maxDistance = maxDistance;
        return this.colliderWorld.raycastClosest(worldRay, this.raycastOptions, this.raycastClosestResult);
    }
}
