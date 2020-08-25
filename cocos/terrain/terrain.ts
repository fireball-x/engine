/**
 * @category terrain
 */
import { builtinResMgr } from '../core/3d/builtin';
import { RenderableComponent } from '../core/3d/framework/renderable-component';
import { EffectAsset, Texture2D } from '../core/assets';
import { Filter, PixelFormat, WrapMode } from '../core/assets/asset-enum';
import { Material } from '../core/assets/material';
import { RenderingSubMesh } from '../core/assets/mesh';
import { Component } from '../core/components';
import { ccclass, disallowMultiple, executeInEditMode, help, property, visible, animatable, type } from '../core/data/class-decorator';
import { isValid } from '../core/data/object';
import { director } from '../core/director';
import { GFXBuffer } from '../core/gfx/buffer';
import { GFXAttributeName, GFXBufferUsageBit, GFXFormat, GFXMemoryUsageBit, GFXPrimitiveMode } from '../core/gfx/define';
import { GFXDevice } from '../core/gfx/device';
import { IGFXAttribute } from '../core/gfx/input-assembler';
import { clamp, Rect, Size, Vec2, Vec3, Vec4 } from '../core/math';
import { MacroRecord } from '../core/renderer/core/pass-utils';
import { Model } from '../core/renderer/scene/model';
import { Root } from '../core/root';
import { PrivateNode } from '../core/scene-graph/private-node';
import { HeightField } from './height-field';
import { legacyCC } from '../core/global-exports';
import { TerrainAsset, TerrainLayerInfo, TERRAIN_HEIGHT_BASE, TERRAIN_HEIGHT_FACTORY, TERRAIN_BLOCK_TILE_COMPLEXITY, TERRAIN_BLOCK_VERTEX_SIZE, TERRAIN_BLOCK_VERTEX_COMPLEXITY, TERRAIN_MAX_LAYER_COUNT, TERRAIN_HEIGHT_FMIN, TERRAIN_HEIGHT_FMAX, } from './terrain-asset';

/**
 * @en Terrain info
 * @zh 地形信息
 */
@ccclass('cc.TerrainInfo')
export class TerrainInfo {
    /**
     * @en tile size
     * @zh 栅格大小
     */
    @property
    public tileSize: number = 1;

    /**
     * @en block count
     * @zh 地形块的数量
     */
    @property
    public blockCount: number[] = [1, 1];

    /**
     * @en weight map size
     * @zh 权重图大小
     */
    @property
    public weightMapSize: number = 128;

    /**
     * @en light map size
     * @zh 光照图大小
     */
    @property
    public lightMapSize: number = 128;

    /**
     * @en terrain size
     * @zh 地形大小
     */
    public get size () {
        const sz = new Size(0, 0);
        sz.width = this.blockCount[0] * TERRAIN_BLOCK_TILE_COMPLEXITY * this.tileSize;
        sz.height = this.blockCount[1] * TERRAIN_BLOCK_TILE_COMPLEXITY * this.tileSize;

        return sz;
    }

    /**
     * @en tile count
     * @zh 栅格数量
     */
    public get tileCount () {
        const _tileCount = [0, 0];
        _tileCount[0] = this.blockCount[0] * TERRAIN_BLOCK_TILE_COMPLEXITY;
        _tileCount[1] = this.blockCount[1] * TERRAIN_BLOCK_TILE_COMPLEXITY;

        return _tileCount;
    }

    /**
     * @en vertex count
     * @zh 顶点数量
     */
    public get vertexCount () {
        const _vertexCount = this.tileCount;
        _vertexCount[0] += 1;
        _vertexCount[1] += 1;

        return _vertexCount;
    }
}

/**
 * @en Terrain layer
 * @zh 地形纹理层
 */
@ccclass('cc.TerrainLayer')
export class TerrainLayer {
    /**
     * @en detail texture
     * @zh 细节纹理
     */
    @property
    public detailMap: Texture2D|null = null;

    /**
     * @en tile size
     * @zh 平铺大小
     */
    @property
    public tileSize: number = 1;
}

/**
 * @en Terrain renderable
 * @zh 地形渲染组件
 */
class TerrainRenderable extends RenderableComponent {
    public _model: Model | null = null;
    public _meshData: RenderingSubMesh | null = null;

    public _brushMaterial: Material | null = null;
    public _currentMaterial: Material | null = null;
    public _currentMaterialLayers: number = 0;

    public destroy () {
        // this._invalidMaterial();
        if (this._model != null) {
            legacyCC.director.root.destroyModel(this._model);
            this._model = null;
        }

        return super.destroy();
    }

    public _invalidMaterial () {
        if (this._currentMaterial == null) {
            return;
        }

        this._clearMaterials();

        this._currentMaterial = null;
        if (this._model != null) {
            this._model.enabled = false;
        }
    }

    public _updateMaterial (block: TerrainBlock, init: boolean) {
        if (this._meshData == null || this._model == null) {
            return;
        }

        const nLayers = block.getMaxLayer();
        if (this._currentMaterial == null || nLayers !== this._currentMaterialLayers) {
            this._currentMaterial = new Material();

            this._currentMaterial.initialize({
                effectAsset: block.getTerrain().getEffectAsset(),
                defines: block._getMaterialDefines(nLayers),
            });

            if (this._brushMaterial !== null) {
                const passes = this._currentMaterial.passes;

                passes.push(this._brushMaterial.passes[0]);
            }

            if (init) {
                this._model.initSubModel(0, this._meshData, this._currentMaterial);
            }

            this.setMaterial(this._currentMaterial, 0);
            this._currentMaterialLayers = nLayers;
            this._model.enabled = true;
        }
    }

    public _onMaterialModified (idx: number, mtl: Material|null) {
        if (this._model == null) {
            return;
        }
        this._onRebuildPSO(idx, mtl || this._getBuiltinMaterial());
    }

    protected _onRebuildPSO (idx: number, material: Material) {
        if (this._model) {
            this._model.setSubModelMaterial(idx, material);
        }
    }

    protected _clearMaterials () {
        if (this._model == null) {
            return;
        }

        this._onMaterialModified(0, null);
    }

    private _getBuiltinMaterial () {
        return builtinResMgr.get<Material>('missing-material');
    }
}

/**
 * @en Terrain block info
 * @zh 地形块信息
 */
@ccclass('cc.TerrainBlockInfo')
export class TerrainBlockInfo {
    @property
    public layers: number[] = [-1, -1, -1, -1];
}

/**
 * @en Terrain block light map info
 * @zh 地形块光照图信息
 */
@ccclass('cc.TerrainBlockLightmapInfo')
export class TerrainBlockLightmapInfo {
    @property
    public texture: Texture2D|null = null;
    @property
    public UOff: number = 0;
    @property
    public VOff: number = 0;
    @property
    public UScale: number = 0;
    @property
    public VScale: number = 0;
}

