/**
 * @packageDocumentation
 * @module pipeline
 */

import { Pass } from '../renderer/core/pass';
import { Model } from '../renderer/scene/model';
import { SubModel } from '../renderer/scene/submodel';
import { Layers } from '../scene-graph/layers';
import { legacyCC } from '../global-exports';
import { GFXBindingMappingInfo, GFXDescriptorType, GFXType, GFXShaderStageFlagBit,
    GFXDescriptorSetLayoutBinding, GFXUniform, GFXUniformBlock, GFXUniformSampler } from '../gfx';
import { Camera } from '../renderer/scene';

export const PIPELINE_FLOW_FORWARD: string = 'ForwardFlow';
export const PIPELINE_FLOW_SHADOW: string = 'ShadowFlow';
export const PIPELINE_FLOW_SMAA: string = 'SMAAFlow';
export const PIPELINE_FLOW_TONEMAP: string = 'ToneMapFlow';

/**
 * @en The predefined render pass stage ids
 * @zh 预设的渲染阶段。
 */
export enum RenderPassStage {
    DEFAULT = 100,
    UI = 200,
}
legacyCC.RenderPassStage = RenderPassStage;

/**
 * @en The predefined render priorities
 * @zh 预设的渲染优先级。
 */
export enum RenderPriority {
    MIN = 0,
    MAX = 0xff,
    DEFAULT = 0x80,
}

/**
 * @en Render object interface
 * @zh 渲染对象接口。
 */
export interface IRenderObject {
    model: Model;
    depth: number;
}

/*
 * @en The render pass interface
 * @zh 渲染过程接口。
 */
export interface IRenderPass {
    hash: number;
    depth: number;
    shaderId: number;
    subModel: SubModel;
    passIdx: number;
}

/**
 * @en Render batch interface
 * @zh 渲染批次接口。
 */
export interface IRenderBatch {
    pass: Pass;
}

/**
 * @en Render queue descriptor
 * @zh 渲染队列描述。
 */
export interface IRenderQueueDesc {
    isTransparent: boolean;
    phases: number;
    sortFunc: (a: IRenderPass, b: IRenderPass) => number;
}

export interface IDescriptorSetLayoutInfo {
    bindings: GFXDescriptorSetLayoutBinding[];
    layouts: Record<string, GFXUniformBlock | GFXUniformSampler>;
}

export const globalDescriptorSetLayout: IDescriptorSetLayoutInfo = { bindings: [], layouts: {} };
export const localDescriptorSetLayout: IDescriptorSetLayoutInfo = { bindings: [], layouts: {} };

/**
 * @en The uniform bindings
 * @zh Uniform 参数绑定。
 */
export enum PipelineGlobalBindings {
    UBO_GLOBAL,
    UBO_SHADOW,

    SAMPLER_ENVIRONMENT,
    SAMPLER_SHADOWMAP,

    COUNT,
}
const GLOBAL_UBO_COUNT = PipelineGlobalBindings.SAMPLER_ENVIRONMENT;
const GLOBAL_SAMPLER_COUNT = PipelineGlobalBindings.COUNT - GLOBAL_UBO_COUNT;

export enum ModelLocalBindings {
    UBO_LOCAL,
    UBO_FORWARD_LIGHTS,
    UBO_SKINNING_ANIMATION,
    UBO_SKINNING_TEXTURE,
    UBO_MORPH,

    SAMPLER_JOINTS,
    SAMPLER_MORPH_POSITION,
    SAMPLER_MORPH_NORMAL,
    SAMPLER_MORPH_TANGENT,
    SAMPLER_LIGHTMAP,
    SAMPLER_SPRITE,

    COUNT,
}
const LOCAL_UBO_COUNT = ModelLocalBindings.SAMPLER_JOINTS;
const LOCAL_SAMPLER_COUNT = ModelLocalBindings.COUNT - LOCAL_UBO_COUNT;

export enum SetIndex {
    GLOBAL,
    MATERIAL,
    LOCAL,
}
// parameters passed to GFXDevice
export const bindingMappingInfo = new GFXBindingMappingInfo();
bindingMappingInfo.bufferOffsets = [0, GLOBAL_UBO_COUNT + LOCAL_UBO_COUNT, GLOBAL_UBO_COUNT];
bindingMappingInfo.samplerOffsets = [-GLOBAL_UBO_COUNT, GLOBAL_SAMPLER_COUNT + LOCAL_SAMPLER_COUNT, GLOBAL_SAMPLER_COUNT - LOCAL_UBO_COUNT];
bindingMappingInfo.flexibleSet = 1;

