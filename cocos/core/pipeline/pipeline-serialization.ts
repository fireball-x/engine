/**
 * @packageDocumentation
 * @module pipeline
 */

import { CCString } from '../data/utils/attribute';
import { ccclass, type, serializable, editable } from 'cc.decorator';
import { Format, LoadOp, StoreOp, TextureLayout, TextureType, TextureUsageBit} from '../gfx/define';
import { ccenum } from '../value-types/enum';
import { RenderTexture } from './../assets/render-texture';
import { Material } from '../assets/material';

ccenum(TextureType);
ccenum(TextureUsageBit);
ccenum(StoreOp);
ccenum(LoadOp);
ccenum(TextureLayout);

/**
 * @en The tag of the render flow, including SCENE, POSTPROCESS and UI.
 * @zh 渲染流程的标签，包含：常规场景（SCENE），后处理（POSTPROCESS），UI 界面（UI）
 */
export enum RenderFlowTag {
    SCENE,
    POSTPROCESS,
    UI,
}

ccenum(RenderFlowTag);

@ccclass('RenderTextureDesc')
export class RenderTextureDesc {
    @serializable
    @editable
    public name: string = '';
    @type(TextureType)
    public type: TextureType = TextureType.TEX2D;
    @type(TextureUsageBit)
    public usage: TextureUsageBit = TextureUsageBit.COLOR_ATTACHMENT;
    @type(Format)
    public format: Format = Format.UNKNOWN;
    @serializable
    @editable
    public width: number = -1;
    @serializable
    @editable
    public height: number = -1;
}

@ccclass('RenderTextureConfig')
export class RenderTextureConfig {
    @serializable
    @editable
    public name: string = '';
    @type(RenderTexture)
    public texture: RenderTexture | null = null;
}

@ccclass('MaterialConfig')
export class MaterialConfig {
    @serializable
    @editable
    public name: string = '';
    @type(Material)
    public material: Material | null = null;
}

@ccclass('FrameBufferDesc')
export class FrameBufferDesc {
    @serializable
    @editable
    public name: string = '';
    @serializable
    @editable
    public renderPass: number = 0;
    @type([CCString])
    public colorTextures: string[] = [];
    @serializable
    @editable
    public depthStencilTexture: string = '';
    @type(RenderTexture)
    public texture: RenderTexture | null = null;
}

@ccclass('ColorDesc')
export class ColorDesc {
    @type(Format)
    public format: Format = Format.UNKNOWN;
    @type(LoadOp)
    public loadOp: LoadOp = LoadOp.CLEAR;
    @type(StoreOp)
    public storeOp: StoreOp = StoreOp.STORE;
    @serializable
    @editable
    public sampleCount: number = 1;
    @type(TextureLayout)
    public beginLayout: TextureLayout = TextureLayout.UNDEFINED;
    @type(TextureLayout)
    public endLayout: TextureLayout = TextureLayout.PRESENT_SRC;
}

@ccclass('DepthStencilDesc')
export class DepthStencilDesc {
    @type(Format)
    public format: Format = Format.UNKNOWN;
    @type(LoadOp)
    public depthLoadOp: LoadOp = LoadOp.CLEAR;
    @type(StoreOp)
    public depthStoreOp: StoreOp = StoreOp.STORE;
    @type(LoadOp)
    public stencilLoadOp: LoadOp = LoadOp.CLEAR;
    @type(StoreOp)
    public stencilStoreOp: StoreOp = StoreOp.STORE;
    @serializable
    @editable
    public sampleCount: number = 1;
    @type(TextureLayout)
    public beginLayout: TextureLayout = TextureLayout.UNDEFINED;
    @type(TextureLayout)
    public endLayout: TextureLayout = TextureLayout.DEPTH_STENCIL_ATTACHMENT_OPTIMAL;
}

@ccclass('RenderPassDesc')
export class RenderPassDesc {
    @serializable
    @editable
    public index: number = -1;
    @type([ColorDesc])
    public colorAttachments = [];
    @type(DepthStencilDesc)
    public depthStencilAttachment: DepthStencilDesc = new DepthStencilDesc();
}

export enum RenderQueueSortMode {
    FRONT_TO_BACK,
    BACK_TO_FRONT,
}

ccenum(RenderQueueSortMode);

/**
 * @en The render queue descriptor
 * @zh 渲染队列描述信息
 */
@ccclass('RenderQueueDesc')
export class RenderQueueDesc {

    /**
     * @en Whether the render queue is a transparent queue
     * @zh 当前队列是否是半透明队列
     */
    @serializable
    @editable
    public isTransparent: boolean = false;

    /**
     * @en The sort mode of the render queue
     * @zh 渲染队列的排序模式
     */
    @type(RenderQueueSortMode)
    public sortMode: RenderQueueSortMode = RenderQueueSortMode.FRONT_TO_BACK;

    /**
     * @en The stages using this queue
     * @zh 使用当前渲染队列的阶段列表
     */
    @type([CCString])
    public stages: string[] = [];
}
