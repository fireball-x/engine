/*
 Copyright (c) 2017-2020 Xiamen Yaji Software Co., Ltd.

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
 * @packageDocumentation
 * @module ui-assembler
 */

import { IRenderData, RenderData } from '../../../core/renderer/ui/render-data';
import { UI } from '../../../core/renderer/ui/ui';
import { Mask, MaskType } from '../../components/mask';
import { IAssembler, IAssemblerManager } from '../../../core/renderer/ui/base';
import { StencilManager } from '../../../core/renderer/ui/stencil-manager';
import { simple } from '../sprite';

const _stencilManager = StencilManager.sharedManager!;

function applyClearMask (mask: Mask, renderer: UI) {
    _stencilManager.clear();
    renderer.commitModel(mask, mask._clearModel, mask._clearStencilMtl);
}

function applyAreaMask (mask: Mask, renderer: UI) {
    _stencilManager.enterLevel();
    if (mask.type === MaskType.IMAGE_STENCIL){
        renderer.commitComp(mask!, mask.spriteFrame, simple);
        renderer.autoMergeBatches(mask!);
    } else {
        const mat = mask.getMaterialInstanceForStencil();
        renderer.commitModel(mask.graphics!, mask.graphics!.model, mat);
    }
}

export const maskAssembler: IAssembler = {
    createData (mask: Mask) {
        const renderData = mask.requestRenderData();
        renderData!.dataLength = 4;
        renderData!.vertexCount = 4;
        renderData!.indicesCount = 6;

        renderData.vData = new Float32Array(4 * 9);
        return renderData as RenderData;
    },

    updateRenderData (mask: Mask){
        if (mask.type === MaskType.IMAGE_STENCIL){
            simple.updateRenderData(mask);
        }
    },

    fillBuffers (mask: Mask, renderer: UI) {
        if (mask.type !== MaskType.IMAGE_STENCIL || mask.spriteFrame) {
            _stencilManager.pushMask(mask);

            renderer.finishMergeBatches();
            applyClearMask(mask, renderer);
            applyAreaMask(mask, renderer);

            _stencilManager.enableMask();
        }
    },
};

export const maskEndAssembler: IAssembler = {
    fillBuffers (mask: Mask, ui: UI) {
        _stencilManager.exitMask();
    },
};

const StartAssembler: IAssemblerManager = {
    getAssembler () {
        return maskAssembler;
    },
};

const PostAssembler: IAssemblerManager = {
    getAssembler () {
        return maskEndAssembler;
    },
};

Mask.Assembler = StartAssembler;
Mask.PostAssembler = PostAssembler;