/**
 * @en The global uniform buffer object
 * @zh 全局 UBO。
 */
export class UBOGlobal {

    public static readonly TIME_OFFSET = 0;
    public static readonly SCREEN_SIZE_OFFSET = UBOGlobal.TIME_OFFSET + 4;
    public static readonly SCREEN_SCALE_OFFSET = UBOGlobal.SCREEN_SIZE_OFFSET + 4;
    public static readonly NATIVE_SIZE_OFFSET = UBOGlobal.SCREEN_SCALE_OFFSET + 4;
    public static readonly MAT_VIEW_OFFSET = UBOGlobal.NATIVE_SIZE_OFFSET + 4;
    public static readonly MAT_VIEW_INV_OFFSET = UBOGlobal.MAT_VIEW_OFFSET + 16;
    public static readonly MAT_PROJ_OFFSET = UBOGlobal.MAT_VIEW_INV_OFFSET + 16;
    public static readonly MAT_PROJ_INV_OFFSET = UBOGlobal.MAT_PROJ_OFFSET + 16;
    public static readonly MAT_VIEW_PROJ_OFFSET = UBOGlobal.MAT_PROJ_INV_OFFSET + 16;
    public static readonly MAT_VIEW_PROJ_INV_OFFSET = UBOGlobal.MAT_VIEW_PROJ_OFFSET + 16;
    public static readonly CAMERA_POS_OFFSET = UBOGlobal.MAT_VIEW_PROJ_INV_OFFSET + 16;
    public static readonly EXPOSURE_OFFSET = UBOGlobal.CAMERA_POS_OFFSET + 4;
    public static readonly MAIN_LIT_DIR_OFFSET = UBOGlobal.EXPOSURE_OFFSET + 4;
    public static readonly MAIN_LIT_COLOR_OFFSET = UBOGlobal.MAIN_LIT_DIR_OFFSET + 4;
    public static readonly AMBIENT_SKY_OFFSET = UBOGlobal.MAIN_LIT_COLOR_OFFSET + 4;
    public static readonly AMBIENT_GROUND_OFFSET = UBOGlobal.AMBIENT_SKY_OFFSET + 4;
    public static readonly GLOBAL_FOG_COLOR_OFFSET = UBOGlobal.AMBIENT_GROUND_OFFSET + 4;
    public static readonly GLOBAL_FOG_BASE_OFFSET = UBOGlobal.GLOBAL_FOG_COLOR_OFFSET + 4;
    public static readonly GLOBAL_FOG_ADD_OFFSET = UBOGlobal.GLOBAL_FOG_BASE_OFFSET + 4;
    public static readonly COUNT = UBOGlobal.GLOBAL_FOG_ADD_OFFSET + 4;
    public static readonly SIZE = UBOGlobal.COUNT * 4;

