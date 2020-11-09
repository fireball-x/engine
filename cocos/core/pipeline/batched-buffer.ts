/**
 * @packageDocumentation
 * @hidden
 */

import { BufferUsageBit, Format, MemoryUsageBit, Device, DescriptorSet, InputAssembler,
    InputAssemblerInfo, Attribute, Buffer, BufferInfo } from '../gfx';
import { Mat4 } from '../math';
import { SubModel } from '../renderer/scene/submodel';
import { UBOLocalBatched } from './define';
import { Pass } from '../renderer';
import { Model } from '../renderer/scene';
import { SubModelPool, SubModelView, ShaderHandle } from '../renderer/core/memory-pools';

export interface IBatchedItem {
    vbs: Buffer[];
    vbDatas: Uint8Array[];
    vbIdx: Buffer;
    vbIdxData: Float32Array;
    vbCount: number;
    mergeCount: number;
    ia: InputAssembler;
    ubo: Buffer;
    uboData: Float32Array;
    descriptorSet: DescriptorSet;
    pass: Pass;
    hShader: ShaderHandle;
}

export class BatchedBuffer {

    private static _buffers = new Map<Pass, Record<number, BatchedBuffer>>();

    public static get (pass: Pass, extraKey = 0) {
        const buffers = BatchedBuffer._buffers;
        if (!buffers.has(pass)) buffers.set(pass, {});
        const record = buffers.get(pass)!;
        return record[extraKey] || (record[extraKey] = new BatchedBuffer(pass));
    }

    public batches: IBatchedItem[] = [];
    public dynamicOffsets: number[] = [];
    private _device: Device;

    constructor (pass: Pass) {
        this._device = pass.device;
    }

    public destroy () {
        for (let i = 0; i < this.batches.length; ++i) {
            const batch = this.batches[i];
            for (let j = 0; j < batch.vbs.length; ++j) {
                batch.vbs[j].destroy();
            }
            batch.vbIdx.destroy();
            batch.ia.destroy();
            batch.ubo.destroy();
        }
        this.batches.length = 0;
    }

