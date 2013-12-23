define('app', function(exports, module) {
    var app = {};

    var chaos = require('chaos');
    var URLMap = require('CC98URLMap');
    var options = require('options');
    var libcc98 = require('libcc98');
    var utils = require('utils');

    app.route = function(cond, func) {
        if (cond) {
            func();
        }
    };

    app.init = function() {
        app.route(true, options.addButton); // 给每个界面加上选项菜单
        app.route(true, libcc98.test); // 测试 libcc98 组件
        app.route(URLMap.isTopicList(location.href), function() {
            utils.ignore('topics');
        }); // 屏蔽主题帖
        app.route(URLMap.isPostList(location.href), function() {
            utils.ignore('posts');
        }); // 屏蔽回复内容
    };

    module.exports = app;
});

var app = require('app');
app.init();