    public static readonly NAME = 'CCGlobal';
    public static readonly BINDING = PipelineGlobalBindings.UBO_GLOBAL;
    public static readonly DESCRIPTOR = new GFXDescriptorSetLayoutBinding(GFXDescriptorType.UNIFORM_BUFFER, 1, GFXShaderStageFlagBit.ALL);
    public static readonly LAYOUT = new GFXUniformBlock(SetIndex.GLOBAL, UBOGlobal.BINDING, UBOGlobal.NAME, [
        new GFXUniform('cc_time', GFXType.FLOAT4, 1),
        new GFXUniform('cc_screenSize', GFXType.FLOAT4, 1),
        new GFXUniform('cc_screenScale', GFXType.FLOAT4, 1),
        new GFXUniform('cc_nativeSize', GFXType.FLOAT4, 1),
        new GFXUniform('cc_matView', GFXType.MAT4, 1),
        new GFXUniform('cc_matViewInv', GFXType.MAT4, 1),
        new GFXUniform('cc_matProj', GFXType.MAT4, 1),
        new GFXUniform('cc_matProjInv', GFXType.MAT4, 1),
        new GFXUniform('cc_matViewProj', GFXType.MAT4, 1),
        new GFXUniform('cc_matViewProjInv', GFXType.MAT4, 1),
        new GFXUniform('cc_cameraPos', GFXType.FLOAT4, 1),
        new GFXUniform('cc_exposure', GFXType.FLOAT4, 1),
        new GFXUniform('cc_mainLitDir', GFXType.FLOAT4, 1),
        new GFXUniform('cc_mainLitColor', GFXType.FLOAT4, 1),
        new GFXUniform('cc_ambientSky', GFXType.FLOAT4, 1),
        new GFXUniform('cc_ambientGround', GFXType.FLOAT4, 1),
        new GFXUniform('cc_fogColor', GFXType.FLOAT4, 1),
        new GFXUniform('cc_fogBase', GFXType.FLOAT4, 1),
        new GFXUniform('cc_fogAdd', GFXType.FLOAT4, 1),
    ], 1);
}
globalDescriptorSetLayout.layouts[UBOGlobal.NAME] = UBOGlobal.LAYOUT
globalDescriptorSetLayout.bindings[UBOGlobal.BINDING] = UBOGlobal.DESCRIPTOR;

/**
 * @en The uniform buffer object for shadow
 * @zh 阴影 UBO。
 */
export class UBOShadow {
    public static readonly MAT_LIGHT_PLANE_PROJ_OFFSET = 0;
    public static readonly MAT_LIGHT_VIEW_PROJ_OFFSET = UBOShadow.MAT_LIGHT_PLANE_PROJ_OFFSET + 16;
    public static readonly SHADOW_COLOR_OFFSET = UBOShadow.MAT_LIGHT_VIEW_PROJ_OFFSET + 16;
    public static readonly SHADOW_INFO_OFFSET: number = UBOShadow.SHADOW_COLOR_OFFSET + 4;
    public static readonly COUNT: number = UBOShadow.SHADOW_INFO_OFFSET + 4;
    public static readonly SIZE = UBOShadow.COUNT * 4;
    public static readonly NAME = 'CCShadow';
    public static readonly BINDING = PipelineGlobalBindings.UBO_SHADOW;
    public static readonly DESCRIPTOR = new GFXDescriptorSetLayoutBinding(GFXDescriptorType.UNIFORM_BUFFER, 1, GFXShaderStageFlagBit.ALL);
    public static readonly LAYOUT = new GFXUniformBlock(SetIndex.GLOBAL, UBOShadow.BINDING, UBOShadow.NAME, [
        new GFXUniform('cc_matLightPlaneProj', GFXType.MAT4, 1),
        new GFXUniform('cc_matLightViewProj', GFXType.MAT4, 1),
        new GFXUniform('cc_shadowColor', GFXType.FLOAT4, 1),
        new GFXUniform('cc_shadowInfo', GFXType.FLOAT4, 1),
    ], 1);
}
globalDescriptorSetLayout.layouts[UBOShadow.NAME] = UBOShadow.LAYOUT;
globalDescriptorSetLayout.bindings[UBOShadow.BINDING] = UBOShadow.DESCRIPTOR;

const UNIFORM_SHADOWMAP_NAME = 'cc_shadowMap';
export const UNIFORM_SHADOWMAP_BINDING = PipelineGlobalBindings.SAMPLER_SHADOWMAP;
const UNIFORM_SHADOWMAP_DESCRIPTOR = new GFXDescriptorSetLayoutBinding(GFXDescriptorType.SAMPLER, 1, GFXShaderStageFlagBit.FRAGMENT);
const UNIFORM_SHADOWMAP_LAYOUT = new GFXUniformSampler(SetIndex.GLOBAL, UNIFORM_SHADOWMAP_BINDING, UNIFORM_SHADOWMAP_NAME, GFXType.SAMPLER2D, 1);
globalDescriptorSetLayout.layouts[UNIFORM_SHADOWMAP_NAME] = UNIFORM_SHADOWMAP_LAYOUT;
globalDescriptorSetLayout.bindings[UNIFORM_SHADOWMAP_BINDING] = UNIFORM_SHADOWMAP_DESCRIPTOR;

