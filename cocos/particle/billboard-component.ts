
/**
 * @category particle
 */

import { ccclass, property, executeInEditMode, menu } from "../core/data/class-decorator";
import { Material, Mesh, Texture2D } from "../core/assets";
import { createMesh } from "../core/3d/misc/utils";
import { GFXPrimitiveMode, GFXAttributeName, GFXFormat } from "../core/gfx";
import { Model } from "../core/renderer/scene/model";
import { builtinResMgr } from "../core/3d/builtin";
import { Component } from "../core/components/component";
import { Color, toRadian, toDegree, Vec4 } from "../core/math";

createMesh

@ccclass('cc.BillboardComponent')
@menu('Components/Billboard')
@executeInEditMode
export class BillboardComponent extends Component {

    @property({
        type: Texture2D,
    })
    private _texture = null;

    /**
     * @zh Billboard纹理。
     */
    @property({
        type: Texture2D,
    })
    get texture () {
        return this._texture;
    }

    set texture (val) {
        this._texture = val;
        if (this._material) {
            this._material.setProperty('mainTexture', val);
        }
    }

    @property
    private _height = 0;

    /**
     * @zh 高度。
     */
    @property
    get height () {
        return this._height;
    }

    set height (val) {
        this._height = val;
        if (this._material) {
            this._uniform.y = val;
            this._material.setProperty('cc_size_rotation', this._uniform);
        }
    }

    @property
    private _width = 0;

    /**
     * @zh 宽度。
     */
    @property
    public get width () {
        return this._width;
    }

    public set width (val) {
        this._width = val;
        if (this._material) {
            this._uniform.x = val;
            this._material.setProperty('cc_size_rotation', this._uniform);
        }
    }

    @property
    private _rotation = 0;

    /**
     * @zh 角度。
     */
    @property
    public get rotation () {
        return Math.round(toDegree(this._rotation) * 100) / 100;
    }

    public set rotation (val) {
        this._rotation = toRadian(val);
        if (this._material) {
            this._uniform.z = this._rotation;
            this._material.setProperty('cc_size_rotation', this._uniform);
        }
    }

    private _model: Model | null = null;

    private _mesh: Mesh | null = null;

    private _material: Material | null = null;

    private _uniform = new Vec4(1, 1, 0, 0);

    constructor () {
        super();
    }

    public onEnable () {
        if (!this._model) {
            this.createModel();
        }
        this._model!.enabled = true;
        this.width = this._width;
        this.height = this._height;
        this.rotation = this.rotation;
        this.texture = this.texture;
    }

    public onDisable () {
        if (this._model) {
            this._model.enabled = false;
        }
    }

    private createModel () {
        this._mesh = createMesh({
            primitiveMode: GFXPrimitiveMode.TRIANGLE_LIST,
            positions: [0, 0, 0,
                0, 0, 0,
                0, 0, 0,
                0, 0, 0],
            uvs: [0, 0,
                1, 0,
                0, 1,
                1, 1],
            colors: [
                Color.WHITE.r, Color.WHITE.g, Color.WHITE.b, Color.WHITE.a,
                Color.WHITE.r, Color.WHITE.g, Color.WHITE.b, Color.WHITE.a,
                Color.WHITE.r, Color.WHITE.g, Color.WHITE.b, Color.WHITE.a,
                Color.WHITE.r, Color.WHITE.g, Color.WHITE.b, Color.WHITE.a],
            attributes: [
                { name: GFXAttributeName.ATTR_POSITION, format: GFXFormat.RGB32F },
                { name: GFXAttributeName.ATTR_TEX_COORD, format: GFXFormat.RG32F },
                { name: GFXAttributeName.ATTR_COLOR, format: GFXFormat.RGBA8UI, isNormalized: true },
            ],
            indices: [0, 1, 2, 1, 2, 3],
        }, undefined, { calculateBounds: false });
        this._model = this._getRenderScene().createModel(Model, this.node);
        if (this._material == null) {
            this._material = new Material();
            this._material.copy(builtinResMgr.get<Material>('default-billboard-material'));
        }
        this._model.initSubModel(0, this._mesh.getSubMesh(0), this._material!);
    }
}
