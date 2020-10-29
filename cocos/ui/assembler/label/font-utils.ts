/**
 * @packageDocumentation
 * @hidden
 */

import { FontAtlas } from '../../../core/assets/bitmap-font';
import { Color } from '../../../core/math';
import { ImageAsset, Texture2D } from '../../../core/assets';
import { Label } from '../../components';
import { PixelFormat } from '../../../core/assets/asset-enum';
import { GFXBufferTextureCopy } from '../../../core/gfx';
import { safeMeasureText, BASELINE_RATIO, MIDDLE_RATIO, getBaselineOffset } from '../../../core/utils';
import { director, Director } from '../../../core/director';

export interface ISharedLabelData {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D | null;
}

export class CanvasPool {
    public pool: ISharedLabelData[] = [];
    public get () {
        let data = this.pool.pop();

        if (!data) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            data = {
                canvas,
                context,
            };
        }

        return data;
    }

    public put (canvas: ISharedLabelData) {
        if (this.pool.length >= 32) {
            return;
        }
        this.pool.push(canvas);
    }
}

// export function packToDynamicAtlas(comp, frame) {
//     // TODO: Material API design and export from editor could affect the material activation process
//     // need to update the logic here
//     if (frame && !TEST) {
//         if (!frame._original && dynamicAtlasManager) {
//             let packedFrame = dynamicAtlasManager.insertSpriteFrame(frame);
//             if (packedFrame) {
//                 frame._setDynamicAtlasFrame(packedFrame);
//             }
//         }
//         if (comp.sharedMaterials[0].getProperty('texture') !== frame._texture) {
//             comp._activateMaterial();
//         }
//     }
// }

interface ILabelInfo {
    fontSize: number;
    lineHeight: number;
    hash: string;
    fontFamily: string;
    fontDesc: string;
    hAlign: number;
    vAlign: number;
    color: Color;
    isOutlined: boolean;
    out: Color;
    margin: number;
}

const WHITE = Color.WHITE.clone();
const space = 0;
const bleed = 2;

class FontLetterDefinition {
    public u = 0;
    public v = 0;
    public w = 0;
    public h = 0;
    public texture: LetterRenderTexture | null = null;
    public offsetX = 0;
    public offsetY = 0;
    public valid = false;
    public xAdvance = 0;
}

const _backgroundStyle = `rgba(255, 255, 255, ${(1 / 255).toFixed(3)})`;
const BASELINE_OFFSET = getBaselineOffset();

class LetterTexture {
    public image: ImageAsset | null = null;
    public labelInfo: ILabelInfo;
    public char: string;
    public data: ISharedLabelData | null  = null;
    public canvas: HTMLCanvasElement | null = null;
    public context: CanvasRenderingContext2D | null = null;
    public width = 0;
    public height = 0;
    public offsetY = 0;
    public hash: string;
    constructor (char: string, labelInfo: ILabelInfo) {
        this.char = char;
        this.labelInfo = labelInfo;
        this.hash = char.charCodeAt(0) + labelInfo.hash;
    }

    public updateRenderData () {
        this._updateProperties();
        this._updateTexture();
    }

    public destroy () {
        this.image = null;
        // Label._canvasPool.put(this._data);
    }

    private _updateProperties () {
        this.data = Label._canvasPool.get();
        this.canvas = this.data.canvas;
        this.context = this.data.context;
        if (this.context){
            this.context.font = this.labelInfo.fontDesc;
            const width = safeMeasureText(this.context, this.char, this.labelInfo.fontDesc);
            const blank = this.labelInfo.margin * 2 + bleed;
            this.width = parseFloat(width.toFixed(2)) + blank;
            this.height = (1 + BASELINE_RATIO) * this.labelInfo.fontSize + blank;
            this.offsetY = - (this.labelInfo.fontSize * BASELINE_RATIO) / 2;
        }

        if (this.canvas.width !== this.width) {
            this.canvas.width = this.width;
        }

        if (this.canvas.height !== this.height) {
            this.canvas.height = this.height;
        }

        if (!this.image) {
            this.image = new ImageAsset();
        }

        this.image.reset(this.canvas);
    }

