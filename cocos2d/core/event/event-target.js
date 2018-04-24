﻿/****************************************************************************
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
var EventListeners = require('./event-listeners');
require('./event');
var js = cc.js;
var fastRemove = js.array.fastRemove;

var cachedArray = new Array(16);
cachedArray.length = 0;

var CAPTURING_FLAG = 1 << 1;
var BUBBLING_FLAG = 1 << 2;

var _doDispatchEvent = function (owner, event) {
    var target, i;
    event.target = owner;

    // Event.CAPTURING_PHASE
    cachedArray.length = 0;
    owner._getCapturingTargets(event.type, cachedArray);
    // capturing
    event.eventPhase = 1;
    for (i = cachedArray.length - 1; i >= 0; --i) {
        target = cachedArray[i];
        if (target._isTargetActive(event.type) && target._capturingListeners) {
            event.currentTarget = target;
            // fire event
            target._capturingListeners.invoke(event, cachedArray);
            // check if propagation stopped
            if (event._propagationStopped) {
                cachedArray.length = 0;
                return;
            }
        }
    }
    cachedArray.length = 0;

    // Event.AT_TARGET
    // checks if destroyed in capturing callbacks
    if (owner._isTargetActive(event.type)) {
        // Event.AT_TARGET
        event.eventPhase = 2;
        event.currentTarget = owner;
        if (owner._capturingListeners) {
            owner._capturingListeners.invoke(event);
        }
        if (!event._propagationImmediateStopped && owner._bubblingListeners) {
            owner._bubblingListeners.invoke(event);
        }
    }

    if (!event._propagationStopped && event.bubbles) {
        // Event.BUBBLING_PHASE
        owner._getBubblingTargets(event.type, cachedArray);
        // propagate
        event.eventPhase = 3;
        for (i = 0; i < cachedArray.length; ++i) {
            target = cachedArray[i];
            if (target._isTargetActive(event.type) && target._bubblingListeners) {
                event.currentTarget = target;
                // fire event
                target._bubblingListeners.invoke(event);
                // check if propagation stopped
                if (event._propagationStopped) {
                    cachedArray.length = 0;
                    return;
                }
            }
        }
    }
    cachedArray.length = 0;
};

/**
 * !#en
 * EventTarget is an object to which an event is dispatched when something has occurred.
 * Entity are the most common event targets, but other objects can be event targets too.
 *
 * Event targets are an important part of the Fireball event model.
 * The event target serves as the focal point for how events flow through the scene graph.
 * When an event such as a mouse click or a keypress occurs, Fireball dispatches an event object
 * into the event flow from the root of the hierarchy. The event object then makes its way through
 * the scene graph until it reaches the event target, at which point it begins its return trip through
 * the scene graph. This round-trip journey to the event target is conceptually divided into three phases:
 * - The capture phase comprises the journey from the root to the last node before the event target's node
 * - The target phase comprises only the event target node
 * - The bubbling phase comprises any subsequent nodes encountered on the return trip to the root of the tree
 * See also: http://www.w3.org/TR/DOM-Level-3-Events/#event-flow
 *
 * Event targets can implement the following methods:
 *  - _getCapturingTargets
 *  - _getBubblingTargets
 *
 * !#zh
 * 事件目标是事件触发时，分派的事件对象，Node 是最常见的事件目标，
 * 但是其他对象也可以是事件目标。<br/>
 *
 * @class EventTarget
 */
function EventTarget () {
    /*
     * @property _capturingListeners
     * @type {EventListeners}
     * @default null
     * @private
     */
    this._capturingListeners = null;

    /*
     * @property _bubblingListeners
     * @type {EventListeners}
     * @default null
     * @private
     */
    this._bubblingListeners = null;
}

var proto = EventTarget.prototype;

/**
 * !#en Checks whether the EventTarget object has any callback registered for a specific type of event.
 * !#zh 检查事件目标对象是否有为特定类型的事件注册的回调。
 * @param {String} type - The type of event.
 * @return {Boolean} True if a callback of the specified type is registered; false otherwise.
 */