const UNIFORM_ENVIRONMENT_NAME = 'cc_environment';
export const UNIFORM_ENVIRONMENT_BINDING = PipelineGlobalBindings.SAMPLER_ENVIRONMENT;
const UNIFORM_ENVIRONMENT_LAYOUT = new GFXUniformSampler(SetIndex.GLOBAL, UNIFORM_ENVIRONMENT_BINDING, UNIFORM_ENVIRONMENT_NAME, GFXType.SAMPLER_CUBE, 1);
const UNIFORM_ENVIRONMENT_DESCRIPTOR = new GFXDescriptorSetLayoutBinding(GFXDescriptorType.SAMPLER, 1, GFXShaderStageFlagBit.FRAGMENT);
globalDescriptorSetLayout.layouts[UNIFORM_ENVIRONMENT_NAME] = UNIFORM_ENVIRONMENT_LAYOUT;
globalDescriptorSetLayout.bindings[UNIFORM_ENVIRONMENT_BINDING] = UNIFORM_ENVIRONMENT_DESCRIPTOR;

/**
 * @en The local uniform buffer object
 * @zh 本地 UBO。
 */
export class UBOLocal {
    public static readonly MAT_WORLD_OFFSET = 0;
    public static readonly MAT_WORLD_IT_OFFSET = UBOLocal.MAT_WORLD_OFFSET + 16;
    public static readonly LIGHTINGMAP_UVPARAM = UBOLocal.MAT_WORLD_IT_OFFSET + 16;
    public static readonly COUNT = UBOLocal.LIGHTINGMAP_UVPARAM + 4;
    public static readonly SIZE = UBOLocal.COUNT * 4;

    public static readonly NAME = 'CCLocal';
    public static readonly BINDING = ModelLocalBindings.UBO_LOCAL;
    public static readonly DESCRIPTOR = new GFXDescriptorSetLayoutBinding(GFXDescriptorType.UNIFORM_BUFFER, 1, GFXShaderStageFlagBit.VERTEX);
    public static readonly LAYOUT = new GFXUniformBlock(SetIndex.LOCAL, UBOLocal.BINDING, UBOLocal.NAME, [
        new GFXUniform('cc_matWorld', GFXType.MAT4, 1),
        new GFXUniform('cc_matWorldIT', GFXType.MAT4, 1),
        new GFXUniform('cc_lightingMapUVParam', GFXType.FLOAT4, 1),
    ], 1);
}
localDescriptorSetLayout.layouts[UBOLocal.NAME] = UBOLocal.LAYOUT;
localDescriptorSetLayout.bindings[UBOLocal.BINDING] = UBOLocal.DESCRIPTOR;

export const INST_MAT_WORLD = 'a_matWorld0';

export class UBOLocalBatched {
    public static readonly BATCHING_COUNT = 10;
    public static readonly MAT_WORLDS_OFFSET = 0;
    public static readonly COUNT = 16 * UBOLocalBatched.BATCHING_COUNT;
    public static readonly SIZE = UBOLocalBatched.COUNT * 4;

    public static readonly NAME = 'CCLocalBatched';
    public static readonly BINDING = ModelLocalBindings.UBO_LOCAL;
    public static readonly DESCRIPTOR = new GFXDescriptorSetLayoutBinding(GFXDescriptorType.UNIFORM_BUFFER, 1, GFXShaderStageFlagBit.VERTEX);
    public static readonly LAYOUT = new GFXUniformBlock(SetIndex.LOCAL, UBOLocalBatched.BINDING, UBOLocalBatched.NAME, [
        new GFXUniform('cc_matWorlds', GFXType.MAT4, UBOLocalBatched.BATCHING_COUNT),
    ], 1);
}
localDescriptorSetLayout.layouts[UBOLocalBatched.NAME] = UBOLocalBatched.LAYOUT;
localDescriptorSetLayout.bindings[UBOLocalBatched.BINDING] = UBOLocalBatched.DESCRIPTOR;

/**
 * @en The uniform buffer object for forward lighting
 * @zh 前向灯光 UBO。
 */
export class UBOForwardLight {
    public static readonly LIGHTS_PER_PASS = 1;

