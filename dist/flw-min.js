"use strict";(function(){var n=function(n,t,e){return setTimeout(n,0,t,e)},t={},e=["_store","_stop","_stopped","_clean","_flw_store"];function r(t,e,r,u){void 0===u&&(u=r,r=e,e=3),e<=0&&(e=1);var o=0,i=0,f=0,c=t.length,l=[];return function p(){if(f>=c)return u(null,l);for(;o<c&&i<e;)n(r,t[o++],a),i++;return;function a(n,t){return n?u(n):(l.push(t),i--,f++,p())}}()}function u(n){if(!n.hasOwnProperty("_stopped"))return n._stopped=null,Object.defineProperty(n,"_stop",{enumerable:!1,configurable:!1,writable:!1,value:function(t,e){return e||"function"!=typeof t||(e=t,t="stopped"),n._stopped=t,e()}}),Object.defineProperty(n,"_store",{enumerable:!1,configurable:!1,value:t}),Object.defineProperty(n,"_clean",{enumerable:!1,configurable:!1,value:function(){var n=this,t={};return Object.keys(this).forEach(function(r){-1===e.indexOf(r)&&(t[r]=n[r])}),t}}),Object.defineProperty(n,"_flw_store",{enumerable:!1,configurable:!1,writable:!1,value:t}),n;function t(n,t){var e=this;return function(r,u){return r?t(r):(e[n]=u,t())}}}"function"==typeof require&&(n=setImmediate),t.series=function(t,e,r,o){"function"!=typeof o&&("function"==typeof e?(o=e,r=void 0,e={}):"function"==typeof r&&(o=r,"object"==typeof e?r=void 0:(r=e,e={})));var i=0,f=t.length;return u(e),f<=0?l(null):c();function c(){if(e._stopped)return l(null);n(t[i],e,l)}function l(n){return n?o(n,e):++i>=f?o(null,r?e[r]:e):c()}},t.parallel=function(t,e,r,o){"function"!=typeof o&&("function"==typeof e?(o=e,r=void 0,e={}):"function"==typeof r&&(o=r,"object"==typeof e?r=void 0:(r=e,e={})));var i=0,f=t.length,c=!1;if(u(e),f<=0)return p(null);function l(n){return n?p(n):++i>=f?p(n):void 0}function p(n){if(!c)return c=!0,o(n||null,r?e[r]:e)}t.forEach(function(t){return n(t,e,l)})};var o,i={};Object.keys(t).forEach(function(n){i[n]=t[n]}),i.make=(o={},Object.keys(t).forEach(function(n){var e;o[n]=(e=t[n],function(n,t,r){return"string"==typeof t&&(r=t,t={}),function(t,o){if(void 0===o&&"function"==typeof t&&(o=t,u(t={})),"function"!=typeof o)throw new Error("flw: .make - cb !== function");return e(n,t,r,o)}})}),o),i.wrap=function(n,t,e){var r=this;return void 0===e&&"string"==typeof t&&(e=t,t=[]),t||(t=[]),function(u,o){var i=t.slice(t);return i.unshift(r),i.push(function(n,t){return n?o(n):(e&&(u[e]=t),o(null))}),n.bind.apply(n,i)()}},i.eachSeries=function(n,t,e){return r(n,1,t,e)},i.each=r,i.n=function(t,e,r){var u=[];return function o(){if(u.length>=t)return r(null,u);n(e,u.length,function(n,t){return n?r(n):(u.push(t),o())})}()},i.times=function(t,e,r){var u=[];return function o(){if(u.length>=t)return r(null,u);n(e,function(n,t){return n?r(n):(u.push(t),o())})}()},"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=i),exports.flw=i):this.flw=i}).call(this);