    private _updateTexture () {
        if (!this.context || !this.canvas){
            return;
        }

        const context = this.context;
        const labelInfo = this.labelInfo;
        const width = this.canvas.width;
        const height = this.canvas.height;

        context.textAlign = 'center';
        context.textBaseline = 'alphabetic';
        context.clearRect(0, 0, width, height);
        // Add a white background to avoid black edges.
        context.fillStyle = _backgroundStyle;
        context.fillRect(0, 0, width, height);
        context.font = labelInfo.fontDesc;

        const fontSize = labelInfo.fontSize;
        const startX = width / 2;
        const startY = height / 2 + fontSize * MIDDLE_RATIO + fontSize * BASELINE_OFFSET;;
        const color = labelInfo.color;
        // use round for line join to avoid sharp intersect point
        context.lineJoin = 'round';
        context.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${1})`;
        if (labelInfo.isOutlined) {
            const strokeColor = labelInfo.out || WHITE;
            context.strokeStyle = `rgba(${strokeColor.r}, ${strokeColor.g}, ${strokeColor.b}, ${strokeColor.a / 255})`;
            context.lineWidth = labelInfo.margin * 2;
            context.strokeText(this.char, startX, startY);
        }
        context.fillText(this.char, startX, startY);

        // this.texture.handleLoadedTexture();
        // (this.image as Texture2D).updateImage();

    }
}

export class LetterRenderTexture extends Texture2D {
    /**
     * @en
     * Init the render texture with size.
     * @zh
     * 初始化 render texture。
     * @param [width]
     * @param [height]
     * @param [string]
     */
    public initWithSize (width: number, height: number, format: number = PixelFormat.RGBA8888) {
        this.reset({
            width,
            height,
            format,
        });
        this.loaded = true;
        this.emit('load');
    }

    /**
     * @en Draw a texture to the specified position
     * @zh 将指定的图片渲染到指定的位置上。
     * @param {Texture2D} image
     * @param {Number} x
     * @param {Number} y
     */
    public drawTextureAt (image: ImageAsset, x: number, y: number) {
        const gfxTexture = this.getGFXTexture();
        if (!image || !gfxTexture) {
            return;
        }

        const gfxDevice = this._getGFXDevice();
        if (!gfxDevice) {
            console.warn('Unable to get device');
            return;
        }

        const region = new GFXBufferTextureCopy();
        region.texOffset.x = x;
        region.texOffset.y = y;
        region.texExtent.width = image.width;
        region.texExtent.height = image.height;
        gfxDevice.copyTexImagesToTexture([image.data as HTMLCanvasElement], gfxTexture, [region]);
    }
}

export class LetterAtlas {
    get width () {
        return this._width;
    }

    get height () {
        return this._height;
    }

    private _x = space;
    private _y = space;
    private _nextY = space;
    private _width = 0;
    private _height = 0;
    private _halfBleed = 0;
    public declare fontDefDictionary: FontAtlas;
    private _dirty = false;

    constructor (width: number, height: number) {
        const texture = new LetterRenderTexture();
        texture.initWithSize(width, height);

        this.fontDefDictionary = new FontAtlas(texture);
        this._halfBleed = bleed/2;
        this._width = width;
        this._height = height;
        director.on(Director.EVENT_BEFORE_SCENE_LAUNCH, this.beforeSceneLoad, this);
    }

    public insertLetterTexture (letterTexture: LetterTexture) {
        const texture = letterTexture.image;
        const device = director.root!.device;
        if (!texture || !this.fontDefDictionary || !device) {
            return null;
        }

        const width = texture.width;
        const height = texture.height;

        if ((this._x + width + space) > this._width) {
            this._x = space;
            this._y = this._nextY;
        }

        if ((this._y + height) > this._nextY) {
            this._nextY = this._y + height + space;
        }

        if (this._nextY > this._height) {
            return null;
        }

        this.fontDefDictionary.texture.drawTextureAt(texture, this._x, this._y);

        this._dirty = true;

        const letterDefinition = new FontLetterDefinition();
        letterDefinition.u = this._x + this._halfBleed;
        letterDefinition.v = this._y + this._halfBleed;
        letterDefinition.texture = this.fontDefDictionary.texture;
        letterDefinition.valid = true;
        letterDefinition.w = letterTexture.width - bleed;
        letterDefinition.h = letterTexture.height - bleed;
        letterDefinition.xAdvance = letterDefinition.w;
        letterDefinition.offsetY = letterTexture.offsetY;

        this._x += width + space;
        this.fontDefDictionary.addLetterDefinitions(letterTexture.hash, letterDefinition);
        /*
        const region = new GFXBufferTextureCopy();
        region.texOffset.x = letterDefinition.offsetX;
        region.texOffset.y = letterDefinition.offsetY;
        region.texExtent.width = letterDefinition.w;
        region.texExtent.height = letterDefinition.h;
        */

        return letterDefinition;
    }

    public update () {
        if (!this._dirty) {
            return;
        }
        // this.texture.update();
        this._dirty = false;
    }

    public reset () {
        this._x = space;
        this._y = space;
        this._nextY = space;

        // const chars = this.letterDefinitions;
        // for (let i = 0, l = (Object.keys(chars)).length; i < l; i++) {
        //     const char = chars[i];
        //     if (!char.valid) {
        //         continue;
        //     }
        //     char.destroy();
        // }

        // this.letterDefinitions = createMap();
        this.fontDefDictionary.clear();
    }

    public destroy () {
        this.reset();
        if (this.fontDefDictionary){
            this.fontDefDictionary.texture.destroy();
            this.fontDefDictionary.texture = null;
        }
    }

    getTexture () {
        return this.fontDefDictionary.getTexture();
    }

    public beforeSceneLoad () {
        this.clearAllCache();
    }

    public clearAllCache () {
        this.destroy();

        const texture = new LetterRenderTexture();
        texture.initWithSize(this._width, this._height);

        this.fontDefDictionary.texture = texture;
    }

    public getLetter (key: string) {
        return this.fontDefDictionary.letterDefinitions[key];
    }

    public getLetterDefinitionForChar (char: string, labelInfo: ILabelInfo) {
        const hash = char.charCodeAt(0) + labelInfo.hash;
        let letter = this.fontDefDictionary.letterDefinitions[hash];
        if (!letter) {
            const temp = new LetterTexture(char, labelInfo);
            temp.updateRenderData();
            letter = this.insertLetterTexture(temp);
            temp.destroy();
        }

        return letter;
    }
}

export interface IShareLabelInfo {
    fontAtlas: FontAtlas | LetterAtlas | null;
    fontSize: number;
    lineHeight: number;
    hAlign: number;
    vAlign: number;
    hash: string;
    fontFamily: string;
    fontDesc: string;
    color: Color;
    isOutlined: boolean;
    out: Color;
    margin: number;
}

export const shareLabelInfo: IShareLabelInfo = {
    fontAtlas: null,
    fontSize:0,
    lineHeight:0,
    hAlign:0,
    vAlign:0,
    hash:'',
    fontFamily:'',
    fontDesc:'Arial',
    color: Color.WHITE.clone(),
    isOutlined:false,
    out: Color.WHITE.clone(),
    margin:0,
}

export function computeHash (labelInfo) {
    const hashData = '';
    const color = labelInfo.color.toHEX();
    let out = '';
    if (labelInfo.isOutlined && labelInfo.margin > 0) {
        out = out + labelInfo.margin + labelInfo.out.toHEX();
    }

    return hashData + labelInfo.fontSize + labelInfo.fontFamily + color + out;
}