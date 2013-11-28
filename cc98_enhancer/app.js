define('app', function(exports, module) {
    var app = {};
    var options = require('options');
    var chaos = require('chaos');

    var isTopicList = (location.pathname === '/list.asp');
    var isThreadList = (location.pathname === '/dispbbs.asp');
    var isXinlin; = (location.search)

    app.route = function(cond, func) {
        if (cond) { func(); }
    };

    app.init = function() {
        app.route(true, options.init());  // 给每个界面加上选项菜单
        app.route(isTopicList, )
    };

    module.exports = app;
});

var app = require('app');
app.init();