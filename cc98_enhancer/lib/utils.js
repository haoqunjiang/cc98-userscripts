define('utils', function(exports, module) {
    var utils = {};

    var libcc98 = require('libcc98');
    var options = require('options');
    var $ = require('jQuery');

    var blocked_users = options.get('blocked_users');

    utils.blockTopics = function() {
        var topics = libcc98.getTopicList();

        topics.forEach(function(topic) {
            if (blocked_users.indexOf(topic.author) === -1) {
                return;
            }

            var blocked = $(topic.DOM);

            // 隐藏 DOM 节点
            blocked.hide();

            // 增加恢复功能
            var collapsed = $('<tr rowspan="5" class="collapsed-topic"><a href="javascript:;">该主题已被屏蔽</a></tr>');
            collapsed.css({
                'color': '#999',
                'background-color': '#fff',
                'font-size': '12px'
            });
            collapsed.click(function() {
                blocked.toggle()
            });

            blocked.before(collapsed);
        });
    };

    utils.blockThreads = function() {};

    module.exports = utils;
});