/**
 * @en Terrain block
 * @zh 地形块
 */
export class TerrainBlock {
    private _terrain: Terrain;
    private _info: TerrainBlockInfo;
    private _node: PrivateNode;
    private _renderable: TerrainRenderable;
    private _index: number[] = [1, 1];
    // private _neighbor: TerrainBlock|null[] = [null, null, null, null];
    private _weightMap: Texture2D|null = null;
    private _lightmapInfo: TerrainBlockLightmapInfo|null = null;

    constructor (t: Terrain, i: number, j: number) {
        this._terrain = t;
        this._info = t.getBlockInfo(i, j);
        this._index[0] = i;
        this._index[1] = j;
        this._lightmapInfo = t._getLightmapInfo(i, j);

        this._node = new PrivateNode('');
        // @ts-ignore
        this._node.setParent(this._terrain.node);
        // @ts-ignore
        this._node._objFlags |= legacyCC.Object.Flags.DontSave;

        this._renderable = this._node.addComponent(TerrainRenderable) as TerrainRenderable;
    }

    public build () {
        const gfxDevice = director.root!.device as GFXDevice;

        // vertex buffer
        const vertexData = new Float32Array(TERRAIN_BLOCK_VERTEX_SIZE * TERRAIN_BLOCK_VERTEX_COMPLEXITY * TERRAIN_BLOCK_VERTEX_COMPLEXITY);
        let index = 0;
        for (let j = 0; j < TERRAIN_BLOCK_VERTEX_COMPLEXITY; ++j) {
            for (let i = 0; i < TERRAIN_BLOCK_VERTEX_COMPLEXITY; ++i) {
                const x = this._index[0] * TERRAIN_BLOCK_TILE_COMPLEXITY + i;
                const y = this._index[1] * TERRAIN_BLOCK_TILE_COMPLEXITY + j;
                const position = this._terrain.getPosition(x, y);
                const normal = this._terrain.getNormal(x, y);
                const uv = new Vec2(i / TERRAIN_BLOCK_TILE_COMPLEXITY, j / TERRAIN_BLOCK_TILE_COMPLEXITY);
                vertexData[index++] = position.x;
                vertexData[index++] = position.y;
                vertexData[index++] = position.z;
                vertexData[index++] = normal.x;
                vertexData[index++] = normal.y;
                vertexData[index++] = normal.z;
                vertexData[index++] = uv.x;
                vertexData[index++] = uv.y;
            }
        }

        const vertexBuffer = gfxDevice.createBuffer({
            usage: GFXBufferUsageBit.VERTEX | GFXBufferUsageBit.TRANSFER_DST,
            memUsage: GFXMemoryUsageBit.HOST | GFXMemoryUsageBit.DEVICE,
            size: TERRAIN_BLOCK_VERTEX_SIZE * Float32Array.BYTES_PER_ELEMENT * TERRAIN_BLOCK_VERTEX_COMPLEXITY * TERRAIN_BLOCK_VERTEX_COMPLEXITY,
            stride: TERRAIN_BLOCK_VERTEX_SIZE * Float32Array.BYTES_PER_ELEMENT,
        });
        vertexBuffer.update(vertexData);

        // initialize renderable
        const gfxAttributes: IGFXAttribute[] = [
            { name: GFXAttributeName.ATTR_POSITION, format: GFXFormat.RGB32F },
            { name: GFXAttributeName.ATTR_NORMAL, format: GFXFormat.RGB32F },
            { name: GFXAttributeName.ATTR_TEX_COORD, format: GFXFormat.RG32F },
        ];

        const subMesh = this._renderable._meshData = new RenderingSubMesh([vertexBuffer], gfxAttributes, GFXPrimitiveMode.TRIANGLE_LIST);
        subMesh.indexBuffer = this._terrain._getSharedIndexBuffer() || undefined;

        const model = this._renderable._model = (legacyCC.director.root as Root).createModel(Model);
        model.node = model.transform = this._node;
        this._renderable._getRenderScene().addModel(model);

        // reset weightmap
        this._updateWeightMap();

        // reset material
        this._updateMaterial(true);
    }

    public rebuild () {
        this._updateHeight();
        this._updateWeightMap();

        this._renderable._invalidMaterial();
        this._updateMaterial(false);
    }

    public destroy () {
        if (this._renderable != null) {
            this._renderable.destroy();
        }
        if (this._node != null) {
            this._node.destroy();
        }
        if (this._weightMap != null) {
            this._weightMap.destroy();
        }
    }

    public update () {
        this._updateMaterial(false);

        const mtl = this._renderable._currentMaterial;
        if (mtl != null) {
            const nlayers = this.getMaxLayer();
            const uvScale = new Vec4(1, 1, 1, 1);

            if (nlayers === 0) {
                if (this.layers[0] !== -1) {
                    const l0 = this._terrain.getLayer(this.layers[0]);

                    if (l0 != null) {
                        uvScale.x = 1.0 / l0.tileSize;
                    }

                    mtl.setProperty('detailMap0', l0 != null ? l0.detailMap : null);
                }
                else {
                    mtl.setProperty('detailMap0', legacyCC.builtinResMgr.get('default-texture'));
                }
            }
            else if (nlayers === 1) {
                const l0 = this._terrain.getLayer(this.layers[0]);
                const l1 = this._terrain.getLayer(this.layers[1]);

                if (l0 != null) {
                    uvScale.x = 1.0 / l0.tileSize;
                }
                if (l1 != null) {
                    uvScale.y = 1.0 / l1.tileSize;
                }

                mtl.setProperty('weightMap', this._weightMap);
                mtl.setProperty('detailMap0', l0 != null ? l0.detailMap : null);
                mtl.setProperty('detailMap1', l1 != null ? l1.detailMap : null);
            }
            else if (nlayers === 2) {
                const l0 = this._terrain.getLayer(this.layers[0]);
                const l1 = this._terrain.getLayer(this.layers[1]);
                const l2 = this._terrain.getLayer(this.layers[2]);

                if (l0 != null) {
                    uvScale.x = 1.0 / l0.tileSize;
                }
                if (l1 != null) {
                    uvScale.y = 1.0 / l1.tileSize;
                }
                if (l2 != null) {
                    uvScale.z = 1.0 / l2.tileSize;
                }

                mtl.setProperty('weightMap', this._weightMap);
                mtl.setProperty('detailMap0', l0 != null ? l0.detailMap : null);
                mtl.setProperty('detailMap1', l1 != null ? l1.detailMap : null);
                mtl.setProperty('detailMap2', l2 != null ? l2.detailMap : null);
            }
            else if (nlayers === 3) {
                const l0 = this._terrain.getLayer(this.layers[0]);
                const l1 = this._terrain.getLayer(this.layers[1]);
                const l2 = this._terrain.getLayer(this.layers[2]);
                const l3 = this._terrain.getLayer(this.layers[3]);

                if (l0 != null) {
                    uvScale.x = 1.0 / l0.tileSize;
                }
                if (l1 != null) {
                    uvScale.y = 1.0 / l1.tileSize;
                }
                if (l2 != null) {
                    uvScale.z = 1.0 / l2.tileSize;
                }
                if (l3 != null) {
                    uvScale.z = 1.0 / l3.tileSize;
                }

                mtl.setProperty('weightMap', this._weightMap);
                mtl.setProperty('detailMap0', l0 != null ? l0.detailMap : null);
                mtl.setProperty('detailMap1', l1 != null ? l1.detailMap : null);
                mtl.setProperty('detailMap2', l2 != null ? l2.detailMap : null);
                mtl.setProperty('detailMap3', l3 != null ? l3.detailMap : null);
            }

            mtl.setProperty('UVScale', uvScale);

            if (this.lightmap != null) {
                mtl.setProperty('lightMap', this.lightmap);
                mtl.setProperty('lightMapUVParam', this.lightmapUVParam);
            }
        }
    }

