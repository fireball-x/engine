import { Root } from '../../core/root';
import { GFXBuffer } from '../../gfx/buffer';
import { GFXBindingType, GFXBufferUsageBit, GFXMemoryUsageBit } from '../../gfx/define';
import { GFXRenderPass } from '../../gfx/render-pass';
import { RenderPassStage, UBOForwardLight } from '../define';
import { ToneMapFlow } from '../ppfx/tonemap-flow';
import { RenderPipeline } from '../render-pipeline';
import { RenderView } from '../render-view';
import { ForwardFlow } from './forward-flow';

export enum ForwardFlowPriority {
    FORWARD = 0,
}

const _idVec4Array = Float32Array.from([1, 1, 1, 0]);

export class ForwardPipeline extends RenderPipeline {

    protected _uboLights: UBOForwardLight = new UBOForwardLight();
    protected _lightsUBO: GFXBuffer | null = null;

    public get lightsUBO (): GFXBuffer {
        return this._lightsUBO!;
    }

    constructor (root: Root) {
        super(root);
    }

    public initialize (): boolean {

        if (!this.createShadingTarget()) {
            return false;
        }

        if (!this.createQuadInputAssembler()) {
            return false;
        }

        if (!this.createUBOs()) {
            return false;
        }

        const mainWindow = this._root.mainWindow;
        let windowPass: GFXRenderPass | null = null;

        if (mainWindow) {
            windowPass = mainWindow.renderPass;
        }

        if (!windowPass) {
            console.error('RenderPass of main window is null.');
            return false;
        }

        this.addRenderPass(RenderPassStage.DEFAULT, windowPass);

        // create flows
        this.createFlow(ForwardFlow, {
            name: 'ForwardFlow',
            priority: ForwardFlowPriority.FORWARD,
        });

        this.createFlow(ToneMapFlow, {
            name: 'ToneMapFlow',
            priority: 0,
        });

        return true;
    }

    public destroy () {
        this.destroyFlows();
        this.clearRenderPasses();
        this.destroyUBOs();
        this.destroyQuadInputAssembler();
        this.destroyShadingTarget();
    }

    protected createUBOs (): boolean {
        super.createUBOs();

        if (!this._globalBindings.get(UBOForwardLight.BLOCK.name)) {
            const lightsUBO = this._root.device.createBuffer({
                usage: GFXBufferUsageBit.UNIFORM | GFXBufferUsageBit.TRANSFER_DST,
                memUsage: GFXMemoryUsageBit.HOST | GFXMemoryUsageBit.DEVICE,
                size: UBOForwardLight.SIZE,
            });

            if (!lightsUBO) {
                return false;
            }

            this._globalBindings.set(UBOForwardLight.BLOCK.name, {
                type: GFXBindingType.UNIFORM_BUFFER,
                blockInfo: UBOForwardLight.BLOCK,
                buffer: lightsUBO,
            });
        }

        return true;
    }

    protected destroyUBOs () {
        super.destroyUBOs();

        const lightsUBO = this._globalBindings.get(UBOForwardLight.BLOCK.name);
        if (lightsUBO) {
            lightsUBO.buffer!.destroy();
            this._globalBindings.delete(UBOForwardLight.BLOCK.name);
        }
    }

    protected updateUBOs (view: RenderView) {
        super.updateUBOs(view);

        const scene = view.camera.scene;
        const dLights = scene.directionalLights;

        for (let i = 0; i < UBOForwardLight.MAX_DIR_LIGHTS; i++) {
            const light = dLights[i];
            if (light && light.enabled) {
                light.update();
                this._uboLights.view.set(light.directionArray, UBOForwardLight.DIR_LIGHT_DIR_OFFSET + i * 4);
                this._uboLights.view.set(light.color, UBOForwardLight.DIR_LIGHT_COLOR_OFFSET + i * 4);
            } else {
                this._uboLights.view.set(_idVec4Array, UBOForwardLight.DIR_LIGHT_DIR_OFFSET + i * 4);
                this._uboLights.view.set(_idVec4Array, UBOForwardLight.DIR_LIGHT_COLOR_OFFSET + i * 4);
            }
        }
        const pLights = scene.pointLights;
        for (let i = 0; i < UBOForwardLight.MAX_POINT_LIGHTS; i++) {
            const light = pLights[i];
            if (light && light.enabled) {
                light.update();
                this._uboLights.view.set(light.positionAndRange, UBOForwardLight.POINT_LIGHT_POS_RANGE_OFFSET + i * 4);
                this._uboLights.view.set(light.color, UBOForwardLight.POINT_LIGHT_COLOR_OFFSET + i * 4);
            } else {
                this._uboLights.view.set(_idVec4Array, UBOForwardLight.POINT_LIGHT_POS_RANGE_OFFSET + i * 4);
                this._uboLights.view.set(_idVec4Array, UBOForwardLight.POINT_LIGHT_COLOR_OFFSET + i * 4);
            }
        }
        const sLights = scene.spotLights;
        for (let i = 0; i < UBOForwardLight.MAX_SPOT_LIGHTS; i++) {
            const light = sLights[i];
            if (light && light.enabled) {
                light.update();
                this._uboLights.view.set(light.positionAndRange, UBOForwardLight.SPOT_LIGHT_POS_RANGE_OFFSET + i * 4);
                this._uboLights.view.set(light.directionArray, UBOForwardLight.SPOT_LIGHT_DIR_OFFSET + i * 4);
                this._uboLights.view.set(light.color, UBOForwardLight.SPOT_LIGHT_COLOR_OFFSET + i * 4);
            } else {
                this._uboLights.view.set(_idVec4Array, UBOForwardLight.SPOT_LIGHT_POS_RANGE_OFFSET + i * 4);
                this._uboLights.view.set(_idVec4Array, UBOForwardLight.SPOT_LIGHT_DIR_OFFSET + i * 4);
                this._uboLights.view.set(_idVec4Array, UBOForwardLight.SPOT_LIGHT_COLOR_OFFSET + i * 4);
            }
        }

        // update ubos
        this._globalBindings.get(UBOForwardLight.BLOCK.name)!.buffer!.update(this._uboLights.view);
    }
}
