/**
 * @hidden
 */

import { Mat4, Quat, random, randomRange, randomRangeInt, Vec2, Vec3 } from '../core/math';
import { sign } from '../core/math/bits';
import { Space } from './enum';

export const particleEmitZAxis = new Vec3(0, 0, -1);

export function calculateTransform (systemSpace: number, moduleSpace: number, worldTransform: Mat4, outQuat: Quat) {
    if (moduleSpace !== systemSpace) {
        if (systemSpace === Space.World) {
            Mat4.getRotation(outQuat, worldTransform);
        }
        else {
            Mat4.invert(worldTransform, worldTransform);
            Mat4.getRotation(outQuat, worldTransform);
        }
        return true;
    }
    else {
        Quat.set(outQuat, 0, 0, 0, 1);
        return false;
    }
}

export function fixedAngleUnitVector2 (out: Vec2 | Vec3, theta: number) {
    Vec2.set(out, Math.cos(theta), Math.sin(theta));
}

export function randomUnitVector2 (out: Vec2 | Vec3) {
    const a = randomRange(0, 2 * Math.PI);
    const x = Math.cos(a);
    const y = Math.sin(a);
    Vec2.set(out, x, y);
}

export function randomUnitVector (out: Vec3) {
    const z = randomRange(-1, 1);
    const a = randomRange(0, 2 * Math.PI);
    const r = Math.sqrt(1 - z * z);
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    Vec3.set(out, x, y, z);
}

export function randomPointInUnitSphere (out: Vec3) {
    randomUnitVector(out);
    Vec3.multiplyScalar(out, out, random());
}

export function randomPointBetweenSphere (out: Vec3, minRadius: number, maxRadius: number) {
    randomUnitVector(out);
    Vec3.multiplyScalar(out, out, minRadius + (maxRadius - minRadius) * random());
}

export function randomPointInUnitCircle (out: Vec3) {
    randomUnitVector2(out);
    out.z = 0;
    Vec3.multiplyScalar(out, out, random());
}

export function randomPointBetweenCircle (out: Vec3, minRadius: number, maxRadius: number) {
    randomUnitVector2(out);
    out.z = 0;
    Vec3.multiplyScalar(out, out, minRadius + (maxRadius - minRadius) * random());
}

export function randomPointBetweenCircleAtFixedAngle (out: Vec3, minRadius: number, maxRadius: number, theta: number) {
    fixedAngleUnitVector2(out, theta);
    out.z = 0;
    Vec3.multiplyScalar(out, out, minRadius + (maxRadius - minRadius) * random());
}

export function randomPointInCube (out: Vec3, extents: Vec3) {
    Vec3.set(out,
        randomRange(-extents.x, extents.x),
        randomRange(-extents.y, extents.y),
        randomRange(-extents.z, extents.z));
}

export function randomPointBetweenCube (out: Vec3, minBox: Vec3, maxBox: Vec3) {
    const subscript = ['x', 'y', 'z'];
    const edge = randomRangeInt(0, 3);
    for (let i = 0; i < 3; i++) {
        if (i === edge) {
            out[subscript[i]] = randomRange(-maxBox[subscript[i]], maxBox[subscript[i]]);
            continue;
        }
        const x = random() * 2 - 1;
        if (x < 0) {
            out[subscript[i]] = -minBox[subscript[i]] + x * (maxBox[subscript[i]] - minBox[subscript[i]]);
        }
        else {
            out[subscript[i]] = minBox[subscript[i]] + x * (maxBox[subscript[i]] - minBox[subscript[i]]);
        }
    }
}

// Fisher–Yates shuffle
export function randomSortArray (arr: any[]) {
    for (let i = 0; i < arr.length; i++) {
        const transpose = i + randomRangeInt(0, arr.length - i);
        const val = arr[transpose];
        arr[transpose] = arr[i];
        arr[i] = val;
    }
}

export function randomSign () {
    let sgn = randomRange(-1, 1);
    sgn === 0 ? sgn++ : sgn;
    return sign(sgn);
}
