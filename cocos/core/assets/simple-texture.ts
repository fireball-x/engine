/**
 * @packageDocumentation
 * @module asset
 */

import { ccclass } from 'cc.decorator';
import { TextureFlagBit, TextureUsageBit, API } from '../gfx/define';
import { Texture, TextureInfo, Device, BufferTextureCopy } from '../gfx';
import { error } from '../platform/debug';
import { Filter } from './asset-enum';
import { ImageAsset } from './image-asset';
import { TextureBase } from './texture-base';
import { DEV } from 'internal:constants';
import { legacyCC } from '../global-exports';
import { macro } from '../platform/macro';

const _regions: BufferTextureCopy[] = [new BufferTextureCopy()];

export type PresumedGFXTextureInfo = Pick<TextureInfo, 'usage' | 'flags' | 'format' | 'levelCount'>;

function getMipLevel (width: number, height: number) {
    let size = Math.max(width, height);
    let level = 0;
    while (size) { size >>= 1; level++; }
    return level;
}

function isPOT (n: number) { return n && (n & (n - 1)) === 0; }
function canGenerateMipmap (device: Device, w: number, h: number) {
    const needCheckPOT = device.gfxAPI === API.WEBGL;
    if (needCheckPOT) { return isPOT(w) && isPOT(h); }
    return true;
}

/**
 * @en The simple texture base class.
 * It create the GFX Texture and can set mipmap levels.
 * @zh 简单贴图基类。
 * 简单贴图内部创建了 GFX 贴图和该贴图上的 GFX 贴图视图。
 * 简单贴图允许指定不同的 Mipmap 层级。
 */
@ccclass('cc.SimpleTexture')
export class SimpleTexture extends TextureBase {
    protected _gfxTexture: Texture | null = null;
    private _mipmapLevel = 1;

    /**
     * @en The mipmap level of the texture
     * @zh 贴图中的 Mipmap 层级数量
     */
    get mipmapLevel () {
        return this._mipmapLevel;
    }

    /**
     * @en The GFX Texture resource
     * @zh 获取此贴图底层的 GFX 贴图对象。
     */
    public getGFXTexture () {
        return this._gfxTexture;
    }

    public destroy () {
        this._tryDestroyTexture();
        return super.destroy();
    }

    /**
     * @en Update the level 0 mipmap image.
     * @zh 更新 0 级 Mipmap。
     */
    public updateImage () {
        this.updateMipmaps(0);
    }

    /**
     * @en Update the given level mipmap image.
     * @zh 更新指定层级范围内的 Mipmap。当 Mipmap 数据发生了改变时应调用此方法提交更改。
     * 若指定的层级范围超出了实际已有的层级范围，只有覆盖的那些层级范围会被更新。
     * @param firstLevel First level to be updated
     * @param count Mipmap level count to be updated
     */
    public updateMipmaps (firstLevel: number = 0, count?: number) {

    }

    /**
     * @en Upload data to the given mipmap level.
     * The size of the image will affect how the mipmap is updated.
     * - When the image is an ArrayBuffer, the size of the image must match the mipmap size.
     * - If the image size matches the mipmap size, the mipmap data will be updated entirely.
     * - If the image size is smaller than the mipmap size, the mipmap will be updated from top left corner.
     * - If the image size is larger, an error will be raised
     * @zh 上传图像数据到指定层级的 Mipmap 中。
     * 图像的尺寸影响 Mipmap 的更新范围：
     * - 当图像是 `ArrayBuffer` 时，图像的尺寸必须和 Mipmap 的尺寸一致；否则，
     * - 若图像的尺寸与 Mipmap 的尺寸相同，上传后整个 Mipmap 的数据将与图像数据一致；
     * - 若图像的尺寸小于指定层级 Mipmap 的尺寸（不管是长或宽），则从贴图左上角开始，图像尺寸范围内的 Mipmap 会被更新；
     * - 若图像的尺寸超出了指定层级 Mipmap 的尺寸（不管是长或宽），都将引起错误。
     * @param source The source image or image data
     * @param level Mipmap level to upload the image to
     * @param arrayIndex The array index
     */
    public uploadData (source: HTMLCanvasElement | HTMLImageElement | ArrayBufferView | ImageBitmap, level: number = 0, arrayIndex: number = 0) {
        if (!this._gfxTexture || this._gfxTexture.levelCount <= level) {
            return;
        }

        const gfxDevice = this._getGFXDevice();
        if (!gfxDevice) {
            return;
        }

        const region = _regions[0];
        region.texExtent.width = this._gfxTexture.width >> level;
        region.texExtent.height = this._gfxTexture.height >> level;
        region.texSubres.mipLevel = level;
        region.texSubres.baseArrayLayer = arrayIndex;

        if (DEV) {
            if (source instanceof HTMLElement) {
                if (source.height > region.texExtent.height ||
                    source.width > region.texExtent.width) {
                    error(`Image source(${this.name}) bounds override.`);
                }
            }
        }

        if (ArrayBuffer.isView(source)) {
            gfxDevice.copyBuffersToTexture([source], this._gfxTexture, _regions);
        } else {
            gfxDevice.copyTexImagesToTexture([source], this._gfxTexture, _regions);
        }
    }

    protected _assignImage (image: ImageAsset, level: number, arrayIndex?: number) {
        const upload = () => {
            const data = image.data;
            if (!data) {
                return;
            }
            this.uploadData(data, level, arrayIndex);
            this._checkTextureLoaded();

            if (macro.CLEANUP_IMAGE_CACHE) {
                legacyCC.assetManager.releaseAsset(image);
            }
        };
        if (image.loaded) {
            upload();
        } else {
            image.once('load', () => {
                upload();
            });
            if (!this.isCompressed) {
                const defaultImg = legacyCC.builtinResMgr.get('black-texture').image as ImageAsset;
                this.uploadData(defaultImg.data as HTMLCanvasElement, level, arrayIndex);
            }
            legacyCC.assetManager.postLoadNative(image);
        }
    }

    protected _checkTextureLoaded () {
        this._textureReady();
    }

    protected _textureReady () {
        this.loaded = true;
        this.emit('load');
    }

    /**
     * Set mipmap level of this texture.
     * The value is passes as presumed info to `this._getGfxTextureCreateInfo()`.
     * @param value The mipmap level.
     */
    protected _setMipmapLevel (value: number) {
        this._mipmapLevel = value < 1 ? 1 : value;
    }

    /**
     * @en This method is overrided by derived classes to provide GFX texture info.
     * @zh 这个方法被派生类重写以提供 GFX 纹理信息。
     * @param presumed The presumed GFX texture info.
     */
    protected _getGfxTextureCreateInfo (presumed: PresumedGFXTextureInfo): TextureInfo | null {
        return null;
    }

    protected _tryReset () {
        this._tryDestroyTexture();
        if(this._mipmapLevel === 0) {
            return;
        }
        const device = this._getGFXDevice();
        if (!device) {
            return;
        }
        this._createTexture(device);
    }

    protected _createTexture (device: Device) {
        let flags = TextureFlagBit.NONE;
        if (this._mipFilter !== Filter.NONE && canGenerateMipmap(device, this._width, this._height)) {
            this._mipmapLevel = getMipLevel(this._width, this._height);
            flags = TextureFlagBit.GEN_MIPMAP;
        }

        const textureCreateInfo = this._getGfxTextureCreateInfo({
            usage: TextureUsageBit.SAMPLED | TextureUsageBit.TRANSFER_DST,
            format: this._getGFXFormat(),
            levelCount: this._mipmapLevel,
            flags,
        });
        if (!textureCreateInfo) {
            return;
        }

        const texture = device.createTexture(textureCreateInfo);

        this._gfxTexture = texture;
    }

    protected _tryDestroyTexture () {
        if (this._gfxTexture) {
            this._gfxTexture.destroy();
            this._gfxTexture = null;
        }
    }
}

legacyCC.SimpleTexture = SimpleTexture;
