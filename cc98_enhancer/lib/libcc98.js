define('libcc98', function(exports, module) {
    var Q = require('Q');
    var chaos = require('chaos');
    // 不用 jQuery 的 ajax 而用自己写的 q-http 模块
    // 一则因为 jquery.min.js 达 87k，远大于 Q 的大小（YUI 压缩后 17k）
    // 二则是为了练手
    var http = require('q-http');
    var CC98URLMap = require('CC98URLMap');

    // 从 cookie 中获取
    var userInfo;


    var parseTopicList = function(html) {
        var dom;
        if (!html) {
            dom = document;
        } else {
            dom = document.implementation.createHTMLDocument('');
            dom.documentElement.innerHTML = html;
        }

        // for test
        // return dom.querySelector('input[type="submit"]');
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
            deferred = Q.defer();
            promise = deferred.promise.then(parseTopicList);
            deferred.resolve(''); // 不传任何返回值到 parseTopicList，用来告知它现在是在解析当前页
        } else {
            promise = http.get(url, parseTopicList);
        }

        return promise;
    };

    libcc98.getThreadList = function(url, callback) {
        var deferred = Q.defer();

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
