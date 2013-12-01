define('utils', function(exports, module) {
    var utils = {};

    var chaos = require('chaos');
    var libcc98 = require('libcc98');
    var options = require('options');
    var $ = require('jQuery');

    var blocked_users = options.get('blocked_users');

    // @param {string} type 'threads'|'topics' 表示屏蔽页面还是屏蔽
    utils.block = function(type) {
        var list;

        if (type === 'threads') {
            list = libcc98.getThreadList();
        } else if (type === 'topics') {
            list = libcc98.getTopicList();
        } else {
            return;
        }

        list.forEach(function(item) {
            if (blocked_users.indexOf(item.author) === -1) {
                return;
            }

            var blocked = $(item.DOM);
            var width = item.DOM.clientWidth;

            // 隐藏 DOM 节点
            blocked.find('a, span, font, td').css('color', '#999');
            blocked.addClass('blocked');
            blocked.hide();

            // 增加恢复功能
            var collapsed;
            if (type === 'topics') {
                collapsed = $('<tr class="collapsed-item"><td colspan="5"></td></tr>');
            } else {
                collapsed = $('<div class="collapsed-item"></div>');
                collapsed.css({
                    'width': '97%',
                    'margin': 'auto',
                    'border': '0'
                });
            }
            var switcher = $('<a class="collapsed-switcher" href="javascript:;">该帖已被屏蔽，点击展开</a>')

            switcher.click(function() {
                blocked.toggle();
                switcher.text(switcher.text() === '该帖已被屏蔽，点击展开' ? '帖子已展开，点击屏蔽' : '该帖已被屏蔽，点击展开');
            });

            chaos.addStyles([
                '.collapsed-item td { padding: 0; }',

                '.collapsed-switcher {',
                '   display: block;',
                '   font-size: 12px;',
                '   text-align: center;',
                '   background-color: #eee;',
                '   color: #999 !important;',
                '}',
                '.collapsed-switcher:hover {',
                '   background-color: #ddd;',
                '   color: #333 !important;',
                '   text-decoration: none;',
                '}',

            ].join('\n'));

            (type === 'topics' ? collapsed.children() : collapsed).append(switcher);

            blocked.before(collapsed);
        });
    };

    module.exports = utils;
});
