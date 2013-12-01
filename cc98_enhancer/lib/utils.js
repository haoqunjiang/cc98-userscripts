define('utils', function(exports, module) {
    var utils = {};

    var chaos = require('chaos');
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
            blocked.find('a, span, font, td').css('color', '#999');
            blocked.addClass('blocked');
            blocked.hide();

            // 增加恢复功能
            var collapsed = $('<tr class="collapsed-topic"><td colspan="5"></td></tr>');
            var switcher = $('<a class="collapsed-switcher" href="javascript:;"></a>')
            var prompt = $('<span class="collapsed-prompt">该主题已被屏蔽，点击展开</span>');

            switcher.click(function() {
                blocked.toggle();
                prompt.text(prompt.text() === '该主题已被屏蔽，点击展开' ? '主题已展开，点击屏蔽' : '该主题已被屏蔽，点击展开');
            });

            chaos.addStyles([
                '.collapsed-topic td { padding: 0; }',

                '.collapsed-switcher {',
                '   display: block;',
                '   font-size: 12px;',
                '   text-align: center;',
                '   background-color: #eee;',
                '}',
                '.collapsed-switcher:hover { background-color: #ddd; }',

                '.collapsed-switcher .collapsed-prompt { color: #999; }',
                '.collapsed-switcher .collapsed-prompt:hover { color: #333; }',
            ].join('\n'));

            switcher.append(prompt);
            collapsed.children().append(switcher);

            blocked.before(collapsed);
        });
    };

    utils.blockThreads = function() {};

    module.exports = utils;
});
