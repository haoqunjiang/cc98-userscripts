// 各种小功能，包括屏蔽、水楼统计、页内搜索

define('utils', function(exports, module) {
    var utils = {};

    var chaos = require('chaos');
    var libcc98 = require('libcc98');
    var options = require('options');
    var $ = require('jQuery');

    var ignored_users = options.get('ignored_users');

    // todo: add "block this" button
    // @param {string} type 'posts'|'topics' 表示屏蔽页面还是屏蔽
    utils.ignore = function(type) {
        var list;

        if (type === 'posts') {
            list = libcc98.getPostList();
        } else if (type === 'topics') {
            list = libcc98.getTopicList();
        } else {
            return;
        }

        list.forEach(function(item) {
            if (ignored_users.indexOf(item.author) === -1) {
                return;
            }

            var ignored = $(item.DOM);
            var width = item.DOM.clientWidth;

            // 隐藏 DOM 节点
            ignored.find('a, span, font, td').css('color', '#999');
            ignored.addClass('ignored');
            ignored.hide();

            // 增加恢复功能
            var collapsed = $((type === 'topics') ? '<tr class="collapsed-item"><td colspan="5"></td></tr>' :
                '<div class="collapsed-item"></div>');

            $('<a class="collapsed-switcher" href="javascript:;">该帖已被屏蔽，点击展开</a>')
                .appendTo(type === 'topics' ? collapsed.children() : collapsed)
                .click(function() {
                    ignored.toggle();
                    this.textContent = (this.textContent === '该帖已被屏蔽，点击展开' ? '帖子已展开，点击屏蔽' : '该帖已被屏蔽，点击展开');
                });

            ignored.before(collapsed);

            chaos.addStyles([
                '.ignored a, .ignored span, .ignored font, .ignored td { color: #999 !important; }',

                '.collapsed-item td { padding: 0; }',
                'div.collapsed-item {',
                '   width: 97%;',
                '   margin: auto;',
                '   border: 0;',
                '}',

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
        });
    };

    module.exports = utils;
});
