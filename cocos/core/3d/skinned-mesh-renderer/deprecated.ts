/*
 Copyright (c) 2020 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

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
 * @module component
 */

import { SkinnedMeshRenderer } from './skinned-mesh-renderer';
import { SkinnedMeshBatchRenderer, SkinnedMeshUnit } from './skinned-mesh-batch-renderer';
import { js } from '../../utils/js';
import { legacyCC } from '../../global-exports';
/**
 * Alias of [[SkinnedMeshRenderer]]
 * @deprecated Since v1.2
 */
export { SkinnedMeshRenderer as SkinningModelComponent };
legacyCC.SkinningModelComponent = SkinnedMeshRenderer;
js.setClassAlias(SkinnedMeshRenderer, 'cc.SkinningModelComponent');
/**
 * Alias of [[SkinnedMeshUnit]]
 * @deprecated Since v1.2
 */
export { SkinnedMeshUnit as SkinningModelUnit };
legacyCC.SkinningModelUnit = SkinnedMeshUnit;
js.setClassAlias(SkinnedMeshUnit, 'cc.SkinningModelUnit');
/**
 * Alias of [[SkinnedMeshBatchRenderer]]
 * @deprecated Since v1.2
 */
export { SkinnedMeshBatchRenderer as BatchedSkinningModelComponent };
legacyCC.BatchedSkinningModelComponent = SkinnedMeshBatchRenderer;
js.setClassAlias(SkinnedMeshBatchRenderer, 'cc.BatchedSkinningModelComponent');