    public static readonly LIGHT_POS_OFFSET = 0;
    public static readonly LIGHT_COLOR_OFFSET = UBOForwardLight.LIGHT_POS_OFFSET + UBOForwardLight.LIGHTS_PER_PASS * 4;
    public static readonly LIGHT_SIZE_RANGE_ANGLE_OFFSET = UBOForwardLight.LIGHT_COLOR_OFFSET + UBOForwardLight.LIGHTS_PER_PASS * 4;
    public static readonly LIGHT_DIR_OFFSET = UBOForwardLight.LIGHT_SIZE_RANGE_ANGLE_OFFSET + UBOForwardLight.LIGHTS_PER_PASS * 4;
    public static readonly COUNT = UBOForwardLight.LIGHT_DIR_OFFSET + UBOForwardLight.LIGHTS_PER_PASS * 4;
    public static readonly SIZE = UBOForwardLight.COUNT * 4;

    public static readonly NAME = 'CCForwardLight';
    public static readonly BINDING = ModelLocalBindings.UBO_FORWARD_LIGHTS;
    public static readonly DESCRIPTOR = new GFXDescriptorSetLayoutBinding(GFXDescriptorType.DYNAMIC_UNIFORM_BUFFER, 1, GFXShaderStageFlagBit.FRAGMENT);
    public static readonly LAYOUT = new GFXUniformBlock(SetIndex.LOCAL, UBOForwardLight.BINDING, UBOForwardLight.NAME, [
        new GFXUniform('cc_lightPos', GFXType.FLOAT4, UBOForwardLight.LIGHTS_PER_PASS),
        new GFXUniform('cc_lightColor', GFXType.FLOAT4, UBOForwardLight.LIGHTS_PER_PASS),
        new GFXUniform('cc_lightSizeRangeAngle', GFXType.FLOAT4, UBOForwardLight.LIGHTS_PER_PASS),
        new GFXUniform('cc_lightDir', GFXType.FLOAT4, UBOForwardLight.LIGHTS_PER_PASS),
    ], 1);
}
localDescriptorSetLayout.layouts[UBOForwardLight.NAME] = UBOForwardLight.LAYOUT;
localDescriptorSetLayout.bindings[UBOForwardLight.BINDING] = UBOForwardLight.DESCRIPTOR;

// The actual uniform vectors used is JointUniformCapacity * 3.
// We think this is a reasonable default capacity considering MAX_VERTEX_UNIFORM_VECTORS in WebGL spec is just 128.
// Skinning models with number of bones more than this capacity will be automatically switched to texture skinning.
// But still, you can tweak this for your own need by changing the number below
// and the JOINT_UNIFORM_CAPACITY macro in cc-skinning shader header.
export const JOINT_UNIFORM_CAPACITY = 30;

/**
 * @en The uniform buffer object for skinning texture
 * @zh 骨骼贴图 UBO。
 */
export class UBOSkinningTexture {
    public static readonly JOINTS_TEXTURE_INFO_OFFSET = 0;
    public static readonly COUNT = UBOSkinningTexture.JOINTS_TEXTURE_INFO_OFFSET + 4;
    public static readonly SIZE = UBOSkinningTexture.COUNT * 4;

    public static readonly NAME = 'CCSkinningTexture';
    public static readonly BINDING = ModelLocalBindings.UBO_SKINNING_TEXTURE;
    public static readonly DESCRIPTOR = new GFXDescriptorSetLayoutBinding(GFXDescriptorType.UNIFORM_BUFFER, 1, GFXShaderStageFlagBit.VERTEX);
    public static readonly LAYOUT = new GFXUniformBlock(SetIndex.LOCAL, UBOSkinningTexture.BINDING, UBOSkinningTexture.NAME, [
        new GFXUniform('cc_jointTextureInfo', GFXType.FLOAT4, 1),
    ], 1);
}
localDescriptorSetLayout.layouts[UBOSkinningTexture.NAME] = UBOSkinningTexture.LAYOUT;
localDescriptorSetLayout.bindings[UBOSkinningTexture.BINDING] = UBOSkinningTexture.DESCRIPTOR;

export class UBOSkinningAnimation {
    public static readonly JOINTS_ANIM_INFO_OFFSET = 0;
    public static readonly COUNT = UBOSkinningAnimation.JOINTS_ANIM_INFO_OFFSET + 4;
    public static readonly SIZE = UBOSkinningAnimation.COUNT * 4;

