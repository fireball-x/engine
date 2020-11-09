import { aabb, frustum } from '../../geometry';
import { Mat4, Quat, Vec3 } from '../../math';
import { Light, LightType, nt2lm } from './light';
import {
    AABBHandle, AABBPool, AABBView, FrustumHandle, FrustumPool, LightPool, LightView, NULL_HANDLE,
} from '../core/memory-pools';
import { recordFrustumToSharedMemory } from '../../geometry/frustum';

const _forward = new Vec3(0, 0, -1);
const _qt = new Quat();
const _matView = new Mat4();
const _matProj = new Mat4();
const _matViewProj = new Mat4();
const _matViewProjInv = new Mat4();

export class SpotLight extends Light {
    protected _dir: Vec3 = new Vec3(1.0, -1.0, -1.0);

    protected _range = 5.0;

    protected _spotAngle: number = Math.cos(Math.PI / 6);

    protected _pos: Vec3;

    protected _aabb: aabb;

    protected _frustum: frustum;

    protected _angle = 0;

    protected _needUpdate = false;

    protected _hAABB: AABBHandle = NULL_HANDLE;

    protected _hFrustum: FrustumHandle = NULL_HANDLE;

    get position () {
        return this._pos;
    }

    set size (size: number) {
        LightPool.set(this._handle, LightView.SIZE, size);
    }

    get size (): number {
        return LightPool.get(this._handle, LightView.SIZE);
    }

    set range (range: number) {
        this._range = range;
        LightPool.set(this._handle, LightView.RANGE, range);
        this._needUpdate = true;
    }

    get range (): number {
        return LightPool.get(this._handle, LightView.RANGE);
    }

    set luminance (lum: number) {
        LightPool.set(this._handle, LightView.ILLUMINANCE, lum);
    }

    get luminance (): number {
        return LightPool.get(this._handle, LightView.ILLUMINANCE);
    }

    get direction (): Vec3 {
        return this._dir;
    }

    get spotAngle () {
        return LightPool.get(this._handle, LightView.SPOT_ANGLE);
    }

    set spotAngle (val: number) {
        this._angle = val;
        LightPool.set(this._handle, LightView.SPOT_ANGLE, Math.cos(val * 0.5));
        this._needUpdate = true;
    }

    set aspect (val: number) {
        LightPool.set(this._handle, LightView.ASPECT, val);
        this._needUpdate = true;
    }

    get aspect (): number {
        return LightPool.get(this._handle, LightView.ASPECT);
    }

    get aabb () {
        return this._aabb;
    }

    get frustum () {
        return this._frustum;
    }

    constructor () {
        super();
        this._aabb = aabb.create();
        this._frustum = frustum.create();
        this._pos = new Vec3();
    }

    public initialize () {
        super.initialize();
        this._hAABB = AABBPool.alloc();
        this._hFrustum = FrustumPool.alloc();
        const size = 0.15;
        LightPool.set(this._handle, LightView.TYPE, LightType.SPOT);
        LightPool.set(this._handle, LightView.SIZE, size);
        LightPool.set(this._handle, LightView.AABB, this._hAABB);
        LightPool.set(this._handle, LightView.ILLUMINANCE, 1700 / nt2lm(size));
        LightPool.set(this._handle, LightView.RANGE, Math.cos(Math.PI / 6));
        LightPool.set(this._handle, LightView.ASPECT, 1.0);
        LightPool.setVec3(this._handle, LightView.DIRECTION, this._dir);
    }

    public update () {
        if (this._node && (this._node.hasChangedFlags || this._needUpdate)) {
            this._node.getWorldPosition(this._pos);
            Vec3.transformQuat(this._dir, _forward, this._node.getWorldRotation(_qt));
            Vec3.normalize(this._dir, this._dir);
            LightPool.setVec3(this._handle, LightView.DIRECTION, this._dir);
            aabb.set(this._aabb, this._pos.x, this._pos.y, this._pos.z, this._range, this._range, this._range);

            // view matrix
            this._node.getWorldRT(_matView);
            Mat4.invert(_matView, _matView);

            Mat4.perspective(_matProj, this._angle, 1.0, 0.001, this._range);

            // view-projection
            Mat4.multiply(_matViewProj, _matProj, _matView);
            // Mat4.invert(_matViewProjInv, _matViewProj);

            this._frustum.update(_matViewProj, _matViewProjInv);
            this._needUpdate = false;

            LightPool.setVec3(this._handle, LightView.POSITION, this._pos);
            AABBPool.setVec3(this._hAABB, AABBView.CENTER, this._aabb.center);
            AABBPool.setVec3(this._hAABB, AABBView.HALF_EXTENSION, this._aabb.halfExtents);
            recordFrustumToSharedMemory(this._hFrustum, this._frustum);
        }
    }

    public destroy () {
        if (this._hAABB) {
            AABBPool.free(this._hAABB);
            this._hAABB = NULL_HANDLE;
        }
        if (this._hFrustum) {
            FrustumPool.free(this._hFrustum);
            this._hFrustum = NULL_HANDLE;
        }
        return super.destroy();
    }
}
