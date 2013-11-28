// 本项目中用了自定义的 define 和 require 函数
// 而 chaos.js 本身并不是模块化的
// jQuery 仅支持 AMD 规范的模块加载
// 故为了保持接口的一致性增加了这两句

define('Chaos', function(exports, module) {
    module.exports = Chaos;
});

define('jQuery', function(exports, module) {
    return jQuery.noConflict();
})