    public setBrushMaterial (mtl: Material|null) {
        if (this._renderable._brushMaterial !== mtl) {
            this._renderable._brushMaterial = mtl;
            this._renderable._invalidMaterial();
        }
    }

    /**
     * @en get layers
     * @zh 获得纹理层索引
     */
    get layers () {
        return this._info.layers;
    }

    /**
     * @en get light map
     * @zh 获得光照图
     */
    get lightmap () {
        return this._lightmapInfo ? this._lightmapInfo.texture : null;
    }

    /**
     * @en get light map uv parameter
     * @zh 获得光照图纹理坐标参数
     */
    get lightmapUVParam () {
        if (this._lightmapInfo != null) {
            return new Vec4(this._lightmapInfo.UOff, this._lightmapInfo.VOff, this._lightmapInfo.UScale, this._lightmapInfo.VScale);
        }
        else {
            return new Vec4(0, 0, 0, 0);
        }
    }

    /**
     * @en get terrain owner
     * @zh 获得地形对象
     */
    public getTerrain () {
        return this._terrain;
    }

    /**
     * @en get index
     * @zh 获得地形索引
     */
    public getIndex () {
        return this._index;
    }

    /**
     * @en get rect bound
     * @zh 获得地形矩形包围体
     */
    public getRect () {
        const rect = new Rect();
        rect.x = this._index[0] * TERRAIN_BLOCK_TILE_COMPLEXITY;
        rect.y = this._index[1] * TERRAIN_BLOCK_TILE_COMPLEXITY;
        rect.width = TERRAIN_BLOCK_TILE_COMPLEXITY;
        rect.height = TERRAIN_BLOCK_TILE_COMPLEXITY;

        return rect;
    }

    /**
     * @en set layer
     * @zh 设置纹理层
     */
    public setLayer (index: number, layerId: number) {
        if (this.layers[index] !== layerId) {
            this.layers[index] = layerId;
            this._renderable._invalidMaterial();
            this._updateMaterial(false);
        }
    }

    /**
     * @en get layer
     * @zh 获得纹理层
     */
    public getLayer (index: number) {
        return this.layers[index];
    }

    /**
     * @en get max layer index
     * @zh 获得最大纹理索引
     */
    public getMaxLayer () {
        if (this.layers[3] >= 0) {
            return 3;
        }
        else if (this.layers[2] >= 0) {
            return 2;
        }
        else if (this.layers[1] >= 0) {
            return 1;
        }
        else {
            return 0;
        }
    }

    public _getMaterialDefines (nlayers: number): MacroRecord {
        if (this.lightmap != null) {
            if (nlayers === 0) {
                return { LAYERS: 1, LIGHT_MAP: 1 };
            }
            else if (nlayers === 1) {
                return { LAYERS: 2, LIGHT_MAP: 1 };
            }
            else if (nlayers === 2) {
                return { LAYERS: 3, LIGHT_MAP: 1 };
            }
            else if (nlayers === 3) {
                return { LAYERS: 4, LIGHT_MAP: 1 };
            }
        }
        else {
            if (nlayers === 0) {
                return { LAYERS: 1 };
            }
            else if (nlayers === 1) {
                return { LAYERS: 2 };
            }
            else if (nlayers === 2) {
                return { LAYERS: 3 };
            }
            else if (nlayers === 3) {
                return { LAYERS: 4 };
            }
        }

        return { LAYERS: 0 };
    }

    public _invalidMaterial () {
        this._renderable._invalidMaterial();
    }

    public _updateMaterial (init: boolean) {
        this._renderable._updateMaterial(this, init);
    }

    public _updateHeight () {
        if (this._renderable._meshData == null) {
            return;
        }

        const vertexData = new Float32Array(TERRAIN_BLOCK_VERTEX_SIZE * TERRAIN_BLOCK_VERTEX_COMPLEXITY * TERRAIN_BLOCK_VERTEX_COMPLEXITY);

        let index = 0;
        for (let j = 0; j < TERRAIN_BLOCK_VERTEX_COMPLEXITY; ++j) {
            for (let i = 0; i < TERRAIN_BLOCK_VERTEX_COMPLEXITY; ++i) {
                const x = this._index[0] * TERRAIN_BLOCK_TILE_COMPLEXITY + i;
                const y = this._index[1] * TERRAIN_BLOCK_TILE_COMPLEXITY + j;

                const position = this._terrain.getPosition(x, y);
                const normal = this._terrain.getNormal(x, y);
                const uv = new Vec2(i / TERRAIN_BLOCK_VERTEX_COMPLEXITY, j / TERRAIN_BLOCK_VERTEX_COMPLEXITY);

                vertexData[index++] = position.x;
                vertexData[index++] = position.y;
                vertexData[index++] = position.z;
                vertexData[index++] = normal.x;
                vertexData[index++] = normal.y;
                vertexData[index++] = normal.z;
                vertexData[index++] = uv.x;
                vertexData[index++] = uv.y;
            }
        }

        this._renderable._meshData.vertexBuffers[0].update(vertexData);
    }

    public _updateWeightMap () {
        const nlayers = this.getMaxLayer();

        if (nlayers === 0) {
            if (this._weightMap != null) {
                this._weightMap.destroy();
                this._weightMap = null;
            }

            return;
        }
        else {
            if (this._weightMap == null) {
                this._weightMap = new Texture2D();
                this._weightMap.create(this._terrain.weightMapSize, this._terrain.weightMapSize, PixelFormat.RGBA8888);
                this._weightMap.setFilters(Filter.LINEAR, Filter.LINEAR);
                this._weightMap.setWrapMode(WrapMode.CLAMP_TO_EDGE, WrapMode.CLAMP_TO_EDGE);
            }
        }

        const weightData = new Uint8Array(this._terrain.weightMapSize * this._terrain.weightMapSize * 4);
        let weightIndex = 0;
        for (let j = 0; j < this._terrain.weightMapSize; ++j) {
            for (let i = 0; i < this._terrain.weightMapSize; ++i) {
                const x = this._index[0] * this._terrain.weightMapSize + i;
                const y = this._index[1] * this._terrain.weightMapSize + j;
                const w = this._terrain.getWeight(x, y);

                weightData[weightIndex * 4 + 0] = Math.floor(w.x * 255);
                weightData[weightIndex * 4 + 1] = Math.floor(w.y * 255);
                weightData[weightIndex * 4 + 2] = Math.floor(w.z * 255);
                weightData[weightIndex * 4 + 3] = Math.floor(w.w * 255);

                weightIndex += 1;
            }
        }
        this._weightMap.uploadData(weightData);
    }

    public _updateLightmap (info: TerrainBlockLightmapInfo) {
        this._lightmapInfo = info;
        this._invalidMaterial();
    }
}

/**
 * @en Terrain
 * @zh 地形组件
 */
@ccclass('cc.Terrain')
@help('i18n:cc.TerrainComponent')
@executeInEditMode
@disallowMultiple
export class Terrain extends Component {
    @type(TerrainAsset)
    @animatable(false)
    @visible(false)
    protected __asset: TerrainAsset|null = null;

    @type(EffectAsset)
    @animatable(false)
    @visible(false)
    protected _effectAsset: EffectAsset|null = null;

    @type(TerrainLayer)
    @animatable(false)
    @visible(true)
    protected _layers: (TerrainLayer|null)[] = [];

    @property
    @animatable(false)
    @visible(false)
    protected _blockInfos: TerrainBlockInfo[] = [];

    @property
    @animatable(false)
    @visible(false)
    protected _lightmapInfos: TerrainBlockLightmapInfo[] = [];

    protected _tileSize: number = 1;
    protected _blockCount: number[] = [1, 1];
    protected _weightMapSize: number = 128;
    protected _lightMapSize: number = 128;
    protected _heights: Uint16Array = new Uint16Array();
    protected _weights: Uint8Array = new Uint8Array();
    protected _normals: number[] = [];
    protected _blocks: TerrainBlock[] = [];
    protected _sharedIndexBuffer: GFXBuffer|null = null;

    constructor () {
        super();

        // initialize layers
        for (let i = 0; i < TERRAIN_MAX_LAYER_COUNT; ++i) {
            this._layers.push(null);
        }
    }

    @type(TerrainAsset)
    @visible(true)
    public set _asset (value: TerrainAsset|null) {
        if (this.__asset !== value) {
            this.__asset = value;
            if (this.__asset != null && this.valid) {
                // rebuild
                for (const block of this._blocks) {
                    block.destroy();
                }
                this._blocks = [];
                this._blockInfos = [];
                this._buildImp();
            }
        }
    }

    public get _asset () {
        return this.__asset;
    }

    /**
     * @en Terrain effect asset
     * @zh 地形特效资源
     */
    @type(EffectAsset)
    @visible(true)
    public set effectAsset (value) {
        if (this._effectAsset === value) {
            return;
        }

        this._effectAsset = value;
        for (const i of this._blocks) {
            i._invalidMaterial();
        }
    }

    public get effectAsset () {
        return this._effectAsset;
    }

    /**
     * @en get terrain size
     * @zh 获得地形大小
     */
    public get size () {
        const sz = new Size(0, 0);
        sz.width = this.blockCount[0] * TERRAIN_BLOCK_TILE_COMPLEXITY * this.tileSize;
        sz.height = this.blockCount[1] * TERRAIN_BLOCK_TILE_COMPLEXITY * this.tileSize;
        return sz;
    }

    /**
     * @en get tile size
     * @zh 获得栅格大小
     */
    get tileSize () {
        return this._tileSize;
    }

    /**
     * @en get tile count
     * @zh 获得栅格数量
     */
    public get tileCount () {
        return [this.blockCount[0] * TERRAIN_BLOCK_TILE_COMPLEXITY, this.blockCount[1] * TERRAIN_BLOCK_TILE_COMPLEXITY];
    }

    /**
     * @en get vertex count
     * @zh 获得顶点数量
     */
    public get vertexCount () {
        const _vertexCount = this.tileCount;
        _vertexCount[0] += 1;
        _vertexCount[1] += 1;

        return _vertexCount;
    }

    /**
     * @en get block count
     * @zh 获得地形块数量
     */
    get blockCount () {
        return this._blockCount;
    }

    /**
     * @en get light map size
     * @zh 获得光照图大小
     */
    get lightMapSize () {
        return this._lightMapSize;
    }

    /**
     * @en get weight map size
     * @zh 获得权重图大小
     */
    get weightMapSize () {
        return this._weightMapSize;
    }

    /**
     * @en get height buffer
     * @zh 获得高度缓存
     */
    get heights () {
        return this._heights;
    }

    /**
     * @en get weight buffer
     * @zh 获得权重缓存
     */
    get weights () {
        return this._weights;
    }

    /**
     * @en check valid
     * @zh 检测是否有效
     */
    get valid () {
        return this._blocks.length > 0;
    }

    /**
     * @en get terrain info
     * @zh 获得地形信息
     */
    @type(TerrainInfo)
    @visible(true)
    public get info () {
        const ti = new TerrainInfo();
        ti.tileSize = this.tileSize;
        ti.blockCount[0] = this.blockCount[0];
        ti.blockCount[1] = this.blockCount[1];
        ti.weightMapSize = this.weightMapSize;
        ti.lightMapSize = this.lightMapSize;

        return ti;
    }

    /**
     * @en build
     * @zh 构建地形
     */
    public build (info: TerrainInfo) {
        this._tileSize = info.tileSize;
        this._blockCount[0] = info.blockCount[0];
        this._blockCount[1] = info.blockCount[1];
        this._weightMapSize = info.weightMapSize;
        this._lightMapSize = info.lightMapSize;

        return this._buildImp();
    }

    /**
     * @en rebuild
     * @zh 重建地形
     */
    public rebuild (info: TerrainInfo) {
        // build block info
        const blockInfos: TerrainBlockInfo[] = [];
        for (let i = 0; i < info.blockCount[0] * info.blockCount[1]; ++i) {
            blockInfos.push(new TerrainBlockInfo());
        }

        const w = Math.min(this._blockCount[0], info.blockCount[0]);
        const h = Math.min(this._blockCount[1], info.blockCount[1]);
        for (let j = 0; j < h; ++j) {
            for (let i = 0; i < w; ++i) {
                const index0 = j * info.blockCount[0] + i;
                const index1 = j * this.blockCount[0] + i;

                blockInfos[index0] = this._blockInfos[index1];
            }
        }

        this._blockInfos = blockInfos;

        for (const block of this._blocks) {
            block.destroy();
        }
        this._blocks = [];

        // build heights
        this._rebuildHeights(info);

        // build weights
        this._rebuildWeights(info);

        // update info
        this._tileSize = info.tileSize;
        this._blockCount[0] = info.blockCount[0];
        this._blockCount[1] = info.blockCount[1];
        this._weightMapSize = info.weightMapSize;
        this._lightMapSize = info.lightMapSize;

        // build blocks
        this._buildNormals();

        for (let j = 0; j < this._blockCount[1]; ++j) {
            for (let i = 0; i < this._blockCount[0]; ++i) {
                this._blocks.push(new TerrainBlock(this, i, j));
            }
        }

        for (const i of this._blocks) {
            i.build();
        }
    }

