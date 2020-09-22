/**
 * @category pipeline.forward
 */

import { ccclass } from 'cc.decorator';
import { PIPELINE_FLOW_SHADOW, SetIndex } from '../define';
import { IRenderFlowInfo, RenderFlow } from '../render-flow';
import { ForwardFlowPriority } from '../forward/enum';
import { GFXFramebuffer, GFXLoadOp,
    GFXStoreOp, GFXTextureLayout, GFXFormat, GFXTexture,
    GFXTextureType, GFXTextureUsageBit, GFXFilter, GFXAddress } from '../../gfx';
import { RenderFlowTag } from '../pipeline-serialization';
import { RenderView, ForwardPipeline, GFXColor, GFXCommandBuffer, GFXRect } from '../..';
import { ShadowType } from '../../renderer/scene/shadows';
import { shadowCollecting, lightCollecting } from '../forward/scene-culling';
import { RenderShadowMapBatchedQueue } from '../render-shadowMap-batched-queue';
import { Light } from 'cocos/core/renderer/scene';
import { Vec2 } from '../../math';
import { genSamplerHash, samplerLib } from '../../renderer';

const colors: GFXColor[] = [ { r: 1, g: 1, b: 1, a: 1 } ];
const bufs: GFXCommandBuffer[] = [];

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

    public static initInfo: IRenderFlowInfo = {
        name: PIPELINE_FLOW_SHADOW,
        priority: ForwardFlowPriority.SHADOW,
        tag: RenderFlowTag.SCENE,
    };

    private _shadowQueue!: RenderShadowMapBatchedQueue;
    private _renderArea: GFXRect = { x: 0, y: 0, width: 0, height: 0 };
    private _width: number = 0;
    private _height: number = 0;

    public render (view: RenderView) {
        const pipeline = this._pipeline as ForwardPipeline;
        const shadowInfo = pipeline.shadows;

        if (shadowInfo.type !== ShadowType.ShadowMap) { return; }

        const validLights = lightCollecting(view);
        this.init(pipeline, validLights);

        this.resizeShadowMap(shadowInfo.size, validLights);

        shadowCollecting(pipeline, view);
        for (let l = 0; l < validLights.length; l++) {
            const light = validLights[l];
            const frameBuffer = pipeline.shadowFrameBufferMap.get(light);
            this.draw(light, view, frameBuffer!);
        }
    }

    private init (pipeline: ForwardPipeline, validLights: Light[]) {
        if (!this._shadowQueue) { this._shadowQueue = new RenderShadowMapBatchedQueue(pipeline); }
        const device = pipeline.device;
        const shadowMapSize = pipeline.shadows.size;
        this._width = shadowMapSize.x;
        this._height = shadowMapSize.y;

        for (let l = 0; l < validLights.length; l++) {
            const light = validLights[l];

            if(!pipeline.shadowFrameBufferMap.has(light)) {
                const shadowRenderPass = device.createRenderPass({
                    colorAttachments: [{
                        format: GFXFormat.RGBA8,
                        loadOp: GFXLoadOp.CLEAR, // should clear color attachment
                        storeOp: GFXStoreOp.STORE,
                        sampleCount: 1,
                        beginLayout: GFXTextureLayout.UNDEFINED,
                        endLayout: GFXTextureLayout.PRESENT_SRC,
                    }],
                    depthStencilAttachment: {
                        format : device.depthStencilFormat,
                        depthLoadOp : GFXLoadOp.CLEAR,
                        depthStoreOp : GFXStoreOp.STORE,
                        stencilLoadOp : GFXLoadOp.CLEAR,
                        stencilStoreOp : GFXStoreOp.STORE,
                        sampleCount : 1,
                        beginLayout : GFXTextureLayout.UNDEFINED,
                        endLayout : GFXTextureLayout.DEPTH_STENCIL_ATTACHMENT_OPTIMAL,
                    },
                });

                const shadowRenderTargets: GFXTexture[] = [];
                shadowRenderTargets.push(device.createTexture({
                    type: GFXTextureType.TEX2D,
                    usage: GFXTextureUsageBit.COLOR_ATTACHMENT | GFXTextureUsageBit.SAMPLED,
                    format: GFXFormat.RGBA8,
                    width: this._width,
                    height: this._height,
                }));

                const depth = device.createTexture({
                    type: GFXTextureType.TEX2D,
                    usage: GFXTextureUsageBit.DEPTH_STENCIL_ATTACHMENT,
                    format: device.depthStencilFormat,
                    width: this._width,
                    height: this._height,
                });

                const frameBuffer = device.createFramebuffer({
                    renderPass: shadowRenderPass!,
                    colorTextures: shadowRenderTargets!,
                    depthStencilTexture: depth!,
                });

                pipeline.shadowFrameBufferMap.set(light, frameBuffer);
            }
        }
    }

    private resizeShadowMap (size: Vec2, validLights: Light[]) {
        if (this._width !== size.x || this._height !== size.y) {
            const width = size.x;
            const height = size.y;
            for (let i = 0; i < validLights.length; i++) {
                const light = validLights[i];
                const frameBuffer = (this._pipeline as ForwardPipeline).shadowFrameBufferMap.get(light);

                if (!frameBuffer) { break; }

                const renderTargets = frameBuffer.colorTextures;
                if (renderTargets && renderTargets.length > 0) {
                    for (let j = 0; j < renderTargets.length; j++) {
                        const renderTarget = renderTargets[j];
                        if (renderTarget) { renderTarget.resize(width, height); }
                    }
                }

                const depth = frameBuffer.depthStencilTexture;
                if (depth) {
                    depth.resize(width, height);
                }

                const shadowRenderPass = frameBuffer.renderPass;
                frameBuffer.destroy();
                frameBuffer.initialize({
                    renderPass: shadowRenderPass,
                    colorTextures: renderTargets,
                    depthStencilTexture: depth,
                });
            }

            this._width = width;
            this._height = height;
        }

        const shadowMapSamplerHash = genSamplerHash(_samplerInfo);
        const shadowMapSampler = samplerLib.getSampler(device, shadowMapSamplerHash);
        pipeline.descriptorSet.bindSampler(UNIFORM_SHADOWMAP.binding, shadowMapSampler);
        pipeline.descriptorSet.bindTexture(UNIFORM_SHADOWMAP.binding, this._shadowRenderTargets[0]);
    }

    private draw (light: Light, view: RenderView, frameBuffer: GFXFramebuffer) {
        const pipeline = this._pipeline as ForwardPipeline;
        const shadowInfo = pipeline.shadows;

        this._shadowQueue.gatherLightPasses(light);

        const camera = view.camera;

        const cmdBuff = pipeline.commandBuffers[0];

        const vp = camera.viewport;
        const shadowMapSize = shadowInfo.size;
        this._renderArea!.x = vp.x * shadowMapSize.x;
        this._renderArea!.y = vp.y * shadowMapSize.y;
        this._renderArea!.width =  vp.width * shadowMapSize.x * pipeline.shadingScale;
        this._renderArea!.height = vp.height * shadowMapSize.y * pipeline.shadingScale;

        const device = pipeline.device;
        const renderPass = frameBuffer.renderPass;

        cmdBuff.begin();
        cmdBuff.beginRenderPass(renderPass, frameBuffer, this._renderArea!,
            colors, camera.clearDepth, camera.clearStencil);

        cmdBuff.bindDescriptorSet(SetIndex.GLOBAL, pipeline.descriptorSet);

        this._shadowQueue.recordCommandBuffer(device, renderPass, cmdBuff);

        cmdBuff.endRenderPass();
        cmdBuff.end();

        bufs[0] = cmdBuff;
        device.queue.submit(bufs);
    }
}