    public static readonly NAME = 'CCSkinningAnimation';
    public static readonly BINDING = ModelLocalBindings.UBO_SKINNING_ANIMATION;
    public static readonly DESCRIPTOR = new GFXDescriptorSetLayoutBinding(GFXDescriptorType.UNIFORM_BUFFER, 1, GFXShaderStageFlagBit.VERTEX);
    public static readonly LAYOUT = new GFXUniformBlock(SetIndex.LOCAL, UBOSkinningAnimation.BINDING, UBOSkinningAnimation.NAME, [
        new GFXUniform('cc_jointAnimInfo', GFXType.FLOAT4, 1),
    ], 1);
}
localDescriptorSetLayout.layouts[UBOSkinningAnimation.NAME] = UBOSkinningAnimation.LAYOUT;
localDescriptorSetLayout.bindings[UBOSkinningAnimation.BINDING] = UBOSkinningAnimation.DESCRIPTOR;

export const INST_JOINT_ANIM_INFO = 'a_jointAnimInfo';
export class UBOSkinning {
    public static readonly JOINTS_OFFSET = 0;
    public static readonly COUNT = UBOSkinning.JOINTS_OFFSET + JOINT_UNIFORM_CAPACITY * 12;
    public static readonly SIZE = UBOSkinning.COUNT * 4;

    public static readonly NAME = 'CCSkinning';
    public static readonly BINDING = ModelLocalBindings.UBO_SKINNING_TEXTURE;
    public static readonly DESCRIPTOR = new GFXDescriptorSetLayoutBinding(GFXDescriptorType.UNIFORM_BUFFER, 1, GFXShaderStageFlagBit.VERTEX);
    public static readonly LAYOUT = new GFXUniformBlock(SetIndex.LOCAL, UBOSkinning.BINDING, UBOSkinning.NAME, [
        new GFXUniform('cc_joints', GFXType.FLOAT4, JOINT_UNIFORM_CAPACITY * 3),
    ], 1);
}
localDescriptorSetLayout.layouts[UBOSkinning.NAME] = UBOSkinning.LAYOUT;
localDescriptorSetLayout.bindings[UBOSkinning.BINDING] = UBOSkinning.DESCRIPTOR;

/**
 * @en The uniform buffer object for morph setting
 * @zh 形变配置的 UBO
 */
export class UBOMorph {
    public static readonly MAX_MORPH_TARGET_COUNT = 60;
    public static readonly OFFSET_OF_WEIGHTS = 0;
    public static readonly OFFSET_OF_DISPLACEMENT_TEXTURE_WIDTH = 4 * UBOMorph.MAX_MORPH_TARGET_COUNT;
    public static readonly OFFSET_OF_DISPLACEMENT_TEXTURE_HEIGHT = UBOMorph.OFFSET_OF_DISPLACEMENT_TEXTURE_WIDTH + 4;
    public static readonly OFFSET_OF_VERTICES_COUNT = UBOMorph.OFFSET_OF_DISPLACEMENT_TEXTURE_HEIGHT + 4;
    public static readonly COUNT_BASE_4_BYTES = 4 * Math.ceil(UBOMorph.MAX_MORPH_TARGET_COUNT / 4) + 4;
    public static readonly SIZE = UBOMorph.COUNT_BASE_4_BYTES * 4;

    public static readonly NAME = 'CCMorph';
    public static readonly BINDING = ModelLocalBindings.UBO_MORPH;
    public static readonly DESCRIPTOR = new GFXDescriptorSetLayoutBinding(GFXDescriptorType.UNIFORM_BUFFER, 1, GFXShaderStageFlagBit.VERTEX);
    public static readonly LAYOUT = new GFXUniformBlock(SetIndex.LOCAL, UBOMorph.BINDING, UBOMorph.NAME, [
        new GFXUniform('cc_displacementWeights', GFXType.FLOAT4, UBOMorph.MAX_MORPH_TARGET_COUNT / 4),
        new GFXUniform('cc_displacementTextureInfo', GFXType.FLOAT4, 1),
    ], 1);
}
localDescriptorSetLayout.layouts[UBOMorph.NAME] = UBOMorph.LAYOUT;
localDescriptorSetLayout.bindings[UBOMorph.BINDING] = UBOMorph.DESCRIPTOR;