    /**
     * @en import height field
     * @zh 导入高度图
     */
    public importHeightField (hf: HeightField, heightScale: number) {
        let index = 0;
        for (let j = 0; j < this.vertexCount[1]; ++j) {
            for (let i = 0; i < this.vertexCount[0]; ++i) {
                const u = i / this.tileCount[0];
                const v = j / this.tileCount[1];

                const h = hf.getAt(u * hf.w, v * hf.h) * heightScale;

                this._heights[index++] = h;
            }
        }

        this._buildNormals();

        // rebuild all blocks
        for (const i of this._blocks) {
            i._updateHeight();
        }
    }

    /**
     * @en export height field
     * @zh 导出高度图
     */
    public exportHeightField (hf: HeightField, heightScale: number) {
        let index = 0;
        for (let j = 0; j < hf.h; ++j) {
            for (let i = 0; i < hf.w; ++i) {
                const u = i / (hf.w - 1);
                const v = j / (hf.h - 1);

                const x = u * this.size.width;
                const y = v * this.size.height;

                const h = this.getHeightAt(x, y);
                if (h != null) {
                    hf.data[index++] = h * heightScale;
                }
            }
        }
    }

    public exportAsset () {
        const asset = new TerrainAsset();

        asset.tileSize = this.tileSize;
        asset.blockCount = this.blockCount;
        asset.lightMapSize = this.lightMapSize;
        asset.weightMapSize = this.weightMapSize;
        asset.heights = this.heights;
        asset.weights = this.weights;

        asset.layerBuffer = new Array<number>(this._blocks.length * 4);
        for (let i = 0; i < this._blocks.length; ++i) {
            asset.layerBuffer[i * 4 + 0] = this._blocks[i].layers[0];
            asset.layerBuffer[i * 4 + 1] = this._blocks[i].layers[1];
            asset.layerBuffer[i * 4 + 2] = this._blocks[i].layers[2];
            asset.layerBuffer[i * 4 + 3] = this._blocks[i].layers[3];
        }

        for (let i = 0; i < this._layers.length; ++i) {
            const temp = this._layers[i];
            if (temp && temp.detailMap && isValid(temp.detailMap)) {
                const layer = new TerrainLayerInfo();
                layer.slot = i;
                layer.tileSize = temp.tileSize;
                layer.detailMap = temp.detailMap._uuid;
                asset.layerInfos.push(layer);
            }
        }

        return asset;
    }

    public getEffectAsset () {
        if (this._effectAsset === null) {
            return legacyCC.EffectAsset.get('builtin-terrain');
        }
        else {
            return this._effectAsset;
        }
    }

    public onLoad () {
        const gfxDevice = legacyCC.director.root.device as GFXDevice;

        // initialize shared index buffer
        const indexData = new Uint16Array(TERRAIN_BLOCK_TILE_COMPLEXITY * TERRAIN_BLOCK_TILE_COMPLEXITY * 6);

        let index = 0;
        for (let j = 0; j < TERRAIN_BLOCK_TILE_COMPLEXITY; ++j) {
            for (let i = 0; i < TERRAIN_BLOCK_TILE_COMPLEXITY; ++i) {
                const a = j * TERRAIN_BLOCK_VERTEX_COMPLEXITY + i;
                const b = j * TERRAIN_BLOCK_VERTEX_COMPLEXITY + i + 1;
                const c = (j + 1) * TERRAIN_BLOCK_VERTEX_COMPLEXITY + i;
                const d = (j + 1) * TERRAIN_BLOCK_VERTEX_COMPLEXITY + i + 1;

                // face 1
                indexData[index++] = a;
                indexData[index++] = c;
                indexData[index++] = b;

                // face 2
                indexData[index++] = b;
                indexData[index++] = c;
                indexData[index++] = d;
            }
        }

        this._sharedIndexBuffer = gfxDevice.createBuffer({
            usage: GFXBufferUsageBit.INDEX | GFXBufferUsageBit.TRANSFER_DST,
            memUsage: GFXMemoryUsageBit.HOST | GFXMemoryUsageBit.DEVICE,
            size: Uint16Array.BYTES_PER_ELEMENT * TERRAIN_BLOCK_TILE_COMPLEXITY * TERRAIN_BLOCK_TILE_COMPLEXITY * 6,
            stride: Uint16Array.BYTES_PER_ELEMENT,
        });
        this._sharedIndexBuffer.update(indexData);
    }

    public onEnable () {
        if (this._blocks.length === 0) {
            this._buildImp();
        }
    }

    public onDisable () {
        for (const i of this._blocks) {
            i.destroy();
        }
        this._blocks = [];
    }

    public onDestroy () {
        for (let i = 0; i < this._layers.length; ++i) {
            this._layers[i] = null;
        }

        if (this._sharedIndexBuffer != null) {
            this._sharedIndexBuffer.destroy();
        }
    }

    public onRestore () {
        this.onDisable();
        this.onLoad();
        this._buildImp(true);
    }

    public update (deltaTime: number) {
        for (const i of this._blocks) {
            i.update();
        }
    }

    /**
     * @en add layer
     * @zh 添加纹理层
     */
    public addLayer (layer: TerrainLayer) {
        for (let i = 0; i < this._layers.length; ++i) {
            if (this._layers[i] == null) {
                this._layers[i] = layer;
                return i;
            }
        }

        return -1;
    }

    /**
     * @en set layer
     * @zh 设置纹理层
     */
    public setLayer (i: number, layer: TerrainLayer) {
        this._layers[i] = layer;
    }

    /**
     * @en remove layer
     * @zh 移除纹理层
     */
    public removeLayer (id: number) {
        this._layers[id] = null;
    }

    /**
     * @en get layer
     * @zh 获得纹理层
     */
    public getLayer (id: number) {
        if (id === -1) {
            return null;
        }

        return this._layers[id];

    }

    /**
     * @en get position
     * @zh 获得地形上的位置
     */
    public getPosition (i: number, j: number) {
        const x = i * this._tileSize;
        const z = j * this._tileSize;
        const y = this.getHeight(i, j);

        return new Vec3(x, y, z);
    }

    public getHeightField () {
        return this._heights;
    }

