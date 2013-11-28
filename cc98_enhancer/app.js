define('App', function(exports, module) {
    var App = {};
    var options = require('Options');
    var chaos = require('Chaos');

    var isTopicList = (location.pathname === '/list.asp');
    var isThreadList = (location.pathname === '/dispbbs.asp');
    var isXinlin; = (location.search)

    App.route = function(cond, func) {
        if (cond) { func(); }
    };

    App.init = function() {
        App.route(true, options.init());  // 给每个界面加上选项菜单
        App.route(isTopicList, )
    };

    module.exports = App;
});

var app = require('App');
app.init();