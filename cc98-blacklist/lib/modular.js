// simple helper functions to help write modular JavaScript
// from: http://leechan.me/?p=1241
// modified by soda<sodazju@gmail.com>
// TamperMonkey 中似乎无法注入全局名称空间，所以就直接定义全局变量了
(function() {
    var modules = {}, cached = {};

    // @usage: define('id', function(exports, module) {});
    define = function(id, func) {
        modules[id] = {};
        if (func instanceof Function) {
            modules[id].factory = func;
        } else {
            modules[id].exports = func;
        }
    };

    // @usage: var a = require('id');
    require = function(id) {
        if (cached[id]) {
            return cached[id];
        } else {
            return cached[id] = (modules[id].exports || modules[id].factory(modules[id].exports = {}, modules[id]) || modules[id].exports);
        }
    };
})();