proto.hasEventListener = function (type) {
    return this._bubblingListeners.has(type) || this._capturingListeners.has(type);
};

/**
 * !#en
 * Register an callback of a specific event type on the EventTarget.
 * This type of event should be triggered via `emit`.
 * !#zh
 * 注册事件目标的特定事件类型回调。这种类型的事件应该被 `emit` 触发。
 *
 * @method on
 * @param {String} type - A string representing the event type to listen for.
 * @param {Function} callback - The callback that will be invoked when the event is dispatched.
 *                              The callback is ignored if it is a duplicate (the callbacks are unique).
 * @param {Event} callback.event event
 * @param {Object} [target] - The target (this object) to invoke the callback, can be null
 * @return {Function} - Just returns the incoming callback so you can save the anonymous function easier.
 * @typescript
 * on(type: string, callback: (event: Event.EventCustom) => void, target?: any): (event: Event.EventCustom) => void
 * on<T>(type: string, callback: (event: T) => void, target?: any): (event: T) => void
 * @example
 * node.on('fire', function (event) {
 *     cc.log("fire in the hole");
 * }, node);
 */
proto.on = function (type, callback, target) {
    if (!callback) {
        cc.errorID(6800);
        return;
    }

    let listeners = this._bubblingListeners = this._bubblingListeners || new EventListeners();

    if ( !listeners.has(type, callback, target) ) {
        listeners.add(type, callback, target);

        if (target && target.__eventTargets)
            target.__eventTargets.push(this);
    }

    return callback;
};

/**
 * !#en
 * Register an callback of a event type for dispatching on the EventTarget.
 * The difference between on and onDispatch is onDispatch event can be dispatched to a tree hierarchy, while on is emitted to a simple list.
 * This kind of event should be triggered with dispatchEvent, the dispatch process has three steps:
 * 1. Capturing phase: dispatch in capture targets (`_getCapturingTargets`), e.g. parents in node tree, from root to the real target
 * 2. At target phase: dispatch to the listeners of the real target
 * 3. Bubbling phase: dispatch in bubble targets (`_getBubblingTargets`), e.g. parents in node tree, from the real target to root
 * In any moment of the dispatching process, it can be stopped via `event.stopPropagation()` or `event.stopPropagationImmidiate()`.
 * !#zh
 * 注册事件目标的捕获／冒泡派发事件类型回调。
 * onDispatch 和 on 的区别在于 onDispatch 可以用来做捕获和冒泡事件派发，而 on 只会简单得调用监听器列表中的回调。
 * onDispatch 注册的事件应该被 dispatchEvent 方法触发，触发的过程包含三个阶段：
 * 1. 捕获阶段：派发事件给捕获目标（通过 `_getCapturingTargets` 获取），比如，节点树中注册了捕获阶段的父节点，从根节点开始派发直到目标节点。
 * 2. 目标阶段：派发给目标节点的监听器。
 * 3. 冒泡阶段：派发事件给冒泡目标（通过 `_getBubblingTargets` 获取），比如，节点树中注册了冒泡阶段的父节点，从目标节点开始派发知道根节点。
 * 在派发过程的任何时候，派发都可能被 `event.stopPropagation()` 或 `event.stopPropagationImmidiate()` 打断。
 *
 * @method onDispatch
 * @param {String} type - A string representing the event type to listen for.
 * @param {Function} callback - The callback that will be invoked when the event is dispatched.
 *                              The callback is ignored if it is a duplicate (the callbacks are unique).
 * @param {Event} callback.event event
 * @param {Object} [target] - The target (this object) to invoke the callback, can be null
 * @param {Boolean} [useCapture=false] - When set to true, the capture argument prevents callback
 *                              from being invoked when the event's eventPhase attribute value is BUBBLING_PHASE.
 *                              When false, callback will NOT be invoked when event's eventPhase attribute value is CAPTURING_PHASE.
 *                              Either way, callback will be invoked when event's eventPhase attribute value is AT_TARGET.
 * @return {Function} - Just returns the incoming callback so you can save the anonymous function easier.
 * @typescript
 * onDispatch(type: string, callback: (event: Event.EventCustom) => void, target?: any, useCapture?: boolean): (event: Event.EventCustom) => void
 * onDispatch<T>(type: string, callback: (event: T) => void, target?: any, useCapture?: boolean): (event: T) => void
 * @example
 * node.onDispatch(cc.Node.EventType.TOUCH_START, function (event) {
 *     cc.log("touch started");
 * }, node, false);
 */
