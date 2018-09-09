/****************************************************************************
 Copyright (c) 2013-2016 Chukong Technologies Inc.
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

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
 ****************************************************************************/

// ========= cc.js ==========
import * as js from './js';

if (CC_DEV) {
    js.getset(js, '_registeredClassIds',
        function () {
            var dump = {};
            for (var id in _idToClass) {
                dump[id] = _idToClass[id];
            }
            return dump;
        },
        function (value) {
            js.clear(_idToClass);
            for (var id in value) {
                _idToClass[id] = value[id];
            }
        }
    );
    js.getset(js, '_registeredClassNames', 
        function () {
            var dump = {};
            for (var id in _nameToClass) {
                dump[id] = _nameToClass[id];
            }
            return dump;
        },
        function (value) {
            js.clear(_nameToClass);
            for (var id in value) {
                _nameToClass[id] = value[id];
            }
        }
    );
}
cc.js = js;

// ========= cc.path ==========
import * as path from './path';

get(path, 'sep', () => {
    return (cc.sys.os === cc.sys.OS_WINDOWS ? '\\' : '/');
})
cc.path = path;

export default {
    js,
    path
}