    /**
     * @en set height
     * @zh 设置地形上的高度
     */
    public setHeight (i: number, j: number, h: number) {
        h = clamp(h, TERRAIN_HEIGHT_FMIN, TERRAIN_HEIGHT_FMAX);
        this._heights[j * this.vertexCount[0] + i] = TERRAIN_HEIGHT_BASE + h / TERRAIN_HEIGHT_FACTORY;
    }

    /**
     * @en get height
     * @zh 获得地形上的高度
     */
    public getHeight (i: number, j: number) {
        return (this._heights[j * this.vertexCount[0] + i] - TERRAIN_HEIGHT_BASE) * TERRAIN_HEIGHT_FACTORY;
    }

    /**
     * @en set height
     * @zh 设置高度
     */
    public getHeightClamp (i: number, j: number) {
        i = clamp(i, 0, this.vertexCount[0] - 1);
        j = clamp(j, 0, this.vertexCount[1] - 1);

        return this.getHeight(i, j);
    }

    /**
     * @en get height by point
     * @zh 根据点的坐标获得高度
     */
    public getHeightAt (x: number, y: number) {
        const fx = x / this.tileSize;
        const fy = y / this.tileSize;

        let ix0 = Math.floor(fx);
        let iz0 = Math.floor(fy);
        let ix1 = ix0 + 1;
        let iz1 = iz0 + 1;
        const dx = fx - ix0;
        const dz = fy - iz0;

        if (ix0 < 0 || ix0 > this.vertexCount[0] - 1 || iz0 < 0 || iz0 > this.vertexCount[1] - 1) {
            return null;
        }

        ix0 = clamp(ix0, 0, this.vertexCount[0] - 1);
        iz0 = clamp(iz0, 0, this.vertexCount[1] - 1);
        ix1 = clamp(ix1, 0, this.vertexCount[0] - 1);
        iz1 = clamp(iz1, 0, this.vertexCount[1] - 1);

        let a = this.getHeight(ix0, iz0);
        const b = this.getHeight(ix1, iz0);
        const c = this.getHeight(ix0, iz1);
        let d = this.getHeight(ix1, iz1);
        const m = (b + c) * 0.5;

        if (dx + dz <= 1.0) {
            d = m + (m - a);
        }
        else {
            a = m + (m - d);
        }

        const h1 = a * (1.0 - dx) + b * dx;
        const h2 = c * (1.0 - dx) + d * dx;

        const h = h1 * (1.0 - dz) + h2 * dz;

        return h;
    }

    public _setNormal (i: number, j: number, n: Vec3) {
        const index = j * this.vertexCount[0] + i;

        this._normals[index * 3 + 0] = n.x;
        this._normals[index * 3 + 1] = n.y;
        this._normals[index * 3 + 2] = n.z;
    }

    /**
     * @en get normal
     * @zh 获得法线
     */
    public getNormal (i: number, j: number) {
        const index = j * this.vertexCount[0] + i;

        const n = new Vec3();
        n.x = this._normals[index * 3 + 0];
        n.y = this._normals[index * 3 + 1];
        n.z = this._normals[index * 3 + 2];

        return n;
    }

    /**
     * @en get normal by point
     * @zh 根据点的坐标获得法线
     */
    public getNormalAt (x: number, y: number) {
        const fx = x / this.tileSize;
        const fy = y / this.tileSize;

        let ix0 = Math.floor(fx);
        let iz0 = Math.floor(fy);
        let ix1 = ix0 + 1;
        let iz1 = iz0 + 1;
        const dx = fx - ix0;
        const dz = fy - iz0;

        if (ix0 < 0 || ix0 > this.vertexCount[0] - 1 || iz0 < 0 || iz0 > this.vertexCount[1] - 1) {
            return null;
        }

        ix0 = clamp(ix0, 0, this.vertexCount[0] - 1);
        iz0 = clamp(iz0, 0, this.vertexCount[1] - 1);
        ix1 = clamp(ix1, 0, this.vertexCount[0] - 1);
        iz1 = clamp(iz1, 0, this.vertexCount[1] - 1);

        const a = this.getNormal(ix0, iz0);
        const b = this.getNormal(ix1, iz0);
        const c = this.getNormal(ix0, iz1);
        const d = this.getNormal(ix1, iz1);
        const m = new Vec3();
        Vec3.add(m, b, c).multiplyScalar(0.5);

        if (dx + dz <= 1.0) {
            // d = m + (m - a);
            d.set(m);
            d.subtract(a);
            d.add(m);
        }
        else {
            // a = m + (m - d);
            a.set(m);
            a.subtract(d);
            a.add(m);
        }

        const n1 = new Vec3();
        const n2 = new Vec3();
        const n = new Vec3();
        Vec3.lerp(n1, a, b, dx);
        Vec3.lerp(n2, c, d, dx);
        Vec3.lerp(n, n1, n2, dz);

        return n;
    }

    /**
     * @en set weight
     * @zh 设置权重
     */
    public setWeight (i: number, j: number, w: Vec4) {
        const index = j * this._weightMapSize * this._blockCount[0] + i;

        this._weights[index * 4 + 0] = w.x * 255;
        this._weights[index * 4 + 1] = w.y * 255;
        this._weights[index * 4 + 2] = w.z * 255;
        this._weights[index * 4 + 3] = w.w * 255;
    }

    /**
     * @en get weight
     * @zh 获得权重
     */
    public getWeight (i: number, j: number) {
        const index = j * this._weightMapSize * this._blockCount[0] + i;

        const w = new Vec4();
        w.x = this._weights[index * 4 + 0] / 255.0;
        w.y = this._weights[index * 4 + 1] / 255.0;
        w.z = this._weights[index * 4 + 2] / 255.0;
        w.w = this._weights[index * 4 + 3] / 255.0;

        return w;
    }

    /**
     * @en get normal by point
     * @zh 根据点的坐标获得权重
     */
    public getWeightAt (x: number, y: number) {
        const fx = x / this.tileSize;
        const fy = y / this.tileSize;

        let ix0 = Math.floor(fx);
        let iz0 = Math.floor(fy);
        let ix1 = ix0 + 1;
        let iz1 = iz0 + 1;
        const dx = fx - ix0;
        const dz = fy - iz0;

        if (ix0 < 0 || ix0 > this.vertexCount[0] - 1 || iz0 < 0 || iz0 > this.vertexCount[1] - 1) {
            return null;
        }

        ix0 = clamp(ix0, 0, this.vertexCount[0] - 1);
        iz0 = clamp(iz0, 0, this.vertexCount[1] - 1);
        ix1 = clamp(ix1, 0, this.vertexCount[0] - 1);
        iz1 = clamp(iz1, 0, this.vertexCount[1] - 1);

        let a = this.getWeight(ix0, iz0);
        const b = this.getWeight(ix1, iz0);
        const c = this.getWeight(ix0, iz1);
        let d = this.getWeight(ix1, iz1);
        const m = new Vec4();
        Vec4.add(m, b, c).multiplyScalar(0.5);

        if (dx + dz <= 1.0) {
            d = new Vec4();
            Vec4.subtract(d, m, a).add(m);
        }
        else {
            a = new Vec4();
            Vec4.subtract(a, m, d).add(m);
        }

        const n1 = new Vec4();
        const n2 = new Vec4();
        const n = new Vec4();
        Vec4.lerp(n1, a, b, dx);
        Vec4.lerp(n2, c, d, dx);
        Vec4.lerp(n, n1, n2, dz);

        return n;
    }

