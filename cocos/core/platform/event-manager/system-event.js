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

import Enum from '../../value-types/enum';
import EventTarget from '../../event/event-target';
import eventManager from './CCEventManager';
import inputManger from './CCInputManager';

/**
 * !#en The event type supported by SystemEvent
 * !#zh SystemEvent 支持的事件类型
 * @class SystemEvent.EventType
 * @static
 * @namespace SystemEvent
 */
var EventType = Enum({
    /**
     * !#en The event type for press the key down event, you can use its value directly: 'keydown'
     * !#zh 当按下按键时触发的事件
     * @property KEY_DOWN
     * @type {String}
     * @static
     */
    KEY_DOWN: 'keydown',
    /**
     * !#en The event type for press the key up event, you can use its value directly: 'keyup'
     * !#zh 当松开按键时触发的事件
     * @property KEY_UP
     * @type {String}
     * @static
     */
    KEY_UP: 'keyup',
    /**
     * !#en The event type for press the devicemotion event, you can use its value directly: 'devicemotion'
     * !#zh 重力感应
     * @property DEVICEMOTION
     * @type {String}
     * @static
     */
    DEVICEMOTION: 'devicemotion'

});

var keyboardListener = null;
var accelerationListener = null;

/**
 * !#en The System event, it currently supports the key events and accelerometer events
 * !#zh 系统事件，它目前支持按键事件和重力感应事件
 * @class SystemEvent
 * @extends EventTarget
 */
export default class SystemEvent extends EventTarget {
    name = 'SystemEvent';
    static EventType = EventType;

    /**
     * !#en whether enable accelerometer event
     * !#zh 是否启用加速度计事件
     * @method setAccelerometerEnabled
     * @param {Boolean} isEnable
     */
    setAccelerometerEnabled (isEnable) {
        inputManger.setAccelerometerEnabled(isEnable);
    }

    /**
     * !#en set accelerometer interval value
     * !#zh 设置加速度计间隔值
     * @method setAccelerometerInterval
     * @param {Number} interval
     */
    setAccelerometerInterval (interval) {
        inputManger.setAccelerometerInterval(interval);
    }

    on (type, callback, target) {
        super.on(type, callback, target);

        // Keyboard
        if (type === EventType.KEY_DOWN || type === EventType.KEY_UP) {
            if (!keyboardListener) {
                keyboardListener = cc.EventListener.create({
                    event: cc.EventListener.KEYBOARD,
                    onKeyPressed (keyCode, event) {
                        event.type = EventType.KEY_DOWN;
                        cc.systemEvent.dispatchEvent(event);
                    },
                    onKeyReleased (keyCode, event) {
                        event.type = EventType.KEY_UP;
                        cc.systemEvent.dispatchEvent(event);
                    }
                });
            }
            if (!eventManager.hasEventListener(cc.EventListener.ListenerID.KEYBOARD)) {
                eventManager.addListener(keyboardListener, 1);
            }
        }

        // Acceleration
        if (type === EventType.DEVICEMOTION) {
            if (!accelerationListener) {
                accelerationListener = cc.EventListener.create({
                    event: cc.EventListener.ACCELERATION,
                    callback (acc, event) {
                        event.type = EventType.DEVICEMOTION;
                        cc.systemEvent.dispatchEvent(event);
                    }
                });
            }
            if (!eventManager.hasEventListener(cc.EventListener.ListenerID.ACCELERATION)) {
                eventManager.addListener(accelerationListener, 1);
            }
        }
    }

    off (type, callback, target) {
        super.off(type, callback, target);

        // Keyboard
        if (keyboardListener && (type === EventType.KEY_DOWN || type === EventType.KEY_UP)) {
            var hasKeyDownEventListener = this.hasEventListener(EventType.KEY_DOWN);
            var hasKeyUpEventListener = this.hasEventListener(EventType.KEY_UP);
            if (!hasKeyDownEventListener && !hasKeyUpEventListener) {
                eventManager.removeListener(keyboardListener);
            }
        }

        // Acceleration
        if (accelerationListener && type === EventType.DEVICEMOTION) {
            eventManager.removeListener(accelerationListener);
        }
    }
}

cc.SystemEvent = SystemEvent;

if (!CC_EDITOR) {
/** 
 * @module cc
 */

/**
 * !#en The System event singleton for global usage
 * !#zh 系统事件单例，方便全局使用
 * @property systemEvent
 * @type {SystemEvent}
 */    
    cc.systemEvent = new cc.SystemEvent();
}