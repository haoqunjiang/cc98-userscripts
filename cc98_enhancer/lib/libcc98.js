define('libcc98', function(exports, module) {
    var chaos = require('chaos');
    var $ = require('jQuery');
    var CC98URLMap = require('CC98URLMap');

    var parseTopicList = function(html) {
        var dom;
        if (!html) {
            dom = document;
        } else {
            dom = document.implementation.createHTMLDocument('');
            dom.documentElement.innerHTML = html;
        }
        dom = $(dom);

        // for test
        return dom.find('tr[style="vertical-align: middle;"]');
    };
    var parseThreadList = function(html) {};

    var libcc98 = {};

    libcc98.getTopicList = function(url, callback) {
        var deferred, promise;

        if (callback instanceof Function) {
            libcc98.getTopicList(url).then(callback);
        }

        if (chaos.parseURL(url)['path'] !== 'list.asp') {
            return;
        }

        if (url === location.href) {
            deferred = $.Deferred();
            promise = deferred.promise().then(parseTopicList);
            deferred.resolve(''); // 不传任何返回值到 parseTopicList，用来告知它现在是在解析当前页
        } else {
            promise = $.get(url).then(parseTopicList);
        }

        return promise;
    };

    libcc98.getThreadList = function(url, callback) {
        var deferred = $.Deferred();

        if (callback instanceof Function) {
            libcc98.getThreadList(url).then(callback);
        }

        if (chaos.parseURL(url)['path'] !== 'dispbbs.asp') {
            return;
        }
    };

    libcc98.test = function() {
        libcc98.getTopicList('http://www.cc98.org/list.asp?boardid=182').then(function(topics) {
            console.log(topics);
        });
    };

    return libcc98;
});
