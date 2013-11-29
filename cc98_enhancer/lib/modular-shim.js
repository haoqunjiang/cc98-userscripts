// 本项目中用了自定义的 define 和 require 函数
// 而 chaos.js 本身并不是模块化的
// jQuery 仅支持 AMD 规范的模块加载
// q.js 也与不能直接用于自定义的 define/require
// 故为了保持接口的一致性增加了这两句（考虑到这些库都已经放到了全局命名空间，所以这真的仅仅是为了看上去模块化一点）

define('chaos', function(exports, module) {
    module.exports = chaos;
});

define('jQuery', function(exports, module) {
    return jQuery.noConflict();
});

define('Q', function(exports, module) {
    return Q;
});
