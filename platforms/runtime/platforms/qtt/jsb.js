!function n(r,i,a){function u(t,e){if(!i[t]){if(!r[t]){var o="function"==typeof require&&require;if(!e&&o)return o(t,!0);if(c)return c(t,!0);throw(o=new Error("Cannot find module '"+t+"'")).code="MODULE_NOT_FOUND",o}o=i[t]={exports:{}},r[t][0].call(o.exports,function(e){return u(r[t][1][e]||e)},o,o.exports,n,r,i,a)}return i[t].exports}for(var c="function"==typeof require&&require,e=0;e<a.length;e++)u(a[e]);return u}({1:[function(e,t,o){"use strict";Object.defineProperty(o,"__esModule",{value:!0}),o.default=function(t){void 0===y&&(y=Object.assign({},t),Object.keys(t).forEach(function(e){"function"==typeof t[e]&&(t[e]=function(){return console.warn("AudioEngine."+e+" is deprecated"),y[e].apply(t,arguments)})}));return new T};function n(e,t,o){if(e=j.get(e),"function"!=typeof o||!e)return-1;for(var n=e[t]||[],r=0,i=n.length;r<i;++r)if(o===n[r])return n.splice(r,1),o.length+1;return 0}function r(e,t,o){if(e=j.get(e),"function"!=typeof o||!e)return-1;var n=e[t];if(n){for(var r=0,i=n.length;r<i;++r)if(o===n[r])return 0;n.push(o)}else n=e[t]=[o];return n.length}function i(e,t){var o=2<arguments.length&&void 0!==arguments[2]?arguments[2]:[],n=j.get(e);if(n)for(var r=n[t]||[],i=0,a=r.length;i<a;++i)r[i].apply(e,o)}var a="canplayCallbacks",u="endedCallbacks",c="errorCallbacks",s="pauseCallbacks",f="playCallbacks",l="seekedCallbacks",d="seekingCallbacks",h="stopCallbacks",p="timeUpdateCallbacks",b="waitingCallbacks",m=10003,v=-1,g={ERROR:-1,INITIALIZING:0,PLAYING:1,PAUSED:2},y=void 0,j=new WeakMap;function T(){this.startTime=0,this.autoplay=!1,j.set(this,{src:"",volume:1,loop:!1}),Object.defineProperty(this,"loop",{set:function(e){e=!!e;var t,o=j.get(this);o&&("number"==typeof(t=o.audioID)&&0<=t&&y.setLoop(t,e),o.loop=e)},get:function(){var e=j.get(this);return!!e&&e.loop}}),Object.defineProperty(this,"volume",{set:function(e){"number"==typeof e?e<0?e=0:1<e&&(e=1):e=1;var t,o=j.get(this);o&&("number"==typeof(t=o.audioID)&&0<=t&&y.setVolume(t,e),o.volume=e)},get:function(){var e=j.get(this);return e?e.volume:1}}),Object.defineProperty(this,"src",{set:function(e){var t,o,n=j.get(this);n&&(t=n.src,"string"==typeof(n.src=e)&&("number"==typeof(o=n.audioID)&&0<=o&&y.getState(o)===g.PAUSED&&t!==e&&(y.stop(o),n.audioID=-1),this.autoplay&&this.play()))},get:function(){var e=j.get(this);return e?e.src:""}}),Object.defineProperty(this,"duration",{get:function(){var e=j.get(this);if(e){e=e.audioID;if("number"==typeof e&&0<=e)return y.getDuration(e)}return NaN},set:function(){}}),Object.defineProperty(this,"currentTime",{get:function(){var e=j.get(this);if(e){e=e.audioID;if("number"==typeof e&&0<=e)return y.getCurrentTime(e)}return 0},set:function(){}}),Object.defineProperty(this,"paused",{get:function(){var e=j.get(this);if(e){e=e.audioID;if("number"==typeof e&&0<=e)return y.getState(e)===g.PAUSED}return!0},set:function(){}}),Object.defineProperty(this,"buffered",{get:function(){var e=j.get(this);if(e){e=e.audioID;if("number"==typeof e&&0<=e)return y.getBuffered(e)}return 0},set:function(){}})}o=T.prototype;o.destroy=function(){var e,t=j.get(this);t&&("number"==typeof(e=t.audioID)&&0<=e&&(y.stop(e),t.audioID=-1,i(this,h)),t[a]=[],t[u]=[],t[c]=[],t[s]=[],t[f]=[],t[l]=[],t[d]=[],t[h]=[],t[p]=[],t[b]=[],clearInterval(t.intervalID))},o.play=function(){var e=j.get(this);if(e){var t,o=e.src,n=e.audioID;if("string"==typeof o&&""!==o){if("number"==typeof n&&0<=n){if(y.getState(n)===g.PAUSED)return y.resume(n),void i(this,f);y.stop(n),e.audioID=-1}-1!==(n=y.play(o,this.loop,this.volume))?(e.audioID=n,"number"==typeof this.startTime&&0<this.startTime&&y.setCurrentTime(n,this.startTime),i(this,b),t=this,y.setCanPlayCallback(n,function(){o===t.src&&(i(t,a),i(t,f))}),y.setWaitingCallback(n,function(){o===t.src&&i(t,b)}),y.setErrorCallback(n,function(){o===t.src&&(e.audioID=-1,i(t,c))}),y.setFinishCallback(n,function(){o===t.src&&(e.audioID=-1,i(t,u))})):i(this,c,[{errMsg:"unknown",errCode:v}])}else i(this,c,[{errMsg:"invalid src",errCode:m}])}},o.pause=function(){var e=j.get(this);!e||"number"==typeof(e=e.audioID)&&0<=e&&(y.pause(e),i(this,s))},o.seek=function(e){var t=j.get(this);t&&"number"==typeof e&&0<=e&&("number"==typeof(t=t.audioID)&&0<=t&&(y.setCurrentTime(t,e),i(this,d),i(this,l)))},o.stop=function(){var e,t=j.get(this);!t||"number"==typeof(e=t.audioID)&&0<=e&&(y.stop(e),t.audioID=-1,i(this,h))},o.offCanplay=function(e){n(this,a,e)},o.offEnded=function(e){n(this,u,e)},o.offError=function(e){n(this,c,e)},o.offPause=function(e){n(this,s,e)},o.offPlay=function(e){n(this,f,e)},o.offSeeked=function(e){n(this,l,e)},o.offSeeking=function(e){n(this,d,e)},o.offStop=function(e){n(this,h,e)},o.offTimeUpdate=function(e){1===n(this,p,e)&&clearInterval(j.get(this).intervalID)},o.offWaiting=function(e){n(this,b,e)},o.onCanplay=function(e){r(this,a,e)},o.onEnded=function(e){r(this,u,e)},o.onError=function(e){r(this,c,e)},o.onPause=function(e){r(this,s,e)},o.onPlay=function(e){r(this,f,e)},o.onSeeked=function(e){r(this,l,e)},o.onSeeking=function(e){r(this,"seekingCallbacks",e)},o.onStop=function(e){r(this,h,e)},o.onTimeUpdate=function(e){var t,o;1===r(this,p,e)&&(e=j.get(this),t=this,o=setInterval(function(){var e=j.get(t);e?"number"==typeof(e=e.audioID)&&0<=e&&y.getState(e)===g.PLAYING&&i(t,p):clearInterval(o)},500),e.intervalID=o)},o.onWaiting=function(e){r(this,b,e)}},{}],2:[function(e,t,o){"use strict";var n,r=(n=e("../../util"))&&n.__esModule?n:{default:n};var i=loadRuntime();r.default.exportTo("onShow",i,jsb),r.default.exportTo("onHide",i,jsb),r.default.exportTo("offShow",i,jsb),r.default.exportTo("offHide",i,jsb)},{"../../util":20}],3:[function(e,t,o){"use strict";var n,r=(n=e("../../util"))&&n.__esModule?n:{default:n};var i=loadRuntime();r.default.exportTo("loadSubpackage",i,jsb)},{"../../util":20}],4:[function(e,t,o){"use strict";var n,r=(n=e("../../util"))&&n.__esModule?n:{default:n};var i=loadRuntime();r.default.exportTo("env",i,jsb),r.default.exportTo("getSystemInfo",i,jsb),r.default.exportTo("getSystemInfoSync",i,jsb)},{"../../util":20}],5:[function(e,t,o){"use strict";function s(e){for(var t,o=0;o<l.length;o++)if(t=l[o],e.identifier===t.identifier)return o;return-1}function f(e,t){for(var o in e)e.hasOwnProperty(o)&&(t[o]=e[o])}var n=loadRuntime(),l=[],d={touchstart:[],touchmove:[],touchend:[],touchcancel:[]};function r(e,t){for(var o=d[e]||[],n=o.length,r=0;r<n;++r)if(t===o[r])return void o.splice(r,1)}var h=!1,i=n.getSystemInfoSync();window.innerWidth&&i.windowWidth!==window.innerWidth&&(h=!0);i=function(c){return function(e){if("function"!=typeof e){var t,o=new TouchEvent(c);"touchstart"===c?e.forEach(function(e){0<=(t=s(e))?f(e,l[t]):(f(e,e={}),l.push(e))}):"touchmove"===c?e.forEach(function(e){0<=(t=s(e))&&f(e,l[t])}):"touchend"!==c&&"touchcancel"!==c||e.forEach(function(e){0<=(t=s(e))&&l.splice(t,1)});var r=[].concat(l),i=[];e.forEach(function(e){for(var t=r.length,o=0;o<t;++o){var n=r[o];if(e.identifier===n.identifier)return void i.push(n)}i.push(e)}),o.touches=r,o.targetTouches=r,o.changedTouches=i,h&&(r.forEach(function(e){e.clientX/=window.devicePixelRatio,e.clientY/=window.devicePixelRatio,e.pageX/=window.devicePixelRatio,e.pageY/=window.devicePixelRatio}),"touchcancel"!==c&&"touchend"!==c||i.forEach(function(e){e.clientX/=window.devicePixelRatio,e.clientY/=window.devicePixelRatio,e.pageX/=window.devicePixelRatio,e.pageY/=window.devicePixelRatio}));for(var n=d[c],a=n.length,u=0;u<a;u++)n[u](o)}else!function(e){for(var t=d[c],o=0,n=t.length;o<n;o++)if(e===t[o])return;t.push(e)}(e)}};n.onTouchStart?(jsb.onTouchStart=n.onTouchStart,jsb.offTouchStart=n.offTouchStart):(jsb.onTouchStart=i("touchstart"),jsb.offTouchStart=function(e){r("touchstart",e)}),n.onTouchMove?(jsb.onTouchMove=n.onTouchMove,jsb.offTouchMove=n.offTouchMove):(jsb.onTouchMove=i("touchmove"),jsb.offTouchMove=function(e){r("touchmove",e)}),n.onTouchCancel?(jsb.onTouchCancel=n.onTouchCancel,jsb.offTouchCancel=n.offTouchCancel):(jsb.onTouchCancel=i("touchcancel"),jsb.offTouchCancel=function(e){r("touchcancel",e)}),n.onTouchEnd?(jsb.onTouchEnd=n.onTouchEnd,jsb.offTouchEnd=n.offTouchEnd):(jsb.onTouchEnd=i("touchend"),jsb.offTouchEnd=function(e){r("touchend",e)})},{}],6:[function(e,t,o){"use strict";var n,r,i,a=loadRuntime(),u=a.getSystemInfoSync(),c=[];jsb.device=jsb.device||{},a.offAccelerometerChange?(n=[0,0,0],r=function(t){n[0]=.8*n[0]+(1-.8)*t.x,n[1]=.8*n[1]+(1-.8)*t.y,n[2]=.8*n[2]+(1-.8)*t.z,c.forEach(function(e){e({acceleration:{x:t.x-n[0],y:t.y-n[1],z:t.z-n[2]},accelerationIncludingGravity:{x:t.x,y:t.y,z:t.z}})})},i="android"===u.platform.toLowerCase()?function(e){e.x*=-10,e.y*=-10,e.z*=-10,r(e)}:function(e){e.x*=10,e.y*=10,e.z*=10,r(e)},jsb.onAccelerometerChange=function(e){if("function"==typeof e){for(var t=c.length,o=0;o<t;++o)if(e===c[o])return;c.push(e),0===t&&a.onAccelerometerChange(i)}},jsb.offAccelerometerChange=function(e){for(var t=c.length,o=0;o<t;++o)if(e===c[o])return c.splice(o,1),void(1===t&&a.offAccelerometerChange(i))},jsb.stopAccelerometer=a.stopAccelerometer.bind(a),jsb.startAccelerometer=a.startAccelerometer.bind(a),jsb.device.setMotionEnabled=function(e){e?a.startAccelerometer({type:"accelerationIncludingGravity"}):a.stopAccelerometer({})}):(jsb.onAccelerometerChange=function(e){if("function"==typeof e){for(var t=c.length,o=0;o<t;++o)if(e===c[o])return;c.push(e)}},jsb.offAccelerometerChange=function(e){for(var t=c.length,o=0;o<t;++o)if(e===c[o])return void c.splice(o,1)},jsb.device.dispatchDeviceMotionEvent=function(t){c.forEach(function(e){e(t)})},jsb.stopAccelerometer=function(){jsb.device.setMotionEnabled(!1)},jsb.startAccelerometer=function(){jsb.device.setMotionEnabled(!0)})},{}],7:[function(e,t,o){"use strict";var n,r=(n=e("../../util"))&&n.__esModule?n:{default:n};var i=loadRuntime();r.default.exportTo("getBatteryInfo",i,jsb),r.default.exportTo("getBatteryInfoSync",i,jsb)},{"../../util":20}],8:[function(e,t,o){"use strict";var n,r=(n=e("../../util"))&&n.__esModule?n:{default:n};var i=loadRuntime();r.default.exportTo("getFileSystemManager",i,jsb)},{"../../util":20}],9:[function(e,t,o){"use strict";var n,r=(n=e("../util"))&&n.__esModule?n:{default:n};window.jsb||(window.jsb={});var i={runtimeNonsupports:[]};r.default.weakMap.set(jsb,i),jsb.runtimeSupport=function(t){return!i.runtimeNonsupports.find(function(e){return t===e})},e("./base/lifecycle"),e("./base/subpackage"),e("./base/system-info"),e("./base/touch-event"),e("./device/accelerometer"),e("./device/battery"),e("./file/file-system-manager"),e("./interface/keyboard"),e("./interface/window"),e("./media/audio"),e("./media/video"),e("./network/download"),e("./rendering/canvas"),e("./rendering/webgl"),e("./rendering/font"),e("./rendering/frame"),e("./rendering/image")},{"../util":20,"./base/lifecycle":2,"./base/subpackage":3,"./base/system-info":4,"./base/touch-event":5,"./device/accelerometer":6,"./device/battery":7,"./file/file-system-manager":8,"./interface/keyboard":10,"./interface/window":11,"./media/audio":12,"./media/video":13,"./network/download":14,"./rendering/canvas":15,"./rendering/font":16,"./rendering/frame":17,"./rendering/image":18,"./rendering/webgl":19}],10:[function(e,t,o){"use strict";var n,r=(n=e("../../util"))&&n.__esModule?n:{default:n};var i=loadRuntime();r.default.exportTo("onKeyboardInput",i,jsb),r.default.exportTo("onKeyboardConfirm",i,jsb),r.default.exportTo("onKeyboardComplete",i,jsb),r.default.exportTo("offKeyboardInput",i,jsb),r.default.exportTo("offKeyboardConfirm",i,jsb),r.default.exportTo("offKeyboardComplete",i,jsb),r.default.exportTo("hideKeyboard",i,jsb),r.default.exportTo("showKeyboard",i,jsb),r.default.exportTo("updateKeyboard",i,jsb)},{"../../util":20}],11:[function(e,t,o){"use strict";var n=loadRuntime().onWindowResize;jsb.onWindowResize=function(t){n(function(e){t(e.width||e.windowWidth,e.height||e.windowHeight)})}},{}],12:[function(e,t,o){"use strict";var n=r(e("../../inner-context")),e=r(e("../../util"));function r(e){return e&&e.__esModule?e:{default:e}}var i=loadRuntime();e.default.exportTo("AudioEngine",i,jsb),e.default.exportTo("createInnerAudioContext",i,jsb,function(){i.AudioEngine&&(jsb.createInnerAudioContext=function(){return(0,n.default)(i.AudioEngine)})})},{"../../inner-context":1,"../../util":20}],13:[function(e,t,o){"use strict";var n,r=(n=e("../../util"))&&n.__esModule?n:{default:n};var i=loadRuntime();r.default.exportTo("createVideo",i,jsb)},{"../../util":20}],14:[function(e,t,o){"use strict";var n,r=(n=e("../../util"))&&n.__esModule?n:{default:n};var i=loadRuntime();r.default.exportTo("downloadFile",i,jsb)},{"../../util":20}],15:[function(e,t,o){"use strict";var n,r=(n=e("../../util"))&&n.__esModule?n:{default:n};var i=loadRuntime();r.default.exportTo("createCanvas",i,jsb,function(){document&&"function"==typeof document.createElement&&(jsb.createCanvas=function(){return document.createElement("canvas")})})},{"../../util":20}],16:[function(e,t,o){"use strict";var n,r=(n=e("../../util"))&&n.__esModule?n:{default:n};var i=loadRuntime();r.default.exportTo("loadFont",i,jsb)},{"../../util":20}],17:[function(e,t,o){"use strict";var n=loadRuntime();jsb.setPreferredFramesPerSecond?jsb.setPreferredFramesPerSecond=jsb.setPreferredFramesPerSecond.bind(jsb):n.setPreferredFramesPerSecond?jsb.setPreferredFramesPerSecond=n.setPreferredFramesPerSecond.bind(n):jsb.setPreferredFramesPerSecond=function(){console.error("The setPreferredFramesPerSecond is not define!")}},{}],18:[function(e,t,o){"use strict";var n,r=(n=e("../../util"))&&n.__esModule?n:{default:n};var i=loadRuntime();r.default.exportTo("loadImageData",i,jsb),r.default.exportTo("createImage",i,jsb,function(){document&&"function"==typeof document.createElement&&(jsb.createImage=function(){return document.createElement("image")})})},{"../../util":20}],19:[function(e,t,o){"use strict";var h,p,b;window.__gl&&(h=window.__gl,p=h.texImage2D,h.texImage2D=function(e,t,o,n,r,i,a,u,c){var s,f,l,d=arguments.length;6===d?(u=r,a=n,(s=i)instanceof HTMLImageElement?(f=console.error,console.error=function(){},p.apply(void 0,arguments),console.error=f,h.texImage2D_image(e,t,s._imageMeta)):s instanceof HTMLCanvasElement?(l=console.error,console.error=function(){},p.apply(void 0,arguments),console.error=l,l=s.getContext("2d"),h.texImage2D_canvas(e,t,o,a,u,l)):s instanceof ImageData?(l=console.error,console.error=function(){},p(e,t,o,s.width,s.height,0,a,u,s.data),console.error=l):console.error("Invalid pixel argument passed to gl.texImage2D!")):9===d?p(e,t,o,n,r,i,a,u,c):console.error("gl.texImage2D: invalid argument count!")},b=h.texSubImage2D,h.texSubImage2D=function(e,t,o,n,r,i,a,u,c){var s,f,l,d=arguments.length;7===d?(s=a,u=i,a=r,s instanceof HTMLImageElement?(f=console.error,console.error=function(){},b.apply(void 0,arguments),console.error=f,h.texSubImage2D_image(e,t,o,n,s._imageMeta)):s instanceof HTMLCanvasElement?(l=console.error,console.error=function(){},b.apply(void 0,arguments),console.error=l,l=s.getContext("2d"),h.texSubImage2D_canvas(e,t,o,n,a,u,l)):s instanceof ImageData?(l=console.error,console.error=function(){},b(e,t,o,n,s.width,s.height,a,u,s.data),console.error=l):console.error("Invalid pixel argument passed to gl.texImage2D!")):9===d?b(e,t,o,n,r,i,a,u,c):console.error(new Error("gl.texImage2D: invalid argument count!").stack)})},{}],20:[function(e,t,o){"use strict";function i(e){return(i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(o,"__esModule",{value:!0}),o.default=void 0;var n={exportTo:function(e,t,o,n){var r;"object"===i(t)&&"object"===i(o)?void 0!==(r=t[e])?"function"==typeof r?(o[e]=r.bind(t),Object.assign(o[e],r)):o[e]=r:(this.weakMap.get(o).runtimeNonsupports.push(e),o[e]=function(){return console.error(e+" is not support!"),{}},"function"==typeof n&&n()):console.warn("invalid exportTo: ",e)},weakMap:new WeakMap};o.default=n},{}]},{},[9]);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJqc2IuanMiXSwic291cmNlc0NvbnRlbnQiOlsiIWZ1bmN0aW9uIG4ocixpLGEpe2Z1bmN0aW9uIHUodCxlKXtpZighaVt0XSl7aWYoIXJbdF0pe3ZhciBvPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWUmJm8pcmV0dXJuIG8odCwhMCk7aWYoYylyZXR1cm4gYyh0LCEwKTt0aHJvdyhvPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrdCtcIidcIikpLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsb31vPWlbdF09e2V4cG9ydHM6e319LHJbdF1bMF0uY2FsbChvLmV4cG9ydHMsZnVuY3Rpb24oZSl7cmV0dXJuIHUoclt0XVsxXVtlXXx8ZSl9LG8sby5leHBvcnRzLG4scixpLGEpfXJldHVybiBpW3RdLmV4cG9ydHN9Zm9yKHZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsZT0wO2U8YS5sZW5ndGg7ZSsrKXUoYVtlXSk7cmV0dXJuIHV9KHsxOltmdW5jdGlvbihlLHQsbyl7XCJ1c2Ugc3RyaWN0XCI7T2JqZWN0LmRlZmluZVByb3BlcnR5KG8sXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSksby5kZWZhdWx0PWZ1bmN0aW9uKHQpe3ZvaWQgMD09PXkmJih5PU9iamVjdC5hc3NpZ24oe30sdCksT2JqZWN0LmtleXModCkuZm9yRWFjaChmdW5jdGlvbihlKXtcImZ1bmN0aW9uXCI9PXR5cGVvZiB0W2VdJiYodFtlXT1mdW5jdGlvbigpe3JldHVybiBjb25zb2xlLndhcm4oXCJBdWRpb0VuZ2luZS5cIitlK1wiIGlzIGRlcHJlY2F0ZWRcIikseVtlXS5hcHBseSh0LGFyZ3VtZW50cyl9KX0pKTtyZXR1cm4gbmV3IFR9O2Z1bmN0aW9uIG4oZSx0LG8pe2lmKGU9ai5nZXQoZSksXCJmdW5jdGlvblwiIT10eXBlb2Ygb3x8IWUpcmV0dXJuLTE7Zm9yKHZhciBuPWVbdF18fFtdLHI9MCxpPW4ubGVuZ3RoO3I8aTsrK3IpaWYobz09PW5bcl0pcmV0dXJuIG4uc3BsaWNlKHIsMSksby5sZW5ndGgrMTtyZXR1cm4gMH1mdW5jdGlvbiByKGUsdCxvKXtpZihlPWouZ2V0KGUpLFwiZnVuY3Rpb25cIiE9dHlwZW9mIG98fCFlKXJldHVybi0xO3ZhciBuPWVbdF07aWYobil7Zm9yKHZhciByPTAsaT1uLmxlbmd0aDtyPGk7KytyKWlmKG89PT1uW3JdKXJldHVybiAwO24ucHVzaChvKX1lbHNlIG49ZVt0XT1bb107cmV0dXJuIG4ubGVuZ3RofWZ1bmN0aW9uIGkoZSx0KXt2YXIgbz0yPGFyZ3VtZW50cy5sZW5ndGgmJnZvaWQgMCE9PWFyZ3VtZW50c1syXT9hcmd1bWVudHNbMl06W10sbj1qLmdldChlKTtpZihuKWZvcih2YXIgcj1uW3RdfHxbXSxpPTAsYT1yLmxlbmd0aDtpPGE7KytpKXJbaV0uYXBwbHkoZSxvKX12YXIgYT1cImNhbnBsYXlDYWxsYmFja3NcIix1PVwiZW5kZWRDYWxsYmFja3NcIixjPVwiZXJyb3JDYWxsYmFja3NcIixzPVwicGF1c2VDYWxsYmFja3NcIixmPVwicGxheUNhbGxiYWNrc1wiLGw9XCJzZWVrZWRDYWxsYmFja3NcIixkPVwic2Vla2luZ0NhbGxiYWNrc1wiLGg9XCJzdG9wQ2FsbGJhY2tzXCIscD1cInRpbWVVcGRhdGVDYWxsYmFja3NcIixiPVwid2FpdGluZ0NhbGxiYWNrc1wiLG09MTAwMDMsdj0tMSxnPXtFUlJPUjotMSxJTklUSUFMSVpJTkc6MCxQTEFZSU5HOjEsUEFVU0VEOjJ9LHk9dm9pZCAwLGo9bmV3IFdlYWtNYXA7ZnVuY3Rpb24gVCgpe3RoaXMuc3RhcnRUaW1lPTAsdGhpcy5hdXRvcGxheT0hMSxqLnNldCh0aGlzLHtzcmM6XCJcIix2b2x1bWU6MSxsb29wOiExfSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsXCJsb29wXCIse3NldDpmdW5jdGlvbihlKXtlPSEhZTt2YXIgdCxvPWouZ2V0KHRoaXMpO28mJihcIm51bWJlclwiPT10eXBlb2YodD1vLmF1ZGlvSUQpJiYwPD10JiZ5LnNldExvb3AodCxlKSxvLmxvb3A9ZSl9LGdldDpmdW5jdGlvbigpe3ZhciBlPWouZ2V0KHRoaXMpO3JldHVybiEhZSYmZS5sb29wfX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLFwidm9sdW1lXCIse3NldDpmdW5jdGlvbihlKXtcIm51bWJlclwiPT10eXBlb2YgZT9lPDA/ZT0wOjE8ZSYmKGU9MSk6ZT0xO3ZhciB0LG89ai5nZXQodGhpcyk7byYmKFwibnVtYmVyXCI9PXR5cGVvZih0PW8uYXVkaW9JRCkmJjA8PXQmJnkuc2V0Vm9sdW1lKHQsZSksby52b2x1bWU9ZSl9LGdldDpmdW5jdGlvbigpe3ZhciBlPWouZ2V0KHRoaXMpO3JldHVybiBlP2Uudm9sdW1lOjF9fSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsXCJzcmNcIix7c2V0OmZ1bmN0aW9uKGUpe3ZhciB0LG8sbj1qLmdldCh0aGlzKTtuJiYodD1uLnNyYyxcInN0cmluZ1wiPT10eXBlb2Yobi5zcmM9ZSkmJihcIm51bWJlclwiPT10eXBlb2Yobz1uLmF1ZGlvSUQpJiYwPD1vJiZ5LmdldFN0YXRlKG8pPT09Zy5QQVVTRUQmJnQhPT1lJiYoeS5zdG9wKG8pLG4uYXVkaW9JRD0tMSksdGhpcy5hdXRvcGxheSYmdGhpcy5wbGF5KCkpKX0sZ2V0OmZ1bmN0aW9uKCl7dmFyIGU9ai5nZXQodGhpcyk7cmV0dXJuIGU/ZS5zcmM6XCJcIn19KSxPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcyxcImR1cmF0aW9uXCIse2dldDpmdW5jdGlvbigpe3ZhciBlPWouZ2V0KHRoaXMpO2lmKGUpe2U9ZS5hdWRpb0lEO2lmKFwibnVtYmVyXCI9PXR5cGVvZiBlJiYwPD1lKXJldHVybiB5LmdldER1cmF0aW9uKGUpfXJldHVybiBOYU59LHNldDpmdW5jdGlvbigpe319KSxPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcyxcImN1cnJlbnRUaW1lXCIse2dldDpmdW5jdGlvbigpe3ZhciBlPWouZ2V0KHRoaXMpO2lmKGUpe2U9ZS5hdWRpb0lEO2lmKFwibnVtYmVyXCI9PXR5cGVvZiBlJiYwPD1lKXJldHVybiB5LmdldEN1cnJlbnRUaW1lKGUpfXJldHVybiAwfSxzZXQ6ZnVuY3Rpb24oKXt9fSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsXCJwYXVzZWRcIix7Z2V0OmZ1bmN0aW9uKCl7dmFyIGU9ai5nZXQodGhpcyk7aWYoZSl7ZT1lLmF1ZGlvSUQ7aWYoXCJudW1iZXJcIj09dHlwZW9mIGUmJjA8PWUpcmV0dXJuIHkuZ2V0U3RhdGUoZSk9PT1nLlBBVVNFRH1yZXR1cm4hMH0sc2V0OmZ1bmN0aW9uKCl7fX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLFwiYnVmZmVyZWRcIix7Z2V0OmZ1bmN0aW9uKCl7dmFyIGU9ai5nZXQodGhpcyk7aWYoZSl7ZT1lLmF1ZGlvSUQ7aWYoXCJudW1iZXJcIj09dHlwZW9mIGUmJjA8PWUpcmV0dXJuIHkuZ2V0QnVmZmVyZWQoZSl9cmV0dXJuIDB9LHNldDpmdW5jdGlvbigpe319KX1vPVQucHJvdG90eXBlO28uZGVzdHJveT1mdW5jdGlvbigpe3ZhciBlLHQ9ai5nZXQodGhpcyk7dCYmKFwibnVtYmVyXCI9PXR5cGVvZihlPXQuYXVkaW9JRCkmJjA8PWUmJih5LnN0b3AoZSksdC5hdWRpb0lEPS0xLGkodGhpcyxoKSksdFthXT1bXSx0W3VdPVtdLHRbY109W10sdFtzXT1bXSx0W2ZdPVtdLHRbbF09W10sdFtkXT1bXSx0W2hdPVtdLHRbcF09W10sdFtiXT1bXSxjbGVhckludGVydmFsKHQuaW50ZXJ2YWxJRCkpfSxvLnBsYXk9ZnVuY3Rpb24oKXt2YXIgZT1qLmdldCh0aGlzKTtpZihlKXt2YXIgdCxvPWUuc3JjLG49ZS5hdWRpb0lEO2lmKFwic3RyaW5nXCI9PXR5cGVvZiBvJiZcIlwiIT09byl7aWYoXCJudW1iZXJcIj09dHlwZW9mIG4mJjA8PW4pe2lmKHkuZ2V0U3RhdGUobik9PT1nLlBBVVNFRClyZXR1cm4geS5yZXN1bWUobiksdm9pZCBpKHRoaXMsZik7eS5zdG9wKG4pLGUuYXVkaW9JRD0tMX0tMSE9PShuPXkucGxheShvLHRoaXMubG9vcCx0aGlzLnZvbHVtZSkpPyhlLmF1ZGlvSUQ9bixcIm51bWJlclwiPT10eXBlb2YgdGhpcy5zdGFydFRpbWUmJjA8dGhpcy5zdGFydFRpbWUmJnkuc2V0Q3VycmVudFRpbWUobix0aGlzLnN0YXJ0VGltZSksaSh0aGlzLGIpLHQ9dGhpcyx5LnNldENhblBsYXlDYWxsYmFjayhuLGZ1bmN0aW9uKCl7bz09PXQuc3JjJiYoaSh0LGEpLGkodCxmKSl9KSx5LnNldFdhaXRpbmdDYWxsYmFjayhuLGZ1bmN0aW9uKCl7bz09PXQuc3JjJiZpKHQsYil9KSx5LnNldEVycm9yQ2FsbGJhY2sobixmdW5jdGlvbigpe289PT10LnNyYyYmKGUuYXVkaW9JRD0tMSxpKHQsYykpfSkseS5zZXRGaW5pc2hDYWxsYmFjayhuLGZ1bmN0aW9uKCl7bz09PXQuc3JjJiYoZS5hdWRpb0lEPS0xLGkodCx1KSl9KSk6aSh0aGlzLGMsW3tlcnJNc2c6XCJ1bmtub3duXCIsZXJyQ29kZTp2fV0pfWVsc2UgaSh0aGlzLGMsW3tlcnJNc2c6XCJpbnZhbGlkIHNyY1wiLGVyckNvZGU6bX1dKX19LG8ucGF1c2U9ZnVuY3Rpb24oKXt2YXIgZT1qLmdldCh0aGlzKTshZXx8XCJudW1iZXJcIj09dHlwZW9mKGU9ZS5hdWRpb0lEKSYmMDw9ZSYmKHkucGF1c2UoZSksaSh0aGlzLHMpKX0sby5zZWVrPWZ1bmN0aW9uKGUpe3ZhciB0PWouZ2V0KHRoaXMpO3QmJlwibnVtYmVyXCI9PXR5cGVvZiBlJiYwPD1lJiYoXCJudW1iZXJcIj09dHlwZW9mKHQ9dC5hdWRpb0lEKSYmMDw9dCYmKHkuc2V0Q3VycmVudFRpbWUodCxlKSxpKHRoaXMsZCksaSh0aGlzLGwpKSl9LG8uc3RvcD1mdW5jdGlvbigpe3ZhciBlLHQ9ai5nZXQodGhpcyk7IXR8fFwibnVtYmVyXCI9PXR5cGVvZihlPXQuYXVkaW9JRCkmJjA8PWUmJih5LnN0b3AoZSksdC5hdWRpb0lEPS0xLGkodGhpcyxoKSl9LG8ub2ZmQ2FucGxheT1mdW5jdGlvbihlKXtuKHRoaXMsYSxlKX0sby5vZmZFbmRlZD1mdW5jdGlvbihlKXtuKHRoaXMsdSxlKX0sby5vZmZFcnJvcj1mdW5jdGlvbihlKXtuKHRoaXMsYyxlKX0sby5vZmZQYXVzZT1mdW5jdGlvbihlKXtuKHRoaXMscyxlKX0sby5vZmZQbGF5PWZ1bmN0aW9uKGUpe24odGhpcyxmLGUpfSxvLm9mZlNlZWtlZD1mdW5jdGlvbihlKXtuKHRoaXMsbCxlKX0sby5vZmZTZWVraW5nPWZ1bmN0aW9uKGUpe24odGhpcyxkLGUpfSxvLm9mZlN0b3A9ZnVuY3Rpb24oZSl7bih0aGlzLGgsZSl9LG8ub2ZmVGltZVVwZGF0ZT1mdW5jdGlvbihlKXsxPT09bih0aGlzLHAsZSkmJmNsZWFySW50ZXJ2YWwoai5nZXQodGhpcykuaW50ZXJ2YWxJRCl9LG8ub2ZmV2FpdGluZz1mdW5jdGlvbihlKXtuKHRoaXMsYixlKX0sby5vbkNhbnBsYXk9ZnVuY3Rpb24oZSl7cih0aGlzLGEsZSl9LG8ub25FbmRlZD1mdW5jdGlvbihlKXtyKHRoaXMsdSxlKX0sby5vbkVycm9yPWZ1bmN0aW9uKGUpe3IodGhpcyxjLGUpfSxvLm9uUGF1c2U9ZnVuY3Rpb24oZSl7cih0aGlzLHMsZSl9LG8ub25QbGF5PWZ1bmN0aW9uKGUpe3IodGhpcyxmLGUpfSxvLm9uU2Vla2VkPWZ1bmN0aW9uKGUpe3IodGhpcyxsLGUpfSxvLm9uU2Vla2luZz1mdW5jdGlvbihlKXtyKHRoaXMsXCJzZWVraW5nQ2FsbGJhY2tzXCIsZSl9LG8ub25TdG9wPWZ1bmN0aW9uKGUpe3IodGhpcyxoLGUpfSxvLm9uVGltZVVwZGF0ZT1mdW5jdGlvbihlKXt2YXIgdCxvOzE9PT1yKHRoaXMscCxlKSYmKGU9ai5nZXQodGhpcyksdD10aGlzLG89c2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXt2YXIgZT1qLmdldCh0KTtlP1wibnVtYmVyXCI9PXR5cGVvZihlPWUuYXVkaW9JRCkmJjA8PWUmJnkuZ2V0U3RhdGUoZSk9PT1nLlBMQVlJTkcmJmkodCxwKTpjbGVhckludGVydmFsKG8pfSw1MDApLGUuaW50ZXJ2YWxJRD1vKX0sby5vbldhaXRpbmc9ZnVuY3Rpb24oZSl7cih0aGlzLGIsZSl9fSx7fV0sMjpbZnVuY3Rpb24oZSx0LG8pe1widXNlIHN0cmljdFwiO3ZhciBuLHI9KG49ZShcIi4uLy4uL3V0aWxcIikpJiZuLl9fZXNNb2R1bGU/bjp7ZGVmYXVsdDpufTt2YXIgaT1sb2FkUnVudGltZSgpO3IuZGVmYXVsdC5leHBvcnRUbyhcIm9uU2hvd1wiLGksanNiKSxyLmRlZmF1bHQuZXhwb3J0VG8oXCJvbkhpZGVcIixpLGpzYiksci5kZWZhdWx0LmV4cG9ydFRvKFwib2ZmU2hvd1wiLGksanNiKSxyLmRlZmF1bHQuZXhwb3J0VG8oXCJvZmZIaWRlXCIsaSxqc2IpfSx7XCIuLi8uLi91dGlsXCI6MjB9XSwzOltmdW5jdGlvbihlLHQsbyl7XCJ1c2Ugc3RyaWN0XCI7dmFyIG4scj0obj1lKFwiLi4vLi4vdXRpbFwiKSkmJm4uX19lc01vZHVsZT9uOntkZWZhdWx0Om59O3ZhciBpPWxvYWRSdW50aW1lKCk7ci5kZWZhdWx0LmV4cG9ydFRvKFwibG9hZFN1YnBhY2thZ2VcIixpLGpzYil9LHtcIi4uLy4uL3V0aWxcIjoyMH1dLDQ6W2Z1bmN0aW9uKGUsdCxvKXtcInVzZSBzdHJpY3RcIjt2YXIgbixyPShuPWUoXCIuLi8uLi91dGlsXCIpKSYmbi5fX2VzTW9kdWxlP246e2RlZmF1bHQ6bn07dmFyIGk9bG9hZFJ1bnRpbWUoKTtyLmRlZmF1bHQuZXhwb3J0VG8oXCJlbnZcIixpLGpzYiksci5kZWZhdWx0LmV4cG9ydFRvKFwiZ2V0U3lzdGVtSW5mb1wiLGksanNiKSxyLmRlZmF1bHQuZXhwb3J0VG8oXCJnZXRTeXN0ZW1JbmZvU3luY1wiLGksanNiKX0se1wiLi4vLi4vdXRpbFwiOjIwfV0sNTpbZnVuY3Rpb24oZSx0LG8pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHMoZSl7Zm9yKHZhciB0LG89MDtvPGwubGVuZ3RoO28rKylpZih0PWxbb10sZS5pZGVudGlmaWVyPT09dC5pZGVudGlmaWVyKXJldHVybiBvO3JldHVybi0xfWZ1bmN0aW9uIGYoZSx0KXtmb3IodmFyIG8gaW4gZSllLmhhc093blByb3BlcnR5KG8pJiYodFtvXT1lW29dKX12YXIgbj1sb2FkUnVudGltZSgpLGw9W10sZD17dG91Y2hzdGFydDpbXSx0b3VjaG1vdmU6W10sdG91Y2hlbmQ6W10sdG91Y2hjYW5jZWw6W119O2Z1bmN0aW9uIHIoZSx0KXtmb3IodmFyIG89ZFtlXXx8W10sbj1vLmxlbmd0aCxyPTA7cjxuOysrcilpZih0PT09b1tyXSlyZXR1cm4gdm9pZCBvLnNwbGljZShyLDEpfXZhciBoPSExLGk9bi5nZXRTeXN0ZW1JbmZvU3luYygpO3dpbmRvdy5pbm5lcldpZHRoJiZpLndpbmRvd1dpZHRoIT09d2luZG93LmlubmVyV2lkdGgmJihoPSEwKTtpPWZ1bmN0aW9uKGMpe3JldHVybiBmdW5jdGlvbihlKXtpZihcImZ1bmN0aW9uXCIhPXR5cGVvZiBlKXt2YXIgdCxvPW5ldyBUb3VjaEV2ZW50KGMpO1widG91Y2hzdGFydFwiPT09Yz9lLmZvckVhY2goZnVuY3Rpb24oZSl7MDw9KHQ9cyhlKSk/ZihlLGxbdF0pOihmKGUsZT17fSksbC5wdXNoKGUpKX0pOlwidG91Y2htb3ZlXCI9PT1jP2UuZm9yRWFjaChmdW5jdGlvbihlKXswPD0odD1zKGUpKSYmZihlLGxbdF0pfSk6XCJ0b3VjaGVuZFwiIT09YyYmXCJ0b3VjaGNhbmNlbFwiIT09Y3x8ZS5mb3JFYWNoKGZ1bmN0aW9uKGUpezA8PSh0PXMoZSkpJiZsLnNwbGljZSh0LDEpfSk7dmFyIHI9W10uY29uY2F0KGwpLGk9W107ZS5mb3JFYWNoKGZ1bmN0aW9uKGUpe2Zvcih2YXIgdD1yLmxlbmd0aCxvPTA7bzx0Oysrbyl7dmFyIG49cltvXTtpZihlLmlkZW50aWZpZXI9PT1uLmlkZW50aWZpZXIpcmV0dXJuIHZvaWQgaS5wdXNoKG4pfWkucHVzaChlKX0pLG8udG91Y2hlcz1yLG8udGFyZ2V0VG91Y2hlcz1yLG8uY2hhbmdlZFRvdWNoZXM9aSxoJiYoci5mb3JFYWNoKGZ1bmN0aW9uKGUpe2UuY2xpZW50WC89d2luZG93LmRldmljZVBpeGVsUmF0aW8sZS5jbGllbnRZLz13aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyxlLnBhZ2VYLz13aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyxlLnBhZ2VZLz13aW5kb3cuZGV2aWNlUGl4ZWxSYXRpb30pLFwidG91Y2hjYW5jZWxcIiE9PWMmJlwidG91Y2hlbmRcIiE9PWN8fGkuZm9yRWFjaChmdW5jdGlvbihlKXtlLmNsaWVudFgvPXdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvLGUuY2xpZW50WS89d2luZG93LmRldmljZVBpeGVsUmF0aW8sZS5wYWdlWC89d2luZG93LmRldmljZVBpeGVsUmF0aW8sZS5wYWdlWS89d2luZG93LmRldmljZVBpeGVsUmF0aW99KSk7Zm9yKHZhciBuPWRbY10sYT1uLmxlbmd0aCx1PTA7dTxhO3UrKyluW3VdKG8pfWVsc2UhZnVuY3Rpb24oZSl7Zm9yKHZhciB0PWRbY10sbz0wLG49dC5sZW5ndGg7bzxuO28rKylpZihlPT09dFtvXSlyZXR1cm47dC5wdXNoKGUpfShlKX19O24ub25Ub3VjaFN0YXJ0Pyhqc2Iub25Ub3VjaFN0YXJ0PW4ub25Ub3VjaFN0YXJ0LGpzYi5vZmZUb3VjaFN0YXJ0PW4ub2ZmVG91Y2hTdGFydCk6KGpzYi5vblRvdWNoU3RhcnQ9aShcInRvdWNoc3RhcnRcIiksanNiLm9mZlRvdWNoU3RhcnQ9ZnVuY3Rpb24oZSl7cihcInRvdWNoc3RhcnRcIixlKX0pLG4ub25Ub3VjaE1vdmU/KGpzYi5vblRvdWNoTW92ZT1uLm9uVG91Y2hNb3ZlLGpzYi5vZmZUb3VjaE1vdmU9bi5vZmZUb3VjaE1vdmUpOihqc2Iub25Ub3VjaE1vdmU9aShcInRvdWNobW92ZVwiKSxqc2Iub2ZmVG91Y2hNb3ZlPWZ1bmN0aW9uKGUpe3IoXCJ0b3VjaG1vdmVcIixlKX0pLG4ub25Ub3VjaENhbmNlbD8oanNiLm9uVG91Y2hDYW5jZWw9bi5vblRvdWNoQ2FuY2VsLGpzYi5vZmZUb3VjaENhbmNlbD1uLm9mZlRvdWNoQ2FuY2VsKTooanNiLm9uVG91Y2hDYW5jZWw9aShcInRvdWNoY2FuY2VsXCIpLGpzYi5vZmZUb3VjaENhbmNlbD1mdW5jdGlvbihlKXtyKFwidG91Y2hjYW5jZWxcIixlKX0pLG4ub25Ub3VjaEVuZD8oanNiLm9uVG91Y2hFbmQ9bi5vblRvdWNoRW5kLGpzYi5vZmZUb3VjaEVuZD1uLm9mZlRvdWNoRW5kKTooanNiLm9uVG91Y2hFbmQ9aShcInRvdWNoZW5kXCIpLGpzYi5vZmZUb3VjaEVuZD1mdW5jdGlvbihlKXtyKFwidG91Y2hlbmRcIixlKX0pfSx7fV0sNjpbZnVuY3Rpb24oZSx0LG8pe1widXNlIHN0cmljdFwiO3ZhciBuLHIsaSxhPWxvYWRSdW50aW1lKCksdT1hLmdldFN5c3RlbUluZm9TeW5jKCksYz1bXTtqc2IuZGV2aWNlPWpzYi5kZXZpY2V8fHt9LGEub2ZmQWNjZWxlcm9tZXRlckNoYW5nZT8obj1bMCwwLDBdLHI9ZnVuY3Rpb24odCl7blswXT0uOCpuWzBdKygxLS44KSp0LngsblsxXT0uOCpuWzFdKygxLS44KSp0LnksblsyXT0uOCpuWzJdKygxLS44KSp0LnosYy5mb3JFYWNoKGZ1bmN0aW9uKGUpe2Uoe2FjY2VsZXJhdGlvbjp7eDp0LngtblswXSx5OnQueS1uWzFdLHo6dC56LW5bMl19LGFjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHk6e3g6dC54LHk6dC55LHo6dC56fX0pfSl9LGk9XCJhbmRyb2lkXCI9PT11LnBsYXRmb3JtLnRvTG93ZXJDYXNlKCk/ZnVuY3Rpb24oZSl7ZS54Kj0tMTAsZS55Kj0tMTAsZS56Kj0tMTAscihlKX06ZnVuY3Rpb24oZSl7ZS54Kj0xMCxlLnkqPTEwLGUueio9MTAscihlKX0sanNiLm9uQWNjZWxlcm9tZXRlckNoYW5nZT1mdW5jdGlvbihlKXtpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBlKXtmb3IodmFyIHQ9Yy5sZW5ndGgsbz0wO288dDsrK28paWYoZT09PWNbb10pcmV0dXJuO2MucHVzaChlKSwwPT09dCYmYS5vbkFjY2VsZXJvbWV0ZXJDaGFuZ2UoaSl9fSxqc2Iub2ZmQWNjZWxlcm9tZXRlckNoYW5nZT1mdW5jdGlvbihlKXtmb3IodmFyIHQ9Yy5sZW5ndGgsbz0wO288dDsrK28paWYoZT09PWNbb10pcmV0dXJuIGMuc3BsaWNlKG8sMSksdm9pZCgxPT09dCYmYS5vZmZBY2NlbGVyb21ldGVyQ2hhbmdlKGkpKX0sanNiLnN0b3BBY2NlbGVyb21ldGVyPWEuc3RvcEFjY2VsZXJvbWV0ZXIuYmluZChhKSxqc2Iuc3RhcnRBY2NlbGVyb21ldGVyPWEuc3RhcnRBY2NlbGVyb21ldGVyLmJpbmQoYSksanNiLmRldmljZS5zZXRNb3Rpb25FbmFibGVkPWZ1bmN0aW9uKGUpe2U/YS5zdGFydEFjY2VsZXJvbWV0ZXIoe3R5cGU6XCJhY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5XCJ9KTphLnN0b3BBY2NlbGVyb21ldGVyKHt9KX0pOihqc2Iub25BY2NlbGVyb21ldGVyQ2hhbmdlPWZ1bmN0aW9uKGUpe2lmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGUpe2Zvcih2YXIgdD1jLmxlbmd0aCxvPTA7bzx0OysrbylpZihlPT09Y1tvXSlyZXR1cm47Yy5wdXNoKGUpfX0sanNiLm9mZkFjY2VsZXJvbWV0ZXJDaGFuZ2U9ZnVuY3Rpb24oZSl7Zm9yKHZhciB0PWMubGVuZ3RoLG89MDtvPHQ7KytvKWlmKGU9PT1jW29dKXJldHVybiB2b2lkIGMuc3BsaWNlKG8sMSl9LGpzYi5kZXZpY2UuZGlzcGF0Y2hEZXZpY2VNb3Rpb25FdmVudD1mdW5jdGlvbih0KXtjLmZvckVhY2goZnVuY3Rpb24oZSl7ZSh0KX0pfSxqc2Iuc3RvcEFjY2VsZXJvbWV0ZXI9ZnVuY3Rpb24oKXtqc2IuZGV2aWNlLnNldE1vdGlvbkVuYWJsZWQoITEpfSxqc2Iuc3RhcnRBY2NlbGVyb21ldGVyPWZ1bmN0aW9uKCl7anNiLmRldmljZS5zZXRNb3Rpb25FbmFibGVkKCEwKX0pfSx7fV0sNzpbZnVuY3Rpb24oZSx0LG8pe1widXNlIHN0cmljdFwiO3ZhciBuLHI9KG49ZShcIi4uLy4uL3V0aWxcIikpJiZuLl9fZXNNb2R1bGU/bjp7ZGVmYXVsdDpufTt2YXIgaT1sb2FkUnVudGltZSgpO3IuZGVmYXVsdC5leHBvcnRUbyhcImdldEJhdHRlcnlJbmZvXCIsaSxqc2IpLHIuZGVmYXVsdC5leHBvcnRUbyhcImdldEJhdHRlcnlJbmZvU3luY1wiLGksanNiKX0se1wiLi4vLi4vdXRpbFwiOjIwfV0sODpbZnVuY3Rpb24oZSx0LG8pe1widXNlIHN0cmljdFwiO3ZhciBuLHI9KG49ZShcIi4uLy4uL3V0aWxcIikpJiZuLl9fZXNNb2R1bGU/bjp7ZGVmYXVsdDpufTt2YXIgaT1sb2FkUnVudGltZSgpO3IuZGVmYXVsdC5leHBvcnRUbyhcImdldEZpbGVTeXN0ZW1NYW5hZ2VyXCIsaSxqc2IpfSx7XCIuLi8uLi91dGlsXCI6MjB9XSw5OltmdW5jdGlvbihlLHQsbyl7XCJ1c2Ugc3RyaWN0XCI7dmFyIG4scj0obj1lKFwiLi4vdXRpbFwiKSkmJm4uX19lc01vZHVsZT9uOntkZWZhdWx0Om59O3dpbmRvdy5qc2J8fCh3aW5kb3cuanNiPXt9KTt2YXIgaT17cnVudGltZU5vbnN1cHBvcnRzOltdfTtyLmRlZmF1bHQud2Vha01hcC5zZXQoanNiLGkpLGpzYi5ydW50aW1lU3VwcG9ydD1mdW5jdGlvbih0KXtyZXR1cm4haS5ydW50aW1lTm9uc3VwcG9ydHMuZmluZChmdW5jdGlvbihlKXtyZXR1cm4gdD09PWV9KX0sZShcIi4vYmFzZS9saWZlY3ljbGVcIiksZShcIi4vYmFzZS9zdWJwYWNrYWdlXCIpLGUoXCIuL2Jhc2Uvc3lzdGVtLWluZm9cIiksZShcIi4vYmFzZS90b3VjaC1ldmVudFwiKSxlKFwiLi9kZXZpY2UvYWNjZWxlcm9tZXRlclwiKSxlKFwiLi9kZXZpY2UvYmF0dGVyeVwiKSxlKFwiLi9maWxlL2ZpbGUtc3lzdGVtLW1hbmFnZXJcIiksZShcIi4vaW50ZXJmYWNlL2tleWJvYXJkXCIpLGUoXCIuL2ludGVyZmFjZS93aW5kb3dcIiksZShcIi4vbWVkaWEvYXVkaW9cIiksZShcIi4vbWVkaWEvdmlkZW9cIiksZShcIi4vbmV0d29yay9kb3dubG9hZFwiKSxlKFwiLi9yZW5kZXJpbmcvY2FudmFzXCIpLGUoXCIuL3JlbmRlcmluZy93ZWJnbFwiKSxlKFwiLi9yZW5kZXJpbmcvZm9udFwiKSxlKFwiLi9yZW5kZXJpbmcvZnJhbWVcIiksZShcIi4vcmVuZGVyaW5nL2ltYWdlXCIpfSx7XCIuLi91dGlsXCI6MjAsXCIuL2Jhc2UvbGlmZWN5Y2xlXCI6MixcIi4vYmFzZS9zdWJwYWNrYWdlXCI6MyxcIi4vYmFzZS9zeXN0ZW0taW5mb1wiOjQsXCIuL2Jhc2UvdG91Y2gtZXZlbnRcIjo1LFwiLi9kZXZpY2UvYWNjZWxlcm9tZXRlclwiOjYsXCIuL2RldmljZS9iYXR0ZXJ5XCI6NyxcIi4vZmlsZS9maWxlLXN5c3RlbS1tYW5hZ2VyXCI6OCxcIi4vaW50ZXJmYWNlL2tleWJvYXJkXCI6MTAsXCIuL2ludGVyZmFjZS93aW5kb3dcIjoxMSxcIi4vbWVkaWEvYXVkaW9cIjoxMixcIi4vbWVkaWEvdmlkZW9cIjoxMyxcIi4vbmV0d29yay9kb3dubG9hZFwiOjE0LFwiLi9yZW5kZXJpbmcvY2FudmFzXCI6MTUsXCIuL3JlbmRlcmluZy9mb250XCI6MTYsXCIuL3JlbmRlcmluZy9mcmFtZVwiOjE3LFwiLi9yZW5kZXJpbmcvaW1hZ2VcIjoxOCxcIi4vcmVuZGVyaW5nL3dlYmdsXCI6MTl9XSwxMDpbZnVuY3Rpb24oZSx0LG8pe1widXNlIHN0cmljdFwiO3ZhciBuLHI9KG49ZShcIi4uLy4uL3V0aWxcIikpJiZuLl9fZXNNb2R1bGU/bjp7ZGVmYXVsdDpufTt2YXIgaT1sb2FkUnVudGltZSgpO3IuZGVmYXVsdC5leHBvcnRUbyhcIm9uS2V5Ym9hcmRJbnB1dFwiLGksanNiKSxyLmRlZmF1bHQuZXhwb3J0VG8oXCJvbktleWJvYXJkQ29uZmlybVwiLGksanNiKSxyLmRlZmF1bHQuZXhwb3J0VG8oXCJvbktleWJvYXJkQ29tcGxldGVcIixpLGpzYiksci5kZWZhdWx0LmV4cG9ydFRvKFwib2ZmS2V5Ym9hcmRJbnB1dFwiLGksanNiKSxyLmRlZmF1bHQuZXhwb3J0VG8oXCJvZmZLZXlib2FyZENvbmZpcm1cIixpLGpzYiksci5kZWZhdWx0LmV4cG9ydFRvKFwib2ZmS2V5Ym9hcmRDb21wbGV0ZVwiLGksanNiKSxyLmRlZmF1bHQuZXhwb3J0VG8oXCJoaWRlS2V5Ym9hcmRcIixpLGpzYiksci5kZWZhdWx0LmV4cG9ydFRvKFwic2hvd0tleWJvYXJkXCIsaSxqc2IpLHIuZGVmYXVsdC5leHBvcnRUbyhcInVwZGF0ZUtleWJvYXJkXCIsaSxqc2IpfSx7XCIuLi8uLi91dGlsXCI6MjB9XSwxMTpbZnVuY3Rpb24oZSx0LG8pe1widXNlIHN0cmljdFwiO3ZhciBuPWxvYWRSdW50aW1lKCkub25XaW5kb3dSZXNpemU7anNiLm9uV2luZG93UmVzaXplPWZ1bmN0aW9uKHQpe24oZnVuY3Rpb24oZSl7dChlLndpZHRofHxlLndpbmRvd1dpZHRoLGUuaGVpZ2h0fHxlLndpbmRvd0hlaWdodCl9KX19LHt9XSwxMjpbZnVuY3Rpb24oZSx0LG8pe1widXNlIHN0cmljdFwiO3ZhciBuPXIoZShcIi4uLy4uL2lubmVyLWNvbnRleHRcIikpLGU9cihlKFwiLi4vLi4vdXRpbFwiKSk7ZnVuY3Rpb24gcihlKXtyZXR1cm4gZSYmZS5fX2VzTW9kdWxlP2U6e2RlZmF1bHQ6ZX19dmFyIGk9bG9hZFJ1bnRpbWUoKTtlLmRlZmF1bHQuZXhwb3J0VG8oXCJBdWRpb0VuZ2luZVwiLGksanNiKSxlLmRlZmF1bHQuZXhwb3J0VG8oXCJjcmVhdGVJbm5lckF1ZGlvQ29udGV4dFwiLGksanNiLGZ1bmN0aW9uKCl7aS5BdWRpb0VuZ2luZSYmKGpzYi5jcmVhdGVJbm5lckF1ZGlvQ29udGV4dD1mdW5jdGlvbigpe3JldHVybigwLG4uZGVmYXVsdCkoaS5BdWRpb0VuZ2luZSl9KX0pfSx7XCIuLi8uLi9pbm5lci1jb250ZXh0XCI6MSxcIi4uLy4uL3V0aWxcIjoyMH1dLDEzOltmdW5jdGlvbihlLHQsbyl7XCJ1c2Ugc3RyaWN0XCI7dmFyIG4scj0obj1lKFwiLi4vLi4vdXRpbFwiKSkmJm4uX19lc01vZHVsZT9uOntkZWZhdWx0Om59O3ZhciBpPWxvYWRSdW50aW1lKCk7ci5kZWZhdWx0LmV4cG9ydFRvKFwiY3JlYXRlVmlkZW9cIixpLGpzYil9LHtcIi4uLy4uL3V0aWxcIjoyMH1dLDE0OltmdW5jdGlvbihlLHQsbyl7XCJ1c2Ugc3RyaWN0XCI7dmFyIG4scj0obj1lKFwiLi4vLi4vdXRpbFwiKSkmJm4uX19lc01vZHVsZT9uOntkZWZhdWx0Om59O3ZhciBpPWxvYWRSdW50aW1lKCk7ci5kZWZhdWx0LmV4cG9ydFRvKFwiZG93bmxvYWRGaWxlXCIsaSxqc2IpfSx7XCIuLi8uLi91dGlsXCI6MjB9XSwxNTpbZnVuY3Rpb24oZSx0LG8pe1widXNlIHN0cmljdFwiO3ZhciBuLHI9KG49ZShcIi4uLy4uL3V0aWxcIikpJiZuLl9fZXNNb2R1bGU/bjp7ZGVmYXVsdDpufTt2YXIgaT1sb2FkUnVudGltZSgpO3IuZGVmYXVsdC5leHBvcnRUbyhcImNyZWF0ZUNhbnZhc1wiLGksanNiLGZ1bmN0aW9uKCl7ZG9jdW1lbnQmJlwiZnVuY3Rpb25cIj09dHlwZW9mIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQmJihqc2IuY3JlYXRlQ2FudmFzPWZ1bmN0aW9uKCl7cmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIil9KX0pfSx7XCIuLi8uLi91dGlsXCI6MjB9XSwxNjpbZnVuY3Rpb24oZSx0LG8pe1widXNlIHN0cmljdFwiO3ZhciBuLHI9KG49ZShcIi4uLy4uL3V0aWxcIikpJiZuLl9fZXNNb2R1bGU/bjp7ZGVmYXVsdDpufTt2YXIgaT1sb2FkUnVudGltZSgpO3IuZGVmYXVsdC5leHBvcnRUbyhcImxvYWRGb250XCIsaSxqc2IpfSx7XCIuLi8uLi91dGlsXCI6MjB9XSwxNzpbZnVuY3Rpb24oZSx0LG8pe1widXNlIHN0cmljdFwiO3ZhciBuPWxvYWRSdW50aW1lKCk7anNiLnNldFByZWZlcnJlZEZyYW1lc1BlclNlY29uZD9qc2Iuc2V0UHJlZmVycmVkRnJhbWVzUGVyU2Vjb25kPWpzYi5zZXRQcmVmZXJyZWRGcmFtZXNQZXJTZWNvbmQuYmluZChqc2IpOm4uc2V0UHJlZmVycmVkRnJhbWVzUGVyU2Vjb25kP2pzYi5zZXRQcmVmZXJyZWRGcmFtZXNQZXJTZWNvbmQ9bi5zZXRQcmVmZXJyZWRGcmFtZXNQZXJTZWNvbmQuYmluZChuKTpqc2Iuc2V0UHJlZmVycmVkRnJhbWVzUGVyU2Vjb25kPWZ1bmN0aW9uKCl7Y29uc29sZS5lcnJvcihcIlRoZSBzZXRQcmVmZXJyZWRGcmFtZXNQZXJTZWNvbmQgaXMgbm90IGRlZmluZSFcIil9fSx7fV0sMTg6W2Z1bmN0aW9uKGUsdCxvKXtcInVzZSBzdHJpY3RcIjt2YXIgbixyPShuPWUoXCIuLi8uLi91dGlsXCIpKSYmbi5fX2VzTW9kdWxlP246e2RlZmF1bHQ6bn07dmFyIGk9bG9hZFJ1bnRpbWUoKTtyLmRlZmF1bHQuZXhwb3J0VG8oXCJsb2FkSW1hZ2VEYXRhXCIsaSxqc2IpLHIuZGVmYXVsdC5leHBvcnRUbyhcImNyZWF0ZUltYWdlXCIsaSxqc2IsZnVuY3Rpb24oKXtkb2N1bWVudCYmXCJmdW5jdGlvblwiPT10eXBlb2YgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCYmKGpzYi5jcmVhdGVJbWFnZT1mdW5jdGlvbigpe3JldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1hZ2VcIil9KX0pfSx7XCIuLi8uLi91dGlsXCI6MjB9XSwxOTpbZnVuY3Rpb24oZSx0LG8pe1widXNlIHN0cmljdFwiO3ZhciBoLHAsYjt3aW5kb3cuX19nbCYmKGg9d2luZG93Ll9fZ2wscD1oLnRleEltYWdlMkQsaC50ZXhJbWFnZTJEPWZ1bmN0aW9uKGUsdCxvLG4scixpLGEsdSxjKXt2YXIgcyxmLGwsZD1hcmd1bWVudHMubGVuZ3RoOzY9PT1kPyh1PXIsYT1uLChzPWkpaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50PyhmPWNvbnNvbGUuZXJyb3IsY29uc29sZS5lcnJvcj1mdW5jdGlvbigpe30scC5hcHBseSh2b2lkIDAsYXJndW1lbnRzKSxjb25zb2xlLmVycm9yPWYsaC50ZXhJbWFnZTJEX2ltYWdlKGUsdCxzLl9pbWFnZU1ldGEpKTpzIGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQ/KGw9Y29uc29sZS5lcnJvcixjb25zb2xlLmVycm9yPWZ1bmN0aW9uKCl7fSxwLmFwcGx5KHZvaWQgMCxhcmd1bWVudHMpLGNvbnNvbGUuZXJyb3I9bCxsPXMuZ2V0Q29udGV4dChcIjJkXCIpLGgudGV4SW1hZ2UyRF9jYW52YXMoZSx0LG8sYSx1LGwpKTpzIGluc3RhbmNlb2YgSW1hZ2VEYXRhPyhsPWNvbnNvbGUuZXJyb3IsY29uc29sZS5lcnJvcj1mdW5jdGlvbigpe30scChlLHQsbyxzLndpZHRoLHMuaGVpZ2h0LDAsYSx1LHMuZGF0YSksY29uc29sZS5lcnJvcj1sKTpjb25zb2xlLmVycm9yKFwiSW52YWxpZCBwaXhlbCBhcmd1bWVudCBwYXNzZWQgdG8gZ2wudGV4SW1hZ2UyRCFcIikpOjk9PT1kP3AoZSx0LG8sbixyLGksYSx1LGMpOmNvbnNvbGUuZXJyb3IoXCJnbC50ZXhJbWFnZTJEOiBpbnZhbGlkIGFyZ3VtZW50IGNvdW50IVwiKX0sYj1oLnRleFN1YkltYWdlMkQsaC50ZXhTdWJJbWFnZTJEPWZ1bmN0aW9uKGUsdCxvLG4scixpLGEsdSxjKXt2YXIgcyxmLGwsZD1hcmd1bWVudHMubGVuZ3RoOzc9PT1kPyhzPWEsdT1pLGE9cixzIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudD8oZj1jb25zb2xlLmVycm9yLGNvbnNvbGUuZXJyb3I9ZnVuY3Rpb24oKXt9LGIuYXBwbHkodm9pZCAwLGFyZ3VtZW50cyksY29uc29sZS5lcnJvcj1mLGgudGV4U3ViSW1hZ2UyRF9pbWFnZShlLHQsbyxuLHMuX2ltYWdlTWV0YSkpOnMgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudD8obD1jb25zb2xlLmVycm9yLGNvbnNvbGUuZXJyb3I9ZnVuY3Rpb24oKXt9LGIuYXBwbHkodm9pZCAwLGFyZ3VtZW50cyksY29uc29sZS5lcnJvcj1sLGw9cy5nZXRDb250ZXh0KFwiMmRcIiksaC50ZXhTdWJJbWFnZTJEX2NhbnZhcyhlLHQsbyxuLGEsdSxsKSk6cyBpbnN0YW5jZW9mIEltYWdlRGF0YT8obD1jb25zb2xlLmVycm9yLGNvbnNvbGUuZXJyb3I9ZnVuY3Rpb24oKXt9LGIoZSx0LG8sbixzLndpZHRoLHMuaGVpZ2h0LGEsdSxzLmRhdGEpLGNvbnNvbGUuZXJyb3I9bCk6Y29uc29sZS5lcnJvcihcIkludmFsaWQgcGl4ZWwgYXJndW1lbnQgcGFzc2VkIHRvIGdsLnRleEltYWdlMkQhXCIpKTo5PT09ZD9iKGUsdCxvLG4scixpLGEsdSxjKTpjb25zb2xlLmVycm9yKG5ldyBFcnJvcihcImdsLnRleEltYWdlMkQ6IGludmFsaWQgYXJndW1lbnQgY291bnQhXCIpLnN0YWNrKX0pfSx7fV0sMjA6W2Z1bmN0aW9uKGUsdCxvKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBpKGUpe3JldHVybihpPVwiZnVuY3Rpb25cIj09dHlwZW9mIFN5bWJvbCYmXCJzeW1ib2xcIj09dHlwZW9mIFN5bWJvbC5pdGVyYXRvcj9mdW5jdGlvbihlKXtyZXR1cm4gdHlwZW9mIGV9OmZ1bmN0aW9uKGUpe3JldHVybiBlJiZcImZ1bmN0aW9uXCI9PXR5cGVvZiBTeW1ib2wmJmUuY29uc3RydWN0b3I9PT1TeW1ib2wmJmUhPT1TeW1ib2wucHJvdG90eXBlP1wic3ltYm9sXCI6dHlwZW9mIGV9KShlKX1PYmplY3QuZGVmaW5lUHJvcGVydHkobyxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KSxvLmRlZmF1bHQ9dm9pZCAwO3ZhciBuPXtleHBvcnRUbzpmdW5jdGlvbihlLHQsbyxuKXt2YXIgcjtcIm9iamVjdFwiPT09aSh0KSYmXCJvYmplY3RcIj09PWkobyk/dm9pZCAwIT09KHI9dFtlXSk/XCJmdW5jdGlvblwiPT10eXBlb2Ygcj8ob1tlXT1yLmJpbmQodCksT2JqZWN0LmFzc2lnbihvW2VdLHIpKTpvW2VdPXI6KHRoaXMud2Vha01hcC5nZXQobykucnVudGltZU5vbnN1cHBvcnRzLnB1c2goZSksb1tlXT1mdW5jdGlvbigpe3JldHVybiBjb25zb2xlLmVycm9yKGUrXCIgaXMgbm90IHN1cHBvcnQhXCIpLHt9fSxcImZ1bmN0aW9uXCI9PXR5cGVvZiBuJiZuKCkpOmNvbnNvbGUud2FybihcImludmFsaWQgZXhwb3J0VG86IFwiLGUpfSx3ZWFrTWFwOm5ldyBXZWFrTWFwfTtvLmRlZmF1bHQ9bn0se31dfSx7fSxbOV0pOyJdLCJmaWxlIjoianNiLmpzIn0=
