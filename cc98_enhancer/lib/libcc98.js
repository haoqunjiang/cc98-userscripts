define('libcc98', function(exports, module) {
    var chaos = require('chaos');
    var $ = require('jQuery');
    var CC98URLMap = require('CC98URLMap');

    var log = function() {
        console.log.apply(console, arguments);
    }

    // 从 cookie 中获取有效信息
    var user_info = (function() {
        var that = {};
        var cookieObj = chaos.parseCookies(document.cookie);
        var aspsky = chaos.parseQS(cookieObj['aspsky']);

        that.is_simple = (cookieObj['cc98Simple'] === '1');
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
            if (user_info.is_simple && index === 0) {
                return false;
            } else {
                return true;
            }
        }).map(function(index, ele) {
            var topic = {};

            var tr = $(ele);

            topic.DOM = ele;
            topic.type = user_info.is_simple ? tr.children().first().text().trim() : tr.children().children().first().attr('title');
            topic.href = tr.children().eq(1).children('a').attr('href');
            topic.title = tr.children().eq(1).children('a').children().eq(0).text();
            topic.author = tr.children().eq(2).children().eq(0).text() || '匿名';
            topic.lastReplyTime = tr.children().eq(4).children().eq(0).text();
            topic.lastReplyUser = JSON.parse(tr.next().text().replace(/.*'{(.*)}'.*/g, '{$1}'))['usr'];

            return topic;
        }).toArray();

        return topics;
    };

    var parsePostList = function(html) {
        var doc;
        var postsDOM;
        var posts = [];

        if (!html) {
            doc = document;
        } else {
            doc = document.implementation.createHTMLDocument('');
            doc.documentElement.innerHTML = html;
        }

        // 98自己的 anchors 也是跳过被删除发言的，所以这里就不考虑了
        var anchors = $(doc).find('a[name]').filter(function(index) {
            return /^\d{1,2}$/g.test(this.name);
        });

        // 简版
        if (user_info.is_simple) {
            posts = anchors.map(function(index, ele) {
                var post = {};

                var table = $(ele).next();

                post.anchor = parseInt(ele.name, 10);
                post.DOM = table.get(0); // 整个回复的 DOM，在屏蔽时有用
                post.authorDOM = table.find('.usernamedisp').find('b').get(0);
                post.author = $(post.authorDOM).text();
                post.time;
                post.storey; // 每层楼边上服务器给出的楼层数

                post.annouceid; // 通过「引用」按钮的链接提取

                // 以下可能没有（楼主可见/指定用户可见/回复可见）
                post.content; // 回复内容
                post.expression; // 小表情
                post.title; // 标题

                return post;
            }).toArray();

            return posts;
        }

        // 完整版
        posts = anchors.map(function(index, ele) {
            var post = {};

            var table = $(ele).next();

            post.anchor = parseInt(ele.name, 10);
            post.DOM = table.get(0); // 整个回复的 DOM，在屏蔽时有用

            post.authorDOM = table.children().children().children().eq(0).find('b').parent().get(0);
            post.author = $(post.authorDOM).children().eq(0).text();
            post.time = table.children().children().eq(1).children().eq(0).text().trim();
            post.quote_btn = table.find('img[src="pic/reply.gif"]').parent().get(0); // 暴露接口方便修改 UI
            post.annouceid = chaos.parseQS(post.quote_btn.href)['replyID']; // 通过「引用」按钮的链接提取
            post.storey = post.quote_btn.parentNode.textContent.trim(); // 每层楼边上服务器给出的楼层文字

            // 以下可能没有（楼主可见/指定用户可见/回复可见）
            var user_post = table.find('blockquote script').parent().eq(0);

            post.expression = user_post.find('img[title="发贴心情"]').attr('src'); // 小表情
            post.title = user_post.children().eq(1).text(); // 标题
            post.content = user_post.children().eq(3).text(); // 回复内容

            return post;
        }).toArray();

        return posts;
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

    var getPostList = function(url, callback) {
        var deferred, promise;

        if (callback instanceof Function) {
            getPostList(url).then(callback);
        }

        if (url && chaos.parseURL(url)['path'] !== 'dispbbs.asp') {
            return;
        }

        // 不带任何参数表示同步调用，返回当前页的回复列表
        if (!url) {
            return parsePostList();
        } else if (url === location.href) { // 异步获取当前页的列表
            deferred = $.Deferred();
            promise = deferred.promise().then(parsePostList);
            deferred.resolve(); // 不传任何返回值到 parsePostList，用来告知它现在是在解析当前页
        } else {
            promise = $.get(url).then(parsePostList);
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

        //////////////////////////////////////////////////////////////////////////
        // 以上均已测试通过
        //////////////////////////////////////////////////////////////////////////

        */
        // 普通帖子
        getPostList('http://www.cc98.org/dispbbs.asp?BoardID=186&id=4108287').then(function(posts) {
            log('测试普通帖子');
            log(posts[1]);
        });
        /*
        // 蓝名用户
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=357&ID=3469578').then(function(posts) {
            log('测试红名用户');
            log(posts[0]);
        });

        // 红名用户
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=81&ID=4292487').then(function(posts) {
            log('测试红名用户');
            log(posts[0]);
        });

        // 被锁定帖子
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=17&ID=4292545').then(function(posts) {
            log('测试被锁定帖子');
            log(posts[1]);
        });

        // 心灵帖子
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=182&ID=4238943').then(function(posts) {
            log('测试心灵帖子');
            log(posts[1]);
        });

        // 回复可见（不可见）
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=182&ID=3652234').then(function(posts) {
            log('回复可见帖子首楼');
            log(posts[0]); // 1 楼，在回复可见出现前
            log('回复可见的帖子回复');
            log(posts[1]); // 2 楼，回复可见且对当前用户不可见
            log('回复可见帖子的后一楼');
            log(posts[2]); // 3 楼，在回复可见后的一层，用以检查楼层是否乱掉
        });

        // 回复可见（可见）
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=81&ID=3705020').then(function(posts) {
            log('回复可见帖子中的可见帖');
            log(posts[1]);
        });

        // 被删除帖子
        getPostList('http://www.cc98.org/dispbbs.asp?BoardID=144&id=4133896').then(function(posts) {
            log('测试被删除帖子');
            log('被删除的楼');
            log(posts[6]);
            log('被删除的后一楼');
            log(posts[7]);
        });

        // 楼主可见
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=81&ID=2805301').then(function(posts) {
            log('测试楼主可见');
            log('可见帖');
            log(posts[0]);
            log('不可见帖');
            log(posts[1]);
        });

        // 指定用户可见（当前用户不可见）
        getPostList('http://www.cc98.org/dispbbs.asp?BoardID=144&id=4133896&star=597').then(function(posts) {
            log('测试指定用户可见（当前用户不可见）');
            log(posts[0]);
        });

        // 指定用户可见（当前用户可见）
        getPostList('http://www.cc98.org/dispbbs.asp?BoardID=144&id=4014074&star=288').then(function(posts) {
            log('测试指定用户可见（当前用户可见）');
            log(posts[9]);
        });

        // 投票
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=81&ID=4285186').then(function(posts) {
            log('测试投票帖');
            log(posts[0])
        });

        // 被屏蔽的用户
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=622&ID=3720912').then(function(posts) {
            log('测试被屏蔽用户');
            log(posts[0]);
        });

        // 该用户不存在
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=357&ID=3469578').then(function(posts) {
            log('测试已不存在的用户');
            log(posts[0]);
        });

        // 心灵匿名/不匿名混合贴
        getPostList('http://www.cc98.org/dispbbs.asp?BoardID=182&id=153389&star=9').then(function(posts) {
            log('测试心灵匿名/不匿名混合贴');
            log(posts[0]);
            log(posts[1]);
            log(posts[3]);
        });

        // 追踪页面（由于链接有时效性，故暂略）
        // getPostList('').then(function(posts) {});
*/
    };


    var libcc98 = {};

    libcc98.user_info = user_info;
    libcc98.getTopicList = getTopicList;
    libcc98.getPostList = getPostList;

    libcc98.test = test;

    return libcc98;
});