    /**
     * @en get block info
     * @zh 获得地形块信息
     */
    public getBlockInfo (i: number, j: number) {
        return this._blockInfos[j * this._blockCount[0] + i];
    }

    /**
     * @en get block
     * @zh 获得地形块对象
     */
    public getBlock (i: number, j: number) {
        return this._blocks[j * this._blockCount[0] + i];
    }

    /**
     * @en get all blocks
     * @zh 获得地形块缓存
     */
    public getBlocks () {
        return this._blocks;
    }

    /**
     * @en ray check
     * @param start ray start
     * @param dir ray direction
     * @param step ray step
     * @param worldSpace is world space
     * @zh 射线检测
     * @param start 射线原点
     * @param dir 射线方向
     * @param step 射线步长
     * @param worldSpace 是否在世界空间
     */
    public rayCheck (start: Vec3, dir: Vec3, step: number, worldSpace: boolean = true) {
        const MAX_COUNT = 2000;

        const trace = start;
        if (worldSpace) {
            Vec3.subtract(trace, start, this.node.getWorldPosition());
        }

        const delta = new Vec3();
        delta.set(dir);
        delta.multiplyScalar(step);

        let position: Vec3|null = null;

        if (dir.equals(new Vec3(0, 1, 0))) {
            const y = this.getHeightAt(trace.x, trace.z);
            if (y != null && trace.y <= y) {
                position = new Vec3(trace.x, y, trace.z);
            }
        }
        else if (dir.equals(new Vec3(0, -1, 0))) {
            const y = this.getHeightAt(trace.x, trace.z);
            if (y != null && trace.y >= y) {
                position = new Vec3(trace.x, y, trace.z);
            }
        }
        else {
            let i = 0;

            // 优先大步进查找
            while (i++ < MAX_COUNT) {
                const y = this.getHeightAt(trace.x, trace.z);
                if (y != null && trace.y <= y) {
                    break;
                }

                trace.add(dir);
            }

            // 穷举法
            while (i++ < MAX_COUNT) {
                const y = this.getHeightAt(trace.x, trace.z);
                if (y != null && trace.y <= y) {
                    position = new Vec3(trace.x, y, trace.z);
                    break;
                }

                trace.add(delta);
            }
        }

        return position;
    }

    public _getSharedIndexBuffer () {
        return this._sharedIndexBuffer;
    }

    public _resetLightmap (enble: boolean) {
        this._lightmapInfos.length = 0;
        if (enble) {
            for (let i = 0; i < this._blockCount[0] * this._blockCount[1]; ++i) {
                this._lightmapInfos.push(new TerrainBlockLightmapInfo());
            }
        }
    }

    public _updateLightmap (blockId: number, tex: Texture2D|null, uOff: number, vOff: number, uScale: number, vScale: number) {
        this._lightmapInfos[blockId].texture = tex;
        this._lightmapInfos[blockId].UOff = uOff;
        this._lightmapInfos[blockId].VOff = vOff;
        this._lightmapInfos[blockId].UScale = uScale;
        this._lightmapInfos[blockId].VScale = vScale;
        this._blocks[blockId]._updateLightmap(this._lightmapInfos[blockId]);
    }

    public _getLightmapInfo (i: number, j: number) {
        const index = j * this._blockCount[0] + i;
        return index < this._lightmapInfos.length ? this._lightmapInfos[index] : null;
    }

    public _calcNormal (x: number, z: number) {
        let flip = 1;
        const here = this.getPosition(x, z);
        let right: Vec3;
        let up: Vec3;

        if (x < this.vertexCount[0] - 1) {
            right = this.getPosition(x + 1, z);
        }
        else {
            flip *= -1;
            right = this.getPosition(x - 1, z);
        }

        if (z < this.vertexCount[1] - 1) {
            up = this.getPosition(x, z + 1);
        }
        else {
            flip *= -1;
            up = this.getPosition(x, z - 1);
        }

        right.subtract(here);
        up.subtract(here);

        const normal = new Vec3();
        normal.set(up);
        normal.cross(right);
        normal.multiplyScalar(flip);
        normal.normalize();

        return normal;
    }

    public _buildNormals () {
        let index = 0;
        for (let y = 0; y < this.vertexCount[1]; ++y) {
            for (let x = 0; x < this.vertexCount[0]; ++x) {
                const n = this._calcNormal(x, y);

                this._normals[index * 3 + 0] = n.x;
                this._normals[index * 3 + 1] = n.y;
                this._normals[index * 3 + 2] = n.z;
                index += 1;
            }
        }
    }

    private _buildImp (restore: boolean = false) {
        if (this.valid) {
            return true;
        }

        if (!restore && this.__asset != null) {
            this._tileSize = this.__asset.tileSize;
            this._blockCount = this.__asset.blockCount;
            this._weightMapSize = this.__asset.weightMapSize;
            this._lightMapSize = this.__asset.lightMapSize;
            this._heights = this.__asset.heights;
            this._weights = this.__asset.weights;

            // build layers
            let initial = true;
            for (let i = 0; i < this._layers.length; ++i) {
                if (this._layers[i] != null) {
                    initial = false;
                }
            }

            if (initial && this._asset != null) {
                for (const i of this._asset.layerInfos) {
                    const layer = new TerrainLayer();
                    layer.tileSize = i.tileSize;
                    legacyCC.loader.loadRes(i.detailMap, Texture2D, (err, asset) => {
                        layer.detailMap = asset;
                    });

                    this._layers[i.slot] = layer;
                }
            }
        }

        if (this._blockCount[0] === 0 || this._blockCount[1] === 0) {
            return false;
        }

        // build heights & normals
        const vertexCount = this.vertexCount[0] * this.vertexCount[1];
        if (this._heights === null || this._heights.length !== vertexCount) {
            this._heights = new Uint16Array(vertexCount);
            this._normals = new Array<number>(vertexCount * 3);

            for (let i = 0; i < vertexCount; ++i) {
                this._heights[i] = TERRAIN_HEIGHT_BASE;
                this._normals[i * 3 + 0] = 0;
                this._normals[i * 3 + 1] = 1;
                this._normals[i * 3 + 2] = 0;
            }
        }
        else {
            this._normals = new Array<number>(vertexCount * 3);
            this._buildNormals();
        }

        // build weights
        const weightMapComplexityU = this._weightMapSize * this._blockCount[0];
        const weightMapComplexityV = this._weightMapSize * this._blockCount[1];
        if (this._weights.length !== weightMapComplexityU * weightMapComplexityV * 4) {
            this._weights = new Uint8Array(weightMapComplexityU * weightMapComplexityV * 4);
            for (let i = 0; i < weightMapComplexityU * weightMapComplexityV; ++i) {
                this._weights[i * 4 + 0] = 255;
                this._weights[i * 4 + 1] = 0;
                this._weights[i * 4 + 2] = 0;
                this._weights[i * 4 + 3] = 0;
            }
        }

        // build blocks
        if (this._blockInfos.length !== this._blockCount[0] * this._blockCount[1]) {
            this._blockInfos = [];
            for (let j = 0; j < this._blockCount[1]; ++j) {
                for (let i = 0; i < this._blockCount[0]; ++i) {
                    const info = new TerrainBlockInfo();
                    if (this._asset != null) {
                        info.layers[0] = this._asset.getLayer(i, j, 0);

                        info.layers[1] = this._asset.getLayer(i, j, 1);
                        if (info.layers[1] === info.layers[0]) {
                            info.layers[1] = -1;
                        }

                        info.layers[2] = this._asset.getLayer(i, j, 2);
                        if (info.layers[2] === info.layers[0]) {
                            info.layers[2] = -1;
                        }

                        info.layers[3] = this._asset.getLayer(i, j, 3);
                        if (info.layers[3] === info.layers[0]) {
                            info.layers[3] = -1;
                        }
                    }

                    this._blockInfos.push(info);
                }
            }
        }

        for (let j = 0; j < this._blockCount[1]; ++j) {
            for (let i = 0; i < this._blockCount[0]; ++i) {
                this._blocks.push(new TerrainBlock(this, i, j));
            }
        }

        for (const i of this._blocks) {
            i.build();
        }
    }