proto.onDispatch = function (type, callback, target, useCapture) {
    // Accept also patameters like: (type, callback, useCapture)
    if (typeof target === 'boolean') {
        useCapture = target;
        target = undefined;
    }
    else useCapture = !!useCapture;
    if (!callback) {
        cc.errorID(6800);
        return;
    }

    var listeners = null;
    if (useCapture) {
        listeners = this._capturingListeners = this._capturingListeners || new EventListeners();
    }
    else {
        listeners = this._bubblingListeners = this._bubblingListeners || new EventListeners();
    }

    if ( ! listeners.has(type, callback, target) ) {
        listeners.add(type, callback, target);

        if (target && target.__eventTargets)
            target.__eventTargets.push(this);
    }

    return callback;
};

/**
 * !#en
 * Removes the listeners previously registered with the same type, callback, target and or useCapture,
 * if only type is passed as parameter, all listeners registered with that type will be removed.
 * !#zh
 * 删除之前用同类型，回调，目标或 useCapture 注册的事件监听器，如果只传递 type，将会删除 type 类型的所有事件监听器。
 *
 * @method off
 * @param {String} type - A string representing the event type being removed.
 * @param {Function} [callback] - The callback to remove.
 * @param {Object} [target] - The target (this object) to invoke the callback, if it's not given, only callback without target will be removed
 * @example
 * // register fire eventListener
 * var callback = node.on('fire', function (event) {
 *     cc.log("fire in the hole");
 * }, target);
 * // remove fire event listener
 * node.off('fire', callback, target);
 * // remove all fire event listeners
 * node.off('fire');
 */
proto.off = function (type, callback, target) {
    var listeners = this._bubblingListeners;
    if (!listeners) {
        return;
    }

    if (!callback) {
        listeners.removeAll(type);
    }
    else {
        listeners.remove(type, callback, target);

        if (target && target.__eventTargets) {
            fastRemove(target.__eventTargets, this);
        }
    }
};

/**
 * !#en
 * Removes the listeners for dispatching previously registered with the same type, callback, target and or useCapture,
 * if only type is passed as parameter, all listeners registered with that type will be removed.
 * !#zh
 * 删除之前用同类型，回调，目标或 useCapture 注册的捕获／冒泡派发事件监听器，如果只传递 type，将会删除 type 类型的所有事件监听器。
 *
 * @method offDispatch
 * @param {String} type - A string representing the event type being removed.
 * @param {Function} [callback] - The callback to remove.
 * @param {Object} [target] - The target (this object) to invoke the callback, if it's not given, only callback without target will be removed
 * @param {Boolean} [useCapture=false] - Specifies whether the callback being removed was registered as a capturing callback or not.
 *                              If not specified, useCapture defaults to false. If a callback was registered twice,
 *                              one with capture and one without, each must be removed separately. Removal of a capturing callback
 *                              does not affect a non-capturing version of the same listener, and vice versa.
 * @example
 * // register touchEnd eventListener
 * var touchEnd = node.on(cc.Node.EventType.TOUCH_END, function (event) {
 *     cc.log("this is callback");
 * }, node, true);
 * // remove touch end event listener
 * node.off(cc.Node.EventType.TOUCH_END, touchEnd, node, true);
 * // remove all touch end event listeners
 * node.off(cc.Node.EventType.TOUCH_END);
 */
proto.offDispatch = function (type, callback, target, useCapture) {
    // Accept also patameters like: (type, callback, useCapture)
    if (typeof target === 'boolean') {
        useCapture = target;
        target = undefined;
    }
    else useCapture = !!useCapture;
    if (!callback) {
        this._capturingListeners && this._capturingListeners.removeAll(type);
        this._bubblingListeners && this._bubblingListeners.removeAll(type);
    }
    else {
        var listeners = useCapture ? this._capturingListeners : this._bubblingListeners;
        if (listeners) {
            listeners.remove(type, callback, target);

            if (target && target.__eventTargets) {
                fastRemove(target.__eventTargets, this);
            }
        }
        
    }
};

