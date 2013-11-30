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

            // 隐藏 DOM 节点
            topic.DOM.style.display = 'none';

            // 增加恢复功能
        });
    };

    utils.blockThreads = function() {};

    module.exports = utils;
});
