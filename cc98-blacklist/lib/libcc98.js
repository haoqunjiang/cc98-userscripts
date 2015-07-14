define('libcc98', function(exports, module) {
    var chaos = require('chaos');
    var $ = require('jQuery');
    var URLMap = require('CC98URLMap');

    function log() {
        console.log.apply(console, arguments);
    }

    // 根据 html 文本，返回一个可以用于解析的 DOM 对象
    function HTMLParser(html) {
        var doc;
        if (!html) {
            doc = document;
        } else {
            doc = document.implementation.createHTMLDocument('');
            doc.documentElement.innerHTML = html;
        }
        return doc;
    }

    // HTMLParser 的 jQuery 封装
    function $HTMLParser(html) {
        return $(HTMLParser(html));
    }

    // 从 cookie 中获取有效信息
    var user_info = (function() {
        var that = {};

        that.is_simple = (chaos.getCookie('cc98Simple') === '1');
        that.username = $('.TopLighNav1 b').text(); //chaos.getSubCookie('aspsky', 'username');
        // that.password = chaos.getSubCookie('aspsky', 'password');
        // that.userid = chaos.getSubCookie('aspsky', 'userid');

        return that;
    })();

    function parseTopicList(html) {
        var doc = $HTMLParser(html);
        var topicsDOM = doc.find('tr[style="vertical-align: middle;"]');

        return topicsDOM.filter(function(index) {
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
            topic.lastReplyUser = JSON.parse(tr.next().text().replace(/.*'{(.*)}'.*/g, '{$1}')).usr;

            return topic;
        }).toArray();
    }

    function parsePostList(html) {
        var doc = $HTMLParser(html);

        // 98自己的 anchors 也是跳过被删除发言的，所以这里就不考虑了
        var anchors = doc.find('a[name]').filter(function(index) {
            return /^\d{1,2}$/g.test(this.name);
        });

        // 简版
        if (user_info.is_simple) {
            return anchors.map(function(index, ele) {
                var post = {};

                var table = $(ele).next();

                post.anchor = parseInt(ele.name, 10);
                post.DOM = table.get(0); // 整个回复的 DOM，在屏蔽时有用

                post.authorDOM = table.find('.usernamedisp').find('span, b').get(0); // 心灵是 span，普通帖子是 b 套着个 a
                post.author = post.authorDOM.textContent;
                post.time = post.authorDOM.parentNode.textContent.replace(/.*发表于(.*(AM|Message)).*/g, '$1').trim();
                post.quote_btn = $(post.authorDOM).next().next().get(0);
                post.annouceid = chaos.parseQS(post.quote_btn.href).replyid; // 通过「引用」按钮的链接提取
                post.storey = post.authorDOM.parentNode.textContent.replace(/^(.*)该贴由.*/g, '$1').trim(); // 每层楼边上服务器给出的楼层数

                // 以下可能没有（楼主可见/指定用户可见/回复可见）
                post.expression = table.find('.usernamedisp').next().attr('src'); // 小表情
                post.title = table.find('.usernamedisp').next().next().text(); // 标题
                post.content = table.find('.usernamedisp').next().next().next().next().html().replace(/\<br\>/ig, '\n'); // 回复内容

                return post;
            }).toArray();
        } else { // 完整版
            return anchors.map(function(index, ele) {
                var post = {};

                var table = $(ele).next();

                post.anchor = parseInt(ele.name, 10);
                post.DOM = table.get(0); // 整个回复的 DOM，在屏蔽时有用

                post.authorDOM = table.children().children().children().eq(0).find('span').get(0);
                post.author = $(post.authorDOM).children().eq(0).text();
                post.time = table.children().children().eq(1).children().eq(0).text().trim();
                post.quote_btn = table.find('img[src="pic/reply.gif"]').parent().get(0); // 暴露接口方便修改 UI
                post.annouceid = chaos.parseQS(post.quote_btn.href).replyid; // 通过「引用」按钮的链接提取
                post.storey = post.quote_btn.parentNode.textContent.trim(); // 每层楼边上服务器给出的楼层文字

                // 以下可能没有（楼主可见/指定用户可见/回复可见）
                var user_post = table.find('blockquote script').parent().eq(0);

                post.expression = user_post.find('img[title="发贴心情"]').attr('src'); // 小表情
                post.title = user_post.children().eq(1).text(); // 标题
                post.content = user_post.children().eq(3)..html().replace(/\<br\>/ig, '\n'); // 回复内容

                return post;
            }).toArray();
        }
    }

    function getTopicList(url, callback) {
        var deferred, promise;

        if (callback instanceof Function) {
            getTopicList(url).then(callback);
        }

        if (url && !URLMap.isTopicList(url)) {
            return;
        }

        // 不带任何参数表示同步调用，返回当前页的帖子列表
        if (!url) {
            return parseTopicList();
        } else { // 不然的话异步获取页面源码再解析（考虑到多重引用什么的也需要重新请求页面，故不必判断网址以节省一次请求）
            promise = $.get(url).then(parseTopicList);
        }

        return promise;
    }

    function getPostList(url, callback) {
        var deferred, promise;

        if (callback instanceof Function) {
            getPostList(url).then(callback);
        }

        if (url && !URLMap.isPostList(url)) {
            return;
        }

        // 不带任何参数表示同步调用，返回当前页的回复列表
        if (!url) {
            return parsePostList();
        } else {
            promise = $.get(url).then(parsePostList);
        }

        return promise;
    }

    function sendMessage(opts) {
        opts = opts || {};

        return $.post(
            URLMap.send_message_url(), {
                'touser': opts.recipient,
                'title': opts.subject,
                'message': opts.message
            }).then(function(html) {
            // 成功就返回被删除的消息 id，不然返回一个 rejected promise
            if (html.indexOf('论坛成功信息') !== -1) {
                return;
            } else {
                return $.Deferred().reject('发送站短失败').promise();
            }
        });
    }

    function saveDraft(opts) {
        opts = opts || {};

        return $.post(
            URLMap.send_message_url(), {
                'touser': opts.recipient,
                'title': opts.subject,
                'message': opts.message,
                'Submit': '保存'
            }).then(function(html) {
            // 成功就返回被删除的消息 id，不然返回一个 rejected promise
            if (html.indexOf('论坛成功信息') !== -1) {
                return;
            } else {
                return $.Deferred().reject('保存草稿失败').promise();
            }
        });
    }

    function parseMessageList(html) {
        var doc = $HTMLParser(html);
        var pmsDOM = doc.find('form[name="inbox"]').children().children().eq(0).children().children().filter(function(index) {
            return index >= 2;
        });

        return pmsDOM.map(function(index, ele) {
            var pm = {};
            var tr = $(ele);

            pm.username = tr.children().eq(1).text().trim(); // 可能是收件人也可能是发件人故只好命名为 username
            pm.subject = tr.children().eq(2).text().trim();
            pm.time = tr.children().eq(3).text().trim();
            pm.url = tr.children().eq(3).children().attr('href');
            pm.size = tr.children().eq(4).text().trim();
            pm.id = tr.children().eq(5).children().val();

            return pm;
        });
    }

    // 根据标题搜索草稿，返回第一条符合条件的草稿的 meta 信息
    var getMessageMeta = function(url_map_function) {

        function _get_meta(subject, page_num) {
            if (!page_num) {
                page_num = 1;
            }

            return $.get(url_map_function(page_num)).then(function(html) {
                var doc = $HTMLParser(html);
                var total_page = doc.find('form[name="inbox"]').children().children().eq(1).children().children().children().children().eq(1).text();

                var pms = parseMessageList(html);

                // 搜索符合条件的草稿
                for (var i = 0; i !== pms.length; ++i) {
                    if (pms[i].subject === subject) {
                        return pms[i];
                    }
                }

                if (page_num < total_page) {
                    return _get_meta(subject, ++page_num); // 查找下一页
                } else {
                    return $.Deferred().reject('找不到标题为' + subject + '的站短').promise(); // return a rejected promise
                }
            });
        }

        return _get_meta;
    };

    var getMessageID = function(url_map_function) {
        return function(subject) {
            return getMessageMeta(url_map_function)(subject).then(function(meta) {
                return meta.id;
            });
        };
    };

    var getMessageURL = function(url_map_function) {
        return function(subject) {
            return getMessageMeta(url_map_function)(subject).then(function(meta) {
                return meta.url;
            });
        };
    };


    var getDraftID = getMessageID(URLMap.drafts_url);
    var getDraftURL = getMessageURL(URLMap.drafts_url);

    var getSentID = getMessageID(URLMap.sent_url);
    var getSentURL = getMessageURL(URLMap.sent_url);

    var getRecievedID = getMessageID(URLMap.inbox_url);
    var getRecievedURL = getMessageURL(URLMap.inbox_url);

    var getDraft = function(subject) {
        return getDraftURL(subject)
            .then($.get)
            .then(function(html) {
                var doc = $HTMLParser(html);
                var pm = {};

                pm.recipient = doc.find('input[name="touser"]').val();
                pm.subject = doc.find('input[name="title"]').val();
                pm.message = doc.find('textarea[name="message"]').val();
                pm.id = doc.find('input[name="id"]').val();

                return pm;
            });
    };

    var deleteMessage = function(id, action) {
        return $.post(
            URLMap.delete_message_url(), {
                id: id,
                action: action
            }).then(function(html) {
            // 成功就返回被删除的消息 id，不然返回一个 rejected promise
            if (html.indexOf('论坛成功信息') !== -1) {
                return id;
            } else {
                return $.Deferred().reject('删除消息失败').promise();
            }
        });
    };

    var deleteDraft = function(id) {
        return deleteMessage(id, '删除草稿');
    };

    var deleteTrash = function(id) {
        return deleteMessage(id, '删除垃圾');
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

        // 普通帖子
        getPostList('http://www.cc98.org/dispbbs.asp?BoardID=186&id=4108287').then(function(posts) {
            log('测试普通帖子');
            log(posts[0]);
        });

        // 蓝名用户
        getPostList('http://www.cc98.org/dispbbs.asp?boardID=357&ID=3469578').then(function(posts) {
            log('测试蓝名用户');
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

        //////////////////////////////////////////////////////////////////////////
        // 以上均已测试通过
        //////////////////////////////////////////////////////////////////////////

        */
        /*
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


    var libcc98 = {
        user_info: user_info,
        getTopicList: getTopicList,
        getPostList: getPostList,
        sendMessage: sendMessage,
        saveDraft: saveDraft,

        getDraftID: getDraftID,
        getDraftURL: getDraftURL,
        getSentID: getSentID,
        getSentURL: getSentURL,
        getRecievedID: getRecievedID,
        getRecievedURL: getRecievedURL,

        getDraft: getDraft,
        deleteDraft: deleteDraft,
        deleteTrash: deleteTrash,

        test: test
    };

    return libcc98;
});