/**
 * !#en Removes all callbacks previously registered with the same target (passed as parameter).
 * This is not for removing all listeners in the current event target,
 * and this is not for removing all listeners the target parameter have registered.
 * It's only for removing all listeners (callback and target couple) registered on the current event target by the target parameter.
 * !#zh 在当前 EventTarget 上删除指定目标（target 参数）注册的所有事件监听器。
 * 这个函数无法删除当前 EventTarget 的所有事件监听器，也无法删除 target 参数所注册的所有事件监听器。
 * 这个函数只能删除 target 参数在当前 EventTarget 上注册的所有事件监听器。
 * @method targetOff
 * @param {Object} target - The target to be searched for all related listeners
 */
proto.targetOff = function (target) {
    if (this._capturingListeners) {
        this._capturingListeners.removeAll(target);
    }
    if (this._bubblingListeners) {
        this._bubblingListeners.removeAll(target);
    }
};

/**
 * !#en
 * Register an callback of a specific event type on the EventTarget,
 * the callback will remove itself after the first time it is triggered.
 * !#zh
 * 注册事件目标的特定事件类型回调，回调会在第一时间被触发后删除自身。
 *
 * @method once
 * @param {String} type - A string representing the event type to listen for.
 * @param {Function} callback - The callback that will be invoked when the event is dispatched.
 *                              The callback is ignored if it is a duplicate (the callbacks are unique).
 * @param {Event} callback.event event
 * @param {Object} [target] - The target (this object) to invoke the callback, can be null
 * @example
 * node.once(cc.Node.EventType.TOUCH_END, function (event) {
 *     cc.log("this is callback");
 * }, node);
 */
proto.once = function (type, callback, target) {
    var eventType_hasOnceListener = '__ONCE_FLAG:' + type;
    var listeners = this._bubblingListeners;
    var hasOnceListener = listeners && listeners.has(eventType_hasOnceListener, callback, target);
    if (!hasOnceListener) {
        var self = this;
        var onceWrapper = function (event) {
            self.off(type, onceWrapper, target);
            listeners.remove(eventType_hasOnceListener, callback, target);
            callback.call(this, event);
        };
        this.on(type, onceWrapper, target);
        if (!listeners) {
            // obtain new created listeners
            listeners = this._bubblingListeners;
        }
        listeners.add(eventType_hasOnceListener, callback, target);
    }
};

/**
 * !#en
 * Register an callback of a specific event type for dispatching on the EventTarget,
 * the callback will remove itself after the first time it is triggered.
 * !#zh
 * 注册事件目标的捕获／冒泡派发事件类型回调，回调会在第一时间被触发后删除自身。
 *
 * @method onceDispatch
 * @param {String} type - A string representing the event type to listen for.
 * @param {Function} callback - The callback that will be invoked when the event is dispatched.
 *                              The callback is ignored if it is a duplicate (the callbacks are unique).
 * @param {Event} callback.event event
 * @param {Object} [target] - The target (this object) to invoke the callback, can be null
 * @param {Boolean} [useCapture=false] - When set to true, the capture argument prevents callback
 *                              from being invoked when the event's eventPhase attribute value is BUBBLING_PHASE.
 *                              When false, callback will NOT be invoked when event's eventPhase attribute value is CAPTURING_PHASE.
 *                              Either way, callback will be invoked when event's eventPhase attribute value is AT_TARGET.
 * @typescript
 * onceDispatch(type: string, callback: (event: Event.EventCustom) => void, target?: any, useCapture?: boolean): (event: Event.EventCustom) => void
 * onceDispatch<T>(type: string, callback: (event: T) => void, target?: any, useCapture?: boolean): (event: T) => void
 * @example
 * node.once(cc.Node.EventType.TOUCH_END, function (event) {
 *     cc.log("this is callback");
 * }, node);
 */