/**
 * @en The sampler for joint texture
 * @zh 骨骼纹理采样器。
 */
const UNIFORM_JOINT_TEXTURE_NAME = 'cc_jointTexture';
export const UNIFORM_JOINT_TEXTURE_BINDING = ModelLocalBindings.SAMPLER_JOINTS;
const UNIFORM_JOINT_TEXTURE_DESCRIPTOR = new GFXDescriptorSetLayoutBinding(GFXDescriptorType.SAMPLER, 1, GFXShaderStageFlagBit.VERTEX);
const UNIFORM_JOINT_TEXTURE_LAYOUT = new GFXUniformSampler(SetIndex.LOCAL, UNIFORM_JOINT_TEXTURE_BINDING, UNIFORM_JOINT_TEXTURE_NAME, GFXType.SAMPLER2D, 1);
localDescriptorSetLayout.layouts[UNIFORM_JOINT_TEXTURE_NAME] = UNIFORM_JOINT_TEXTURE_LAYOUT;
localDescriptorSetLayout.bindings[UNIFORM_JOINT_TEXTURE_BINDING] = UNIFORM_JOINT_TEXTURE_DESCRIPTOR;

/**
 * @en The sampler for morph texture of position
 * @zh 位置形变纹理采样器。
 */
const UNIFORM_POSITION_MORPH_TEXTURE_NAME = 'cc_PositionDisplacements';
export const UNIFORM_POSITION_MORPH_TEXTURE_BINDING = ModelLocalBindings.SAMPLER_MORPH_POSITION;
const UNIFORM_POSITION_MORPH_TEXTURE_DESCRIPTOR = new GFXDescriptorSetLayoutBinding(GFXDescriptorType.SAMPLER, 1, GFXShaderStageFlagBit.VERTEX);
const UNIFORM_POSITION_MORPH_TEXTURE_LAYOUT = new GFXUniformSampler(SetIndex.LOCAL, UNIFORM_POSITION_MORPH_TEXTURE_BINDING,
    UNIFORM_POSITION_MORPH_TEXTURE_NAME, GFXType.SAMPLER2D, 1);
localDescriptorSetLayout.layouts[UNIFORM_POSITION_MORPH_TEXTURE_NAME] = UNIFORM_POSITION_MORPH_TEXTURE_LAYOUT;
localDescriptorSetLayout.bindings[UNIFORM_POSITION_MORPH_TEXTURE_BINDING] = UNIFORM_POSITION_MORPH_TEXTURE_DESCRIPTOR;

/**
 * @en The sampler for morph texture of normal
 * @zh 法线形变纹理采样器。
 */
const UNIFORM_NORMAL_MORPH_TEXTURE_NAME = 'cc_NormalDisplacements';
export const UNIFORM_NORMAL_MORPH_TEXTURE_BINDING = ModelLocalBindings.SAMPLER_MORPH_NORMAL;
const UNIFORM_NORMAL_MORPH_TEXTURE_DESCRIPTOR = new GFXDescriptorSetLayoutBinding(GFXDescriptorType.SAMPLER, 1, GFXShaderStageFlagBit.VERTEX);
const UNIFORM_NORMAL_MORPH_TEXTURE_LAYOUT = new GFXUniformSampler(SetIndex.LOCAL, UNIFORM_NORMAL_MORPH_TEXTURE_BINDING,
    UNIFORM_NORMAL_MORPH_TEXTURE_NAME, GFXType.SAMPLER2D, 1);
localDescriptorSetLayout.layouts[UNIFORM_NORMAL_MORPH_TEXTURE_NAME] = UNIFORM_NORMAL_MORPH_TEXTURE_LAYOUT;
localDescriptorSetLayout.bindings[UNIFORM_NORMAL_MORPH_TEXTURE_BINDING] = UNIFORM_NORMAL_MORPH_TEXTURE_DESCRIPTOR;

/**
 * @en The sampler for morph texture of tangent
 * @zh 切线形变纹理采样器。
 */
