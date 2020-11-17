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

import { ILifecycle } from './i-lifecycle'
import { IGroupMask } from './i-group-mask'
import { IVec3Like } from '../../core/math/type-define';
import { Collider, RigidBody, PhysicMaterial, SimplexCollider } from '../../../exports/physics-framework';
import { Mesh } from '../../core';
import { ITerrainAsset } from './i-external';
import { AABB, sphere } from '../../core/geometry';

export interface IBaseShape extends ILifecycle, IGroupMask {
    readonly impl: any;
    readonly collider: Collider;
    readonly attachedRigidBody: RigidBody | null;
    initialize (v: Collider): void;
    setMaterial: (v: PhysicMaterial | null) => void;
    setAsTrigger: (v: boolean) => void;
    setCenter: (v: IVec3Like) => void;
    // setAttachedBody: (body: RigidBody | null) => void;
    getAABB: (v: AABB) => void;
    getBoundingSphere: (v: sphere) => void;
}

export interface IBoxShape extends IBaseShape {
    setSize: (v: IVec3Like) => void;
}

export interface ISphereShape extends IBaseShape {
    setRadius: (v: number) => void;
}

export interface ICapsuleShape extends IBaseShape {
    setRadius: (v: number) => void;
    setCylinderHeight: (v: number) => void;
    setDirection: (v: number) => void;
}

export interface ICylinderShape extends IBaseShape {
    setRadius: (v: number) => void;
    setHeight: (v: number) => void;
    setDirection: (v: number) => void;
}

export interface ISimplexShape extends IBaseShape {
    setShapeType: (v: SimplexCollider.ESimplexType) => void;
    setVertices: (v: IVec3Like[]) => void;
}

export interface IConeShape extends IBaseShape {
    setRadius: (v: number) => void;
    setHeight: (v: number) => void;
    setDirection: (v: number) => void;
}

export interface ITrimeshShape extends IBaseShape {
    setMesh: (v: Mesh | null) => void;
}

export interface ITerrainShape extends IBaseShape {
    setTerrain: (v: ITerrainAsset | null) => void;
}

export interface IConeShape extends IBaseShape {
    setRadius: (v: number) => void;
    setHeight: (v: number) => void;
    setDirection: (v: number) => void;
}

export interface IPlaneShape extends IBaseShape {
    setNormal: (v: IVec3Like) => void;
    setConstant: (v: number) => void;
}