proto.onceDispatch = function (type, callback, target, useCapture) {
    var eventType_hasOnceListener = '__ONCE_FLAG:' + type;
    var listeners = useCapture ? this._capturingListeners : this._bubblingListeners;
    var hasOnceListener = listeners && listeners.has(eventType_hasOnceListener, callback, target);
    if (!hasOnceListener) {
        var self = this;
        var onceWrapper = function (event) {
            self.offDispatch(type, onceWrapper, target, useCapture);
            listeners.remove(eventType_hasOnceListener, callback, target);
            callback.call(this, event);
        };
        this.onDispatch(type, onceWrapper, target, useCapture);
        if (!listeners) {
            // obtain new created listeners
            listeners = useCapture ? this._capturingListeners : this._bubblingListeners;
        }
        listeners.add(eventType_hasOnceListener, callback, target);
    }
};

/**
 * !#en
 * Dispatches an event into the event flow.
 * The event target is the EventTarget object upon which the dispatchEvent() method is called.
 * !#zh 分发事件到事件流中。
 *
 * @method dispatchEvent
 * @param {Event} event - The Event object that is dispatched into the event flow
 */
proto.dispatchEvent = function (event) {
    _doDispatchEvent(this, event);
    cachedArray.length = 0;
};

/**
 * !#en
 * Send an event to this object directly, this method will not propagate the event to any other objects.
 * The event will be created from the supplied message, you can get the "detail" argument from event.detail.
 * !#zh
 * 该对象直接发送事件， 这种方法不会对事件传播到任何其他对象。
 *
 * @method emit
 * @param {String} type - event type
 * @param {*} [detail] - whatever argument the message needs
 */
proto.emit = function (type, detail) {
    if (CC_DEV && typeof type !== 'string') {
        cc.errorID(6801);
        return;
    }
    var bubblingListeners = this._bubblingListeners;
    if (bubblingListeners && bubblingListeners.has(type)) {
        var event = cc.Event.EventCustom.get(type);
        event.detail = detail;
        // Event.AT_TARGET
        event.eventPhase = 2;
        event.target = event.currentTarget = this;

        bubblingListeners.invoke(event);
        
        event.detail = null;
        cc.Event.EventCustom.put(event);
    }
};

/*
 * Get whether the target is active for events.
 * The name is for avoiding conflict with user defined functions.
 *
 * Subclasses can override this method to make event target active or inactive.
 * @method _isTargetActive
 * @param {String} type - the event type
 * @return {Boolean} - A boolean value indicates the event target is active or not
 */
proto._isTargetActive = function (type) {
    return true;
};

/*
 * Get all the targets listening to the supplied type of event in the target's capturing phase.
 * The capturing phase comprises the journey from the root to the last node BEFORE the event target's node.
 * The result should save in the array parameter, and MUST SORT from child nodes to parent nodes.
 *
 * Subclasses can override this method to make event propagable.
 * @method _getCapturingTargets
 * @param {String} type - the event type
 * @param {Array} array - the array to receive targets
 * @example {@link utils/api/engine/docs/cocos2d/core/event/_getCapturingTargets.js}
 */
proto._getCapturingTargets = function (type, array) {

};

/*
 * Get all the targets listening to the supplied type of event in the target's bubbling phase.
 * The bubbling phase comprises any SUBSEQUENT nodes encountered on the return trip to the root of the tree.
 * The result should save in the array parameter, and MUST SORT from child nodes to parent nodes.
 *
 * Subclasses can override this method to make event propagable.
 * @method _getBubblingTargets
 * @param {String} type - the event type
 * @param {Array} array - the array to receive targets
 */
proto._getBubblingTargets = function (type, array) {

};

// Improve performance of function call (avoid using EventTarget.prototype.on.call)
EventTarget.prototype._EventTargetOn = EventTarget.prototype.on;
EventTarget.prototype._EventTargetOnce = EventTarget.prototype.once;
EventTarget.prototype._EventTargetOff = EventTarget.prototype.off;
EventTarget.prototype._EventTargetTargetOff = EventTarget.prototype.targetOff;

cc.EventTarget = module.exports = EventTarget;