const UNIFORM_TANGENT_MORPH_TEXTURE_NAME = 'cc_TangentDisplacements';
export const UNIFORM_TANGENT_MORPH_TEXTURE_BINDING = ModelLocalBindings.SAMPLER_MORPH_TANGENT;
const UNIFORM_TANGENT_MORPH_TEXTURE_DESCRIPTOR = new GFXDescriptorSetLayoutBinding(GFXDescriptorType.SAMPLER, 1, GFXShaderStageFlagBit.VERTEX);
const UNIFORM_TANGENT_MORPH_TEXTURE_LAYOUT = new GFXUniformSampler(SetIndex.LOCAL, UNIFORM_TANGENT_MORPH_TEXTURE_BINDING,
    UNIFORM_TANGENT_MORPH_TEXTURE_NAME, GFXType.SAMPLER2D, 1);
localDescriptorSetLayout.layouts[UNIFORM_TANGENT_MORPH_TEXTURE_NAME] = UNIFORM_TANGENT_MORPH_TEXTURE_LAYOUT;
localDescriptorSetLayout.bindings[UNIFORM_TANGENT_MORPH_TEXTURE_BINDING] = UNIFORM_TANGENT_MORPH_TEXTURE_DESCRIPTOR;

/**
 * @en The sampler for light map texture
 * @zh 光照图纹理采样器。
 */
const UNIFORM_LIGHTMAP_TEXTURE_NAME = 'cc_lightingMap';
export const UNIFORM_LIGHTMAP_TEXTURE_BINDING = ModelLocalBindings.SAMPLER_LIGHTMAP;
const UNIFORM_LIGHTMAP_TEXTURE_DESCRIPTOR = new GFXDescriptorSetLayoutBinding(GFXDescriptorType.SAMPLER, 1, GFXShaderStageFlagBit.FRAGMENT);
const UNIFORM_LIGHTMAP_TEXTURE_LAYOUT = new GFXUniformSampler(SetIndex.LOCAL, UNIFORM_LIGHTMAP_TEXTURE_BINDING,
    UNIFORM_LIGHTMAP_TEXTURE_NAME, GFXType.SAMPLER2D, 1);
localDescriptorSetLayout.layouts[UNIFORM_LIGHTMAP_TEXTURE_NAME] = UNIFORM_LIGHTMAP_TEXTURE_LAYOUT;
localDescriptorSetLayout.bindings[UNIFORM_LIGHTMAP_TEXTURE_BINDING] = UNIFORM_LIGHTMAP_TEXTURE_DESCRIPTOR;

/**
 * @en The sampler for UI sprites.
 * @zh UI 精灵纹理采样器。
 */
const UNIFORM_SPRITE_TEXTURE_NAME = 'cc_spriteTexture';
export const UNIFORM_SPRITE_TEXTURE_BINDING = ModelLocalBindings.SAMPLER_SPRITE;
const UNIFORM_SPRITE_TEXTURE_DESCRIPTOR = new GFXDescriptorSetLayoutBinding(GFXDescriptorType.SAMPLER, 1, GFXShaderStageFlagBit.FRAGMENT);
const UNIFORM_SPRITE_TEXTURE_LAYOUT = new GFXUniformSampler(SetIndex.LOCAL, UNIFORM_SPRITE_TEXTURE_BINDING, UNIFORM_SPRITE_TEXTURE_NAME, GFXType.SAMPLER2D, 1);
localDescriptorSetLayout.layouts[UNIFORM_SPRITE_TEXTURE_NAME] = UNIFORM_SPRITE_TEXTURE_LAYOUT;
localDescriptorSetLayout.bindings[UNIFORM_SPRITE_TEXTURE_BINDING] = UNIFORM_SPRITE_TEXTURE_DESCRIPTOR;

export const CAMERA_DEFAULT_MASK = Layers.makeMaskExclude([Layers.BitMask.UI_2D, Layers.BitMask.GIZMOS, Layers.BitMask.EDITOR,
    Layers.BitMask.SCENE_GIZMO, Layers.BitMask.PROFILER]);

export const CAMERA_EDITOR_MASK = Layers.makeMaskExclude([Layers.BitMask.UI_2D, Layers.BitMask.PROFILER]);

export const MODEL_ALWAYS_MASK = Layers.Enum.ALL;

/**
 * @en Render view information descriptor
 * @zh 渲染视图描述信息。
 */
export interface IRenderViewInfo {
    camera: Camera;
    name: string;
    priority: number;
    flows?: string[];
}