    public merge (subModel: SubModel, passIdx: number, model: Model) {
        const flatBuffers = subModel.subMesh.flatBuffers;
        if (flatBuffers.length === 0) { return; }
        let vbSize = 0;
        let vbIdxSize = 0;
        const vbCount = flatBuffers[0].count;
        const pass = subModel.passes[passIdx];
        const hShader = SubModelPool.get(subModel.handle, SubModelView.SHADER_0 + passIdx) as ShaderHandle;
        const descriptorSet = subModel.descriptorSet;
        let isBatchExist = false;
        for (let i = 0; i < this.batches.length; ++i) {
            const batch = this.batches[i];
            if (batch.vbs.length === flatBuffers.length && batch.mergeCount < UBOLocalBatched.BATCHING_COUNT) {
                isBatchExist = true;
                for (let j = 0; j < batch.vbs.length; ++j) {
                    const vb = batch.vbs[j];
                    if (vb.stride !== flatBuffers[j].stride) {
                        isBatchExist = false;
                        break;
                    }
                }

                if (isBatchExist) {
                    for (let j = 0; j < batch.vbs.length; ++j) {
                        const flatBuff = flatBuffers[j];
                        const batchVB = batch.vbs[j];
                        const vbBuf = batch.vbDatas[j];
                        vbSize = (vbCount + batch.vbCount) * flatBuff.stride;
                        if (vbSize > batchVB.size) {
                            batchVB.resize(vbSize);
                            batch.vbDatas[j] = new Uint8Array(vbSize);
                            batch.vbDatas[j].set(vbBuf);
                        }
                        batch.vbDatas[j].set(flatBuff.buffer, batch.vbCount * flatBuff.stride);
                    }

                    let vbIdxBuf = batch.vbIdxData;
                    vbIdxSize = (vbCount + batch.vbCount) * 4;
                    if (vbIdxSize > batch.vbIdx.size) {
                        batch.vbIdx.resize(vbIdxSize);
                        batch.vbIdxData = new Float32Array(vbIdxSize / Float32Array.BYTES_PER_ELEMENT);
                        batch.vbIdxData.set(vbIdxBuf);
                        vbIdxBuf = batch.vbIdxData;
                    }

                    const start = batch.vbCount;
                    const end = start + vbCount;
                    const mergeCount = batch.mergeCount;
                    if (vbIdxBuf[start] !== mergeCount || vbIdxBuf[end - 1] !== mergeCount) {
                        for (let j = start; j < end; j++) {
                            vbIdxBuf[j] = mergeCount + 0.1; // guard against underflow
                        }
                    }

                    // update world matrix
                    Mat4.toArray(batch.uboData, model.transform.worldMatrix, UBOLocalBatched.MAT_WORLDS_OFFSET + batch.mergeCount * 16);
                    if (!batch.mergeCount) {
                        descriptorSet.bindBuffer(UBOLocalBatched.BINDING, batch.ubo);
                        descriptorSet.update();
                        batch.pass = pass;
                        batch.hShader = hShader;
                        batch.descriptorSet = descriptorSet;
                    }

                    ++batch.mergeCount;
                    batch.vbCount += vbCount;
                    batch.ia.vertexCount += vbCount;

                    return;
                }
            }
        }

        // Create a new batch
        const vbs: Buffer[] = [];
        const vbDatas: Uint8Array[] = [];
        const totalVBs: Buffer[] = [];
        for (let i = 0; i < flatBuffers.length; ++i) {
            const flatBuff = flatBuffers[i];
            const newVB = this._device.createBuffer(new BufferInfo(
                BufferUsageBit.VERTEX | BufferUsageBit.TRANSFER_DST,
                MemoryUsageBit.HOST | MemoryUsageBit.DEVICE,
                flatBuff.count * flatBuff.stride,
                flatBuff.stride,
            ));
            newVB.update(flatBuff.buffer.buffer);
            vbs.push(newVB);
            vbDatas.push(new Uint8Array(newVB.size));
            totalVBs.push(newVB);
        }

        const vbIdx = this._device.createBuffer(new BufferInfo(
            BufferUsageBit.VERTEX | BufferUsageBit.TRANSFER_DST,
            MemoryUsageBit.HOST | MemoryUsageBit.DEVICE,
            vbCount * 4,
            4,
        ));
        const vbIdxData = new Float32Array(vbCount);
        vbIdxData.fill(0);
        vbIdx.update(vbIdxData);
        totalVBs.push(vbIdx);

        const attributes = subModel.inputAssembler!.attributes;
        const attrs = new Array<Attribute>(attributes.length + 1);
        for (let a = 0; a < attributes.length; ++a) {
            attrs[a] = attributes[a];
        }
        attrs[attributes.length] = new Attribute('a_dyn_batch_id', Format.R32F, false, flatBuffers.length);

        const iaInfo = new InputAssemblerInfo(attrs, totalVBs);
        const ia = this._device.createInputAssembler(iaInfo);

        const ubo = this._device.createBuffer(new BufferInfo(
            BufferUsageBit.UNIFORM | BufferUsageBit.TRANSFER_DST,
            MemoryUsageBit.HOST | MemoryUsageBit.DEVICE,
            UBOLocalBatched.SIZE,
            UBOLocalBatched.SIZE,
        ));

        descriptorSet.bindBuffer(UBOLocalBatched.BINDING, ubo);
        descriptorSet.update();

        const uboData = new Float32Array(UBOLocalBatched.COUNT);
        Mat4.toArray(uboData, model.transform.worldMatrix, UBOLocalBatched.MAT_WORLDS_OFFSET);

        this.batches.push({
            mergeCount: 1,
            vbs, vbDatas, vbIdx, vbIdxData, vbCount, ia, ubo, uboData, pass, hShader, descriptorSet,
        });
    }

    public clear () {
        for (let i = 0; i < this.batches.length; ++i) {
            const batch = this.batches[i];
            batch.vbCount = 0;
            batch.mergeCount = 0;
            batch.ia.vertexCount = 0;
        }
    }
}