    private _rebuildHeights (info: TerrainInfo) {
        if (this.vertexCount[0] === info.vertexCount[0] &&
            this.vertexCount[1] === info.vertexCount[1]) {
            return false;
        }

        const heights = new Uint16Array(info.vertexCount[0] * info.vertexCount[1]);
        for (let i = 0; i < heights.length; ++i) {
            heights[i] = TERRAIN_HEIGHT_BASE;
        }

        const w = Math.min(this.vertexCount[0], info.vertexCount[0]);
        const h = Math.min(this.vertexCount[1], info.vertexCount[1]);

        for (let j = 0; j < h; ++j) {
            for (let i = 0; i < w; ++i) {
                const index0 = j * info.vertexCount[0] + i;
                const index1 = j * this.vertexCount[0] + i;

                heights[index0] = this._heights[index1];
            }
        }

        this._heights = heights;

        return true;
    }

    private _rebuildWeights (info: TerrainInfo) {
        const oldWeightMapSize = this._weightMapSize;
        const oldWeightMapComplexityU = this._weightMapSize * this._blockCount[0];
        const oldWeightMapComplexityV = this._weightMapSize * this._blockCount[1];

        const weightMapComplexityU = info.weightMapSize * info.blockCount[0];
        const weightMapComplexityV = info.weightMapSize * info.blockCount[1];

        if (weightMapComplexityU === oldWeightMapComplexityU &&
            weightMapComplexityV === oldWeightMapComplexityV) {
            return false;
        }

        const weights = new Uint8Array(weightMapComplexityU * weightMapComplexityV * 4);

        for (let i = 0; i < weightMapComplexityU * weightMapComplexityV; ++i) {
            weights[i * 4 + 0] = 255;
            weights[i * 4 + 1] = 0;
            weights[i * 4 + 2] = 0;
            weights[i * 4 + 3] = 0;
        }

        const w = Math.min(info.blockCount[0], this._blockCount[0]);
        const h = Math.min(info.blockCount[1], this._blockCount[1]);

        // get weight
        const getOldWeight = (_i: number, _j: number, _weights: Uint8Array) => {
            const index = _j * oldWeightMapComplexityU + _i;

            const weight = new Vec4();
            weight.x = _weights[index * 4 + 0] / 255.0;
            weight.y = _weights[index * 4 + 1] / 255.0;
            weight.z = _weights[index * 4 + 2] / 255.0;
            weight.w = _weights[index * 4 + 3] / 255.0;

            return weight;
        };

        // sample weight
        const sampleOldWeight = (_x: number, _y: number, _xOff: number, _yOff: number, _weights: Uint8Array) => {
            const ix0 = Math.floor(_x);
            const iz0 = Math.floor(_y);
            const ix1 = ix0 + 1;
            const iz1 = iz0 + 1;
            const dx = _x - ix0;
            const dz = _y - iz0;

            const a = getOldWeight(ix0 + _xOff, iz0 + _yOff, this._weights);
            const b = getOldWeight(ix1 + _xOff, iz0 + _yOff, this._weights);
            const c = getOldWeight(ix0 + _xOff, iz1 + _yOff, this._weights);
            const d = getOldWeight(ix1 + _xOff, iz1 + _yOff, this._weights);
            const m = new Vec4();
            Vec4.add(m, b, c).multiplyScalar(0.5);

            if (dx + dz <= 1.0) {
                d.set(m);
                d.subtract(a);
                d.add(m);
            }
            else {
                a.set(m);
                a.subtract(d);
                a.add(m);
            }

            const n1 = new Vec4();
            const n2 = new Vec4();
            const n = new Vec4();
            Vec4.lerp(n1, a, b, dx);
            Vec4.lerp(n2, c, d, dx);
            Vec4.lerp(n, n1, n2, dz);

            return n;
        };

        // fill new weights
        for (let j = 0; j < h; ++j) {
            for (let i = 0; i < w; ++i) {
                const uOff = i * oldWeightMapSize;
                const vOff = j * oldWeightMapSize;

                for (let v = 0; v < info.weightMapSize; ++v) {
                    for (let u = 0; u < info.weightMapSize; ++u) {
                        // tslint:disable-next-line: no-shadowed-variable
                        let w: Vec4;
                        if (info.weightMapSize === oldWeightMapSize) {
                            w = getOldWeight(u + uOff, v + vOff, this._weights);
                        }
                        else {
                            const x = u / (info.weightMapSize - 1) * (oldWeightMapSize - 1);
                            const y = v / (info.weightMapSize - 1) * (oldWeightMapSize - 1);
                            w = sampleOldWeight(x, y, uOff, vOff, this._weights);
                        }

                        const du = i * info.weightMapSize + u;
                        const dv = j * info.weightMapSize + v;
                        const index = dv * weightMapComplexityU + du;

                        weights[index * 4 + 0] = w.x * 255;
                        weights[index * 4 + 1] = w.y * 255;
                        weights[index * 4 + 2] = w.z * 255;
                        weights[index * 4 + 3] = w.w * 255;
                    }
                }
            }
        }

        this._weights = weights;

        return true;
    }
}
