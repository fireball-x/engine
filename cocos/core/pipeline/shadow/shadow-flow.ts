/**
 * @packageDocumentation
 * @module pipeline.forward
 */

import { ccclass } from 'cc.decorator';
import { PIPELINE_FLOW_SHADOW, UNIFORM_SHADOWMAP_BINDING } from '../define';
import { IRenderFlowInfo, RenderFlow } from '../render-flow';
import { ForwardFlowPriority } from '../forward/enum';
import { ShadowStage } from './shadow-stage';
import { GFXFramebuffer, GFXRenderPass, GFXLoadOp, GFXStoreOp,
    GFXTextureLayout, GFXFormat, GFXTexture, GFXTextureType, GFXTextureUsageBit, GFXFilter, GFXAddress,
    GFXColorAttachment, GFXDepthStencilAttachment, GFXRenderPassInfo, GFXTextureInfo, GFXFramebufferInfo } from '../../gfx';
import { RenderFlowTag } from '../pipeline-serialization';
import { ForwardPipeline } from '../forward/forward-pipeline';
import { RenderView } from '../render-view';
import { ShadowType } from '../../renderer/scene/shadows';
import { genSamplerHash, samplerLib } from '../../renderer/core/sampler-lib';
import { Light } from '../../renderer/scene/light';
import { lightCollecting, shadowCollecting } from '../forward/scene-culling';
import { Vec2 } from '../../math';

const _samplerInfo = [
    GFXFilter.LINEAR,
    GFXFilter.LINEAR,
    GFXFilter.NONE,
    GFXAddress.CLAMP,
    GFXAddress.CLAMP,
    GFXAddress.CLAMP,
];

/**
 * @en Shadow map render flow
 * @zh 阴影贴图绘制流程
 */
@ccclass('ShadowFlow')
export class ShadowFlow extends RenderFlow {

    /**
     * @en A common initialization info for shadow map render flow
     * @zh 一个通用的 ShadowFlow 的初始化信息对象
     */
    public static initInfo: IRenderFlowInfo = {
        name: PIPELINE_FLOW_SHADOW,
        priority: ForwardFlowPriority.SHADOW,
        tag: RenderFlowTag.SCENE,
        stages: []
    };

    private _shadowRenderPass: GFXRenderPass|null = null;

    public initialize (info: IRenderFlowInfo): boolean {
        super.initialize(info);
        if (this._stages.length === 0) {
            // add shadowMap-stages
            const shadowMapStage = new ShadowStage();
            shadowMapStage.initialize(ShadowStage.initInfo);
            this._stages.push(shadowMapStage);
        }
        return true;
    }

    public render (view: RenderView) {
        const pipeline = this._pipeline as ForwardPipeline;
        const shadowInfo = pipeline.shadows;
        if (shadowInfo.type !== ShadowType.ShadowMap) { return; }

        const validLights = lightCollecting(view, shadowInfo.mostReceived);
        shadowCollecting(pipeline, view);

        for (let l = 0; l < validLights.length; l++) {
            const light = validLights[l];

            if (!pipeline.shadowFrameBufferMap.has(light)) {
                this._initShadowFrameBuffer(pipeline, light);
            }
            const shadowFrameBuffer = pipeline.shadowFrameBufferMap.get(light);
            if (shadowInfo.shadowMapDirty) { this.resizeShadowMap(light, shadowInfo.size); }

            for (let i = 0; i < this._stages.length; ++i) {
                const shadowStage = this._stages[i] as ShadowStage;
                shadowStage.setUsage(light, shadowFrameBuffer!);
                shadowStage.render(view);
            }
        }
    }


    public _initShadowFrameBuffer  (pipeline: ForwardPipeline, light: Light) {
        const device = pipeline.device;
        const shadowMapSize = pipeline.shadows.size;

        if (!this._shadowRenderPass) {
            const colorAttachment = new GFXColorAttachment();
            colorAttachment.format = GFXFormat.RGBA8;
            colorAttachment.loadOp = GFXLoadOp.CLEAR; // should clear color attachment
            colorAttachment.storeOp = GFXStoreOp.STORE;
            colorAttachment.sampleCount = 1;
            colorAttachment.beginLayout = GFXTextureLayout.UNDEFINED;
            colorAttachment.endLayout = GFXTextureLayout.PRESENT_SRC;

            const depthStencilAttachment = new GFXDepthStencilAttachment();
            depthStencilAttachment.format = device.depthStencilFormat;
            depthStencilAttachment.depthLoadOp = GFXLoadOp.CLEAR;
            depthStencilAttachment.depthStoreOp = GFXStoreOp.STORE;
            depthStencilAttachment.stencilLoadOp = GFXLoadOp.CLEAR;
            depthStencilAttachment.stencilStoreOp = GFXStoreOp.STORE;
            depthStencilAttachment.sampleCount = 1;
            depthStencilAttachment.beginLayout = GFXTextureLayout.UNDEFINED;
            depthStencilAttachment.endLayout = GFXTextureLayout.DEPTH_STENCIL_ATTACHMENT_OPTIMAL;

            const renderPassInfo = new GFXRenderPassInfo([colorAttachment], depthStencilAttachment);
            this._shadowRenderPass = device.createRenderPass(renderPassInfo);
        }

        const shadowRenderTargets: GFXTexture[] = [];
        shadowRenderTargets.push(device.createTexture(new GFXTextureInfo(
            GFXTextureType.TEX2D,
            GFXTextureUsageBit.COLOR_ATTACHMENT | GFXTextureUsageBit.SAMPLED,
            GFXFormat.RGBA8,
            shadowMapSize.x,
            shadowMapSize.y,
        )));

        const depth = device.createTexture(new GFXTextureInfo(
            GFXTextureType.TEX2D,
            GFXTextureUsageBit.DEPTH_STENCIL_ATTACHMENT,
            device.depthStencilFormat,
            shadowMapSize.x,
            shadowMapSize.y,
        ));


        const shadowFrameBuffer = device.createFramebuffer(new GFXFramebufferInfo(
            this._shadowRenderPass,
            shadowRenderTargets,
            depth,
        ));

        // Cache frameBuffer
        pipeline.shadowFrameBufferMap.set(light, shadowFrameBuffer);

        const shadowMapSamplerHash = genSamplerHash(_samplerInfo);
        const shadowMapSampler = samplerLib.getSampler(device, shadowMapSamplerHash);
        pipeline.descriptorSet.bindSampler(UNIFORM_SHADOWMAP_BINDING, shadowMapSampler);
    }

    private resizeShadowMap(light: Light, size: Vec2) {
        const width = size.x;
        const height = size.y;
        const pipeline = this._pipeline as ForwardPipeline;

        if (pipeline.shadowFrameBufferMap.has(light)) {
            const frameBuffer = pipeline.shadowFrameBufferMap.get(light);

            if (!frameBuffer) { return; }

            const renderTargets = frameBuffer.colorTextures;
            if (renderTargets && renderTargets.length > 0) {
                for (let j = 0; j < renderTargets.length; j++) {
                    const renderTarget = renderTargets[j];
                    if (renderTarget) { renderTarget.resize(width, height); }
                }
            }

            const depth = frameBuffer.depthStencilTexture;
            if (depth) { depth.resize(width, height); }

            const shadowRenderPass = frameBuffer.renderPass;
            frameBuffer.destroy();
            frameBuffer.initialize(new GFXFramebufferInfo(
                shadowRenderPass,
                renderTargets,
                depth,
            ));
        }
    }
}