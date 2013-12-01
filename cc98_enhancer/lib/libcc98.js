define('libcc98', function(exports, module) {
    var chaos = require('chaos');
    var $ = require('jQuery');
    var CC98URLMap = require('CC98URLMap');

    var log = function() {
        console.log.apply(console, arguments);
    }

    // 从 cookie 中获取有效信息
    var info = (function() {
        var that = {};
        var cookieObj = chaos.parseCookies(document.cookie);
        var aspsky = chaos.parseQS(cookieObj['aspsky']);

        that.isSimple = (cookieObj['cc98Simple'] === '1');
        that.username = aspsky['username'];
        that.password = aspsky['password'];

        return that;
    })();

    var parseTopicList = function(html) {
        var doc;
        var topicsDOM;
        var topics = [];

        if (!html) {
            doc = document;
        } else {
            doc = document.implementation.createHTMLDocument('');
            doc.documentElement.innerHTML = html;
        }

        topicsDOM = $(doc).find('tr[style="vertical-align: middle;"]');

        topics = topicsDOM.filter(function(index) {
            // 对简版的修正
            if (info.isSimple && index === 0) {
                return false;
            } else {
                return true;
            }
        }).map(function(index, ele) {
            var topic = {};

            var tr = $(ele);

            topic.DOM = ele;
            topic.type = info.isSimple ? tr.children().first().text().trim() : tr.children().children().first().attr('title');
            topic.href = tr.children().eq(1).children('a').attr('href');
            topic.title = tr.children().eq(1).children('a').children().eq(0).text();
            topic.author = tr.children().eq(2).children().eq(0).text() || '匿名';
            topic.lastReplyTime = tr.children().eq(4).children().eq(0).text();
            topic.lastReplyUser = JSON.parse(tr.next().text().replace(/.*'{(.*)}'.*/g, '{$1}'))['usr'];

            return topic;
        }).toArray();

        return topics;
    };

    var parseThreadList = function(html) {
        var doc;
        var threadsDOM;
        var threads = [];

        if (!html) {
            doc = document;
        } else {
            doc = document.implementation.createHTMLDocument('');
            doc.documentElement.innerHTML = html;
        }

        // 98自己的 anchors 也是跳过被删除发言的，所以这里就不考虑了
        var anchors = $('a[name]').filter(function(index) {
            return /^\d{1,2}$/g.test(this.name);
        });

        // 简版
        if (info.isSimple) {
            threads = anchors.map(function(index, ele) {
                var thread = {};
                thread.anchor = parseInt(ele.name, 10);
                thread.DOM; // 整个回复的 DOM，在屏蔽时有用
                thread.authorDOM;
                thread.author;
                thread.time;
                thread.storey; // 每层楼边上服务器给出的楼层数

                thread.annouceid; // 通过「引用」按钮的链接提取

                // 以下可能没有（楼主可见/指定用户可见/回复可见）
                thread.content; // 回复内容
                thread.expression; // 小表情
                thread.title; // 标题

                return thread;
            });
        }

        // 完整版
        threads = anchors.map(function(index, ele) {
            var thread = {};

            var table = $(ele).next();

            thread.anchor = parseInt(ele.name, 10);
            thread.DOM = table.get(0); // 整个回复的 DOM，在屏蔽时有用

            thread.authorDOM = table.children().children().children().eq(0).find('b').parent();
            thread.author = thread.authorDOM.children().eq(0).text();
            thread.time = table.children().children().eq(1).children().eq(0).text().trim();
            thread.quotebtn = table.find('img[src="pic/reply.gif"]').parent(); // 暴露接口方便修改 UI
            thread.annouceid = chaos.parseQS(thread.quotebtn.attr('href'))['replyID']; // 通过「引用」按钮的链接提取
            thread.storey; // 每层楼边上服务器给出的楼层数

            // 以下可能没有（楼主可见/指定用户可见/回复可见）
            thread.content; // 回复内容
            thread.expression; // 小表情
            thread.title; // 标题

            return thread;
        }).toArray();

        return threads;
    };

    var getTopicList = function(url, callback) {
        var deferred, promise;

        if (callback instanceof Function) {
            getTopicList(url).then(callback);
        }

        if (url && chaos.parseURL(url)['path'] !== 'list.asp') {
            return;
        }

        // 不带任何参数表示同步调用，返回当前页的帖子列表
        if (!url) {
            return parseTopicList();
        } else if (url === location.href) { // 异步获取当前页的列表（可能是在某个循环中无意中循环到了本页，所以整体风格仍然是异步）
            deferred = $.Deferred();
            promise = deferred.promise().then(parseTopicList);
            deferred.resolve(); // 不传任何返回值到 parseTopicList，用来告知它现在是在解析当前页
        } else {
            promise = $.get(url).then(parseTopicList);
        }

        return promise;
    };

    var getThreadList = function(url, callback) {
        var deferred = $.Deferred();

        if (callback instanceof Function) {
            getThreadList(url).then(callback);
        }

        if (url && chaos.parseURL(url)['path'] !== 'dispbbs.asp') {
            return;
        }

        // 不带任何参数表示同步调用，返回当前页的回复列表
        if (!url) {
            return parseThreadList();
        } else if (url === location.href) { // 异步获取当前页的列表
            deferred = $.Deferred();
            promise = deferred.promise().then(parseThreadList);
            deferred.resolve(); // 不传任何返回值到 parseThreadList，用来告知它现在是在解析当前页
        } else {
            promise = $.get(url).then(parseThreadList);
        }

        return promise;
    };

    var test = function() {
        /*
        // 普通版面
        getTopicList('http://www.cc98.org/list.asp?boardid=81').then(function(topics) {
            log('情感空气第 10 个帖子（包括置顶）');
            log(topics[9]);
        });
        // 心灵
        getTopicList('http://www.cc98.org/list.asp?boardid=182').then(function(topics) {
            log('心灵之约置顶帖首位');
            log(topics[0]); //置顶帖
            log('心灵之约第 10 个帖子（包括置顶）');
            log(topics[9]); // 心灵普通帖子
        });

        // 被锁定版面
        getTopicList('http://www.cc98.org/list.asp?boardid=537').then(function(topics) {
            log('暑假版第 10 个帖子（包括置顶）');
            log(topics[9]);
        });
*/

        // 以上均测试通过

        /*
        // 普通帖子
        getThreadList('http://www.cc98.org/dispbbs.asp?BoardID=186&id=4108287').then(function(threads) {
            log('测试普通帖子');
            log(threads[1]);
        });

        // 蓝名用户
        getThreadList('http://www.cc98.org/dispbbs.asp?boardID=357&ID=3469578').then(function(threads) {
            log('测试红名用户');
            log(threads[0]);
        });

        // 红名用户
        getThreadList('http://www.cc98.org/dispbbs.asp?boardID=81&ID=4292487').then(function(threads) {
            log('测试红名用户');
            log(threads[0]);
        });

        // 被锁定帖子
        getThreadList('http://www.cc98.org/dispbbs.asp?boardID=17&ID=4292545').then(function(threads) {
            log('测试被锁定帖子');
            log(threads[1]);
        });

        // 心灵帖子
        getThreadList('http://www.cc98.org/dispbbs.asp?boardID=182&ID=4238943').then(function(threads) {
            log('测试心灵帖子');
            log(threads[1]);
        });

        // 回复可见（不可见）
        getThreadList('http://www.cc98.org/dispbbs.asp?boardID=182&ID=3652234').then(function(threads) {
            log('回复可见帖子首楼');
            log(threads[0]); // 1 楼，在回复可见出现前
            log('回复可见的帖子回复');
            log(threads[1]); // 2 楼，回复可见且对当前用户不可见
            log('回复可见帖子的后一楼');
            log(threads[2]); // 3 楼，在回复可见后的一层，用以检查楼层是否乱掉
        });

        // 回复可见（可见）
        getThreadList('http://www.cc98.org/dispbbs.asp?boardID=81&ID=3705020').then(function(threads) {
            log('回复可见帖子中的可见帖');
            log(threads[1]);
        });

        // 被删除帖子
        getThreadList('http://www.cc98.org/dispbbs.asp?BoardID=144&id=4133896').then(function(threads) {
            log('测试被删除帖子');
            log('被删除的楼');
            log(threads[6]);
            log('被删除的后一楼');
            log(threads[7]);
        });

        // 楼主可见
        getThreadList('http://www.cc98.org/dispbbs.asp?boardID=81&ID=2805301').then(function(threads) {
            log('测试楼主可见');
            log('可见帖');
            log(threads[0]);
            log('不可见帖');
            log(threads[1]);
        });

        // 指定用户可见（当前用户不可见）
        getThreadList('http://www.cc98.org/dispbbs.asp?BoardID=144&id=4133896&star=597').then(function(threads) {
            log('测试指定用户可见（当前用户不可见）');
            log(threads[0]);
        });

        // 指定用户可见（当前用户可见）
        getThreadList('http://www.cc98.org/dispbbs.asp?BoardID=144&id=4014074&star=288').then(function(threads) {
            log('测试指定用户可见（当前用户可见）');
            log(threads[9]);
        });

        // 投票
        getThreadList('http://www.cc98.org/dispbbs.asp?boardID=81&ID=4285186').then(function(threads) {
            log('测试投票帖');
            log(threads[0])
        });

        // 被屏蔽的用户
        getThreadList('http://www.cc98.org/dispbbs.asp?boardID=622&ID=3720912').then(function(threads) {
            log('测试被屏蔽用户');
            log(threads[0]);
        });

        // 该用户不存在
        getThreadList('http://www.cc98.org/dispbbs.asp?boardID=357&ID=3469578').then(function(threads) {
            log('测试已不存在的用户');
            log(threads[0]);
        });

        // 心灵匿名/不匿名混合贴
        getThreadList('http://www.cc98.org/dispbbs.asp?BoardID=182&id=153389&star=9').then(function(threads) {
            log('测试心灵匿名/不匿名混合贴');
            log(threads[0]);
            log(threads[1]);
            log(threads[3]);
        });

        // 追踪页面（由于链接有时效性，故暂略）
        // getThreadList('').then(function(threads) {});
*/
    };


    var libcc98 = {};

    libcc98.info = info;
    libcc98.getTopicList = getTopicList;
    libcc98.getThreadList = getThreadList;
    libcc98.test = test;

    return libcc98;
});
