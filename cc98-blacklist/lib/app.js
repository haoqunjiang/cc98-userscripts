define('app', function(exports, module) {
    var app = {};

    var chaos = require('chaos');
    var URLMap = require('CC98URLMap');
    var options = require('options');
    var libcc98 = require('libcc98');
    var ignore = require('ignore');

    app.on = function(cond, func) {
        if (cond) {
            func();
        }
    };

    app.init = function() {
        app.on(true, options.addButton); // 给每个界面加上选项菜单
        // app.on(true, libcc98.test); // 测试 libcc98 组件

        app.on(URLMap.isTopicList(location.href), function() {
            ignore.doIgnore('topics');
        }); // 屏蔽主题帖

        app.on(URLMap.isPostList(location.href), function() {
            ignore.doIgnore('posts');
        }); // 屏蔽回复内容
    };

    module.exports = app;
});

var app = require('app');
app.init();
