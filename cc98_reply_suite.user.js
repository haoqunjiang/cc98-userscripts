// ==UserScript==
// @id             cc98_reply_suite
// @name           cc98 reply suite
// @version        0.8.5
// @namespace      soda@cc98.org
// @author         soda <sodazju@gmail.com>
// @description
// @include        http://www.cc98.org/dispbbs.asp*
// @include        http://hz.cc98.lifetoy.org/dispbbs.asp*
// @require        http://cdn.staticfile.org/jquery/2.1.1/jquery.js
// @run-at         document-end
// ==/UserScript==

// todo:
// 上传 mp3

// a collection of simple browser-side JavaScript snippets
(function(definition) {
    if (typeof define === "function" && define.amd) {
        define(definition);
    } else {
        chaos = definition;
    }
})({

    /**
     * Generates a GUID string, according to RFC4122 standards.
     * @returns {String} The generated GUID.
     * @example af8a8416-6e18-a307-bd9c-f2c947bbb3aa
     * @author Slavik Meltser (slavik@meltser.info).
     * @link http://slavik.meltser.info/?p=142
     */
    guid: function() {
        function _p8(s) {
            var p = (Math.random().toString(16) + "000000000").substr(2, 8);
            return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
        }
        return _p8() + _p8(true) + _p8(true) + _p8();
    },

    // parse the url get parameters
    parseQS: function(url, preserve_case) {
        if (!preserve_case) {
            url = url.toLowerCase();
        }
        url = url.split('#')[0]; // remove the hash part
        var t = url.indexOf('?');
        var hash = {};
        if (t >= 0) {
            var params = url.substring(t + 1).split('&');
        } else { // plain query string without '?' (e.g. in cookies)
            var params = url.split('&');
        }
        for (var i = 0; i < params.length; ++i) {
            var val = params[i].split('=');
            hash[decodeURIComponent(val[0])] = decodeURIComponent(val[1]);
        }
        return hash;
    },

    toQS: function(obj) {
        var ret = [];
        for (var key in obj) {
            if ('' === key) continue;
            if ('' === obj[key]) continue;
            ret.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
        }
        return ret.join('&');
    },

    parseURL: function(url) {
        // from JavaScript: The Good Parts
        var parse_url = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/
        var arr = parse_url.exec(url);
        var result = {};
        result['url'] = arr[0];
        result['scheme'] = arr[1];
        result['slash'] = arr[2];
        result['host'] = arr[3];
        result['port'] = arr[4];
        result['path'] = arr[5];
        result['query'] = arr[6];
        result['hash'] = arr[7];
        return result;
    },

    parseCookies: function() {
        var cookies = {}; // The object we will return
        var all = document.cookie; // Get all cookies in one big string
        if (all === '') // If the property is the empty string
            return cookies; // return an empty object
        var list = all.split('; '); // Split into individual name=value pairs
        for (var i = 0; i < list.length; i++) { // For each cookie
            var cookie = list[i];
            var p = cookie.indexOf('='); // Find the first = sign
            var name = cookie.substring(0, p); // Get cookie name
            var value = cookie.substring(p + 1); // Get cookie value
            value = decodeURIComponent(value); // Decode the value
            cookies[name] = value; // Store name and value in object
        }
        return cookies;
    },

    getCookie: function(name) {
        return chaos.parseCookies()[name];
    },

    getSubCookie: function(name, sub) {
        return chaos.parseQS(chaos.getCookie(name), true)[sub];
    },

    setCookie: function(name, val, options) {
        options = options || {};

        var expires = options.expires;
        var path = options.path;
        var domain = options.domain;

        var text = encodeURIComponent(name) + '=' + val;
        if (expires instanceof Date) {
            text += '; expires=' + expires.toGMTString();
        }
        text += '; path=' + path;
        if (domain) {
            text += '; domain=' + domain;
        }
        document.cookie = text;
    },

    setSubCookie: function(name, sub, val, options) {
        var hash = chaos.parseQS(chaos.getCookie(name), true);
        hash[sub] = val;
        chaos.setCookie(name, chaos.toQS(hash), options);
    },

    // 将部分常见的转义后的html转回来
    unescapeHTML: function(input) {
        var e = document.createElement('div');
        e.innerHTML = input;
        return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue;
    },

    // deprecated
    // 建议用 q-http 模块的 ajax 函数，该函数返回一个 promise，更方便异步编程
    ajax: function(opts) {
        opts = {
            type: opts.type || 'GET',
            url: opts.url || '',
            data: opts.data || null,
            contentType: opts.contentType || 'application/x-www-form-urlencoded; charset=UTF-8',
            success: opts.success || function() {},
            async: opts.async || (opts.async === undefined)
        };

        // Chrome 没有sendAsBinary函数，这里是一个实现
        if (!XMLHttpRequest.prototype.sendAsBinary) {
            XMLHttpRequest.prototype.sendAsBinary = function(datastr) {
                function byteValue(x) {
                    return x.charCodeAt(0) & 0xff;
                }
                var ords = Array.prototype.map.call(datastr, byteValue);
                var ui8a = new Uint8Array(ords);
                this.send(ui8a);
            };
        }


        var xhr = new XMLHttpRequest();
        if (opts.type === 'GET') {
            opts.url += opts.data ? ('?' + chaos.toQS(opts.data)) : '';
        }
        xhr.open(opts.type, opts.url, opts.async);
        if (opts.contentType) {
            xhr.setRequestHeader('Content-type', opts.contentType);
        }
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                opts.success(xhr.responseText);
            }
        };

        // GET Request
        if (opts.type === 'GET') {
            xhr.send();
            return;
        }

        // POST Request
        if (opts.contentType === 'application/x-www-form-urlencoded; charset=UTF-8') {
            xhr.send(chaos.toQS(opts.data));
        } else {
            xhr.sendAsBinary(opts.data)
        }
    },

    get: function(url, data, calllback) {
        if (typeof data === 'function') {
            callback = data;
            data = null;
        }
        this.ajax({
            type: 'GET',
            url: url,
            data: data,
            success: callback
        });
    },

    post: function(url, data, callback) {
        if (typeof data === 'function') {
            callback = data;
            data = null;
        }
        this.ajax({
            type: 'POST',
            url: url,
            data: data,
            success: callback
        });
    },

    // @param {string} url sth like 'http://example.com/service?callback={callback}', which is the same as YUI's jsonp function
    jsonp: function(url, callback) {
        var proxy = function() {
            callback.aplly(this, arguments);
        };
        var prefix = '_CHAOS_JSONP_';
        var name = prefix + chaos.guid().replace(/-/g, '_'); // generate a unique valid function name
        global = unsafeWindow || window; // for compatibility with GM scripts
        global[name] = proxy;

        var script = document.createElement('script');

        url = url.replace('{callback}', name);

        script.src = url;
        script.onload = function() {
            document.removeChild(script);
        };

        document.body.appendChild(script);
    },


    // 添加CSS
    addStyles: function(css) {
        var head = document.getElementsByTagName('head')[0];
        var style = document.createElement('style');

        style.setAttribute('type', 'text/css');
        style.innerHTML = css;
        head.appendChild(style);
    },

    // 计算字符串字节数
    // from http://imatlas.com/posts/js-count-string-bytes/
    sizeof: function(str, charset) {
        charset = charset || 'utf-8';
        charset = charset.toLowerCase();

        var total = 0;

        if (charset === 'utf-16' || charset === 'utf16') {
            for (var i = 0; i != str.length; ++i) {
                if (str.charCodeAt(i) <= 0xffff) {
                    total += 2;
                } else {
                    total += 4;
                }
            }
        } else {
            for (var i = 0; i != str.length; ++i) {
                var code = str.charCodeAt(i)
                if (code <= 0x007f) {
                    total += 1;
                } else if (code <= 0x07ff) {
                    total += 2;
                } else if (code <= 0xffff) {
                    total += 3;
                } else {
                    total += 4;
                }
            }
        }
        return total;
    }
});


// simple helper functions to help write modular JavaScript
// from: http://leechan.me/?p=1241
// modified by soda<sodazju@gmail.com>
// TamperMonkey 中似乎无法注入全局名称空间，所以就直接定义全局变量了
(function() {
    var modules = {}, cached = {};

    // @usage: define('id', function(exports, module) {});
    define = function(id, func) {
        modules[id] = {};
        if (func instanceof Function) {
            modules[id].factory = func;
        } else {
            modules[id].exports = func;
        }
    };

    // @usage: var a = require('id');
    require = function(id) {
        if (cached[id]) {
            return cached[id];
        } else {
            return cached[id] = (modules[id].exports || modules[id].factory(modules[id].exports = {}, modules[id]) || modules[id].exports);
        }
    };
})();


// 本项目中用了自定义的 define 和 require 函数
// 而 chaos.js 本身并不是模块化的
// jQuery 仅支持 AMD 规范的模块加载
// 故为了保持接口的一致性增加了这两句（考虑到这些库都已经放到了全局命名空间，所以这真的仅仅是为了看上去模块化一点）

_chaos = chaos;
define('chaos', _chaos);

// 因为 jQuery 对象是一个函数，直接作为参数传入的话会导致它被当作一个 factory 函数运行，所以只能 return
define('jQuery', function(exports, module) {
    return jQuery.noConflict();
});


define('CC98URLMap', function(exports, module) {
    // 默认文件上传到的版面：论坛帮助
    // 允许 gif|docx|xlsx|pptx|pdf|xap|jpg|jpeg|png|bmp|rar|txt|zip|mid|rm|doc|mp3
    var DEFAULT_UPLOAD_BOARDID = 184;

    // 其他文件扩展名与允许上传的boardid的对应列表
    var file2boardid = {
        'ipa': 598, // iOS
        'ppt': 598,
        'xls': 598,
        'chm': 598,
        'wma': 169, // 摇滚和独立音乐
        'lrc': 169,
        'asf': 169,
        'flv': 169,
        'wmv': 169,
        'rmvb': 169,
        'mpg': 169,
        'avi': 169,
        'swf': 170, // 史海拾贝
        'rep': 200, // 星际专区
        'tar': 212, // Linux天地
        'gz': 212,
        'bz2': 212,
        'tbz': 212,
        'tgz': 212,
        'psd': 239, // 贴图工坊
        'gtp': 308, // 乱弹吉他
        'gp3': 308,
        'gp4': 308,
        'gp5': 308,
        'torrent': 499, // 多媒体技术
        'srt': 499
    };

    var base_url = location.orgin;

    var that = {};

    // 发米
    that.fami_url = function() {
        return base_url + 'master_users.asp?action=award';
    };

    // 上传
    that.upload_url = function(filename) {
        var ext = file.name.substring(file.name.lastIndexOf('.') + 1);
        var boardid = file2boardid[ext] || DEFAULT_UPLOAD_BOARDID;
        return base_url + 'saveannouce_upfile.asp?boardid=' + boardid;
    };

    // postURL 发新帖

    // 回复
    that.reply_url = function(boardid) {
        return base_url + 'SaveReAnnounce.asp?method=Topic&boardid=' + boardid;
    };

    // 编辑
    that.edit_url = function(boardid, id, replyid) {
        return base_url + 'SaveditAnnounce.asp?boardid=' + boardid + '&id=' + id + '&replyid=' + replyid;
    };

    // 站短
    that.send_message_url = function() {
        return base_url + 'messanger.asp?action=send';
    };

    // 登录
    that.login_url = function() {
        return base_url + 'login.asp';
    };

    // 草稿箱
    that.drafts_url = function(page_num) {
        return base_url + 'usersms.asp?action=outbox&page=' + page_num;
    };

    // 收件箱
    that.inbox_url = function(page_num) {
        return base_url + 'usersms.asp?action=inbox&page=' + page_num;
    };

    // 已发送
    that.sent_url = function(page_num) {
        return base_url + 'usersms.asp?action=issend&page=' + page_num;
    };

    // 删除站短
    that.delete_message_url = function() {
        return base_url + 'messanger.asp';
    };

    var chaos = require('chaos');

    // 各种判断用的函数
    that.isTopicList = function(url) {
        return chaos.parseURL(url).path === 'list.asp';
    };

    that.isPostList = function(url) {
        return chaos.parseURL(url).path === 'dispbbs.asp';
    };

    that.isXinlin = function(url) {
        return chaos.parseQS(url).boardid === '182';
    };

    module.exports = that;
});


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
                post.time = post.authorDOM.parentNode.textContent.match(/\d{4}\/\d{1,2}\/\d{1,2}\s*\d{1,2}:\d{1,2}:\d{1,2}\s*(AM|PM)?/g);
                if (post.time.length) {
                    post.time = post.time[0].trim();
                }
                post.quote_btn = $(post.authorDOM).next().next().get(0);
                post.annouceid = chaos.parseQS(post.quote_btn.href).replyid; // 通过「引用」按钮的链接提取
                post.storey = post.authorDOM.parentNode.textContent.replace(/^(.*)该贴由.*/g, '$1').trim(); // 每层楼边上服务器给出的楼层数

                // 以下可能没有（楼主可见/指定用户可见/回复可见）
                post.expression = table.find('.usernamedisp').next().attr('src'); // 小表情
                post.title = table.find('.usernamedisp').next().next().text(); // 标题
                post.content = (table.find('.usernamedisp').parent().find('span[id^=ubbcode]').html() || '').replace(/<br\>/ig, '\n'); // 回复内容

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
                var user_post = table.find('article.content-article > table > tbody > tr > td');

                post.expression = user_post.find('img[title="发贴心情"]').attr('src'); // 小表情
                post.title = user_post.children().eq(1).text(); // 标题
                post.content = (user_post.find('span[id^=ubbcode]').html() || '').replace(/<br\>/ig, '\n'); // 回复内容


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

// 注意，本脚本中所有storey都是以1-9表示对应楼层，0表示第十层（为了跟脚本快捷键一致╮(╯_╰)╭
// 而index表示楼层的序号，0是第一楼，1是第二楼……

// Chrome 没有sendAsBinary函数，这里是一个实现
if (!XMLHttpRequest.prototype.sendAsBinary) {
    XMLHttpRequest.prototype.sendAsBinary = function(datastr) {
        function byteValue(x) {
            return x.charCodeAt(0) & 0xff;
        }
        var ords = Array.prototype.map.call(datastr, byteValue);
        var ui8a = new Uint8Array(ords);
        this.send(ui8a);
    };
}


// 辅助函数
// parseQS, toQS, parseURL, parseCookies, unescapeHTML, ajax, addStyles
var _lib = {

    // parse the url get parameters
    parseQS: function(url) {
        if (!url) {
            return;
        }
        url = url.toLowerCase().split('#')[0];  // remove the hash part
        var t = url.indexOf('?');
        var params;

        var hash = {};
        if (t >= 0) {
            params = url.substring(t+1).split('&');
        } else {    // plain query string without '?' (e.g. in cookies)
            params = url.split('&');
        }
        for (var i = 0; i < params.length; ++i) {
            var val = params[i].split('=');
            hash[decodeURIComponent(val[0])] = decodeURIComponent(val[1]);
        }
        return hash;
    },

    toQS: function(obj) {
        var ret = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                if ('' === obj[key]) { continue; }
                ret.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
            }
        }
        return ret.join('&');
    },

    parseURL: function(url) {
        // from JavaScript: The Good Parts
        var parse_url = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
        var arr = parse_url.exec(url);
        var result = {};
        result['url'] = arr[0];
        result['scheme'] = arr[1];
        result['slash'] = arr[2];
        result['host'] = arr[3];
        result['port'] = arr[4];
        result['path'] = arr[5];
        result['query'] = arr[6];
        result['hash'] = arr[7];
        return result;
    },

    parseCookies: function(theCookie) {
        var cookies = {};           // The object we will return
        var all = theCookie;        // Get all cookies in one big string
        if (all === '') {            // If the property is the empty string
            return cookies;         // return an empty object
        }
        var list = all.split('; '); // Split into individual name=value pairs
        for(var i = 0; i < list.length; i++) {  // For each cookie
            var cookie = list[i];
            var p = cookie.indexOf('=');        // Find the first = sign
            var name = cookie.substring(0,p);   // Get cookie name
            var value = cookie.substring(p+1);  // Get cookie value
            value = decodeURIComponent(value);  // Decode the value
            cookies[name] = value;              // Store name and value in object
        }
        return cookies;
    },

    // 将转义后的html转回来
    unescapeHTML: function(input) {
        var e = document.createElement('div');
        e.innerHTML = input;
        return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue;
    },

    // 转成UNICODE编码（sendAsBinary不能识别中文）
    toUnicode: function(str){
        return escape(str).toLocaleLowerCase().replace(/%u/gi,'\\u');
    },

    ajax: function(opts) {
        opts = {
            type: opts.type || 'GET',
            url: opts.url || '',
            data: opts.data || null,
            contentType: opts.contentType || 'application/x-www-form-urlencoded; charset=UTF-8',
            success: opts.success || function() {},
            async: opts.async || (opts.async === undefined)
        };

        var xhr = new XMLHttpRequest();

        xhr.open(opts.type, opts.url, opts.async);
        xhr.setRequestHeader('Content-type', opts.contentType);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                opts.success(xhr.responseText);
            }
        };
        if (opts.contentType === 'application/x-www-form-urlencoded; charset=UTF-8') {
            xhr.send(_lib.toQS(opts.data));
        } else {
            xhr.sendAsBinary(opts.data);
        }
    },

    // 添加CSS
    addStyles: function(css) {
        var head = document.getElementsByTagName('head')[0];
        var style = document.createElement('style');

        style.setAttribute('type', 'text/css');
        style.innerHTML = css;
        head.appendChild(style);
    }
};

// 98相关的函数接口，这个脚本中fami和postCount这两个函数都没用到
// fami, reply, sendPM, upload, getPostContent, parseTopicPage, postCount, pageCount, formatURL, currentPage
var _cc98 = (function() {

    var that = {};

    // 各种常量
    var PM_URL = location.origin + '/messanger.asp?action=send';
    var REPLY_URL = location.origin + '/SaveReAnnounce.asp?method=Topic';
    var EDIT_URL = location.origin + '/SaveditAnnounce.asp?';

    var POST_COUNT_RE = /本主题贴数\s*<b>(\d+)<\/b>/ig;

    // 以下三个没有考虑被删除的帖子，因为在当前页解析的时候DisplayDel()和正常的发帖时间之类的会一起出现，导致匹配会乱掉
    // 因此引起的发米机发米楼层可能不精确的问题也没办法了……
    var NAME_RE = /(?:name="\d+">| middle;">&nbsp;)\s*<span style="color:\s*\#\w{6}\s*;"><b>([^<]+)<\/b><\/span>/g;
    var ANNOUNCEID_RE = /<a name="(\d{2,})">/g; // 注意网页上<a name="1">之类的标签是作为#1的anchor出现的，所以限定至少两个数字
    var POST_TIME_RE = /<\/a>\s*(\d+\/\d+\/\d+ \d+:\d+:\d+.*)\s*<\/td>/g;

    var POST_RE = /\s<span id="ubbcode[^>]*>(.*)<\/span>|>本楼只允许特定用户查看|>该帖子设置了楼主可见|>该账号已经被禁止|>DisplayDel()/ig;

    // 用于在getPostContent()函数中去掉回复可见的内容
    var REPLYVIEW_RE = /<hr noshade size=1>.*<hr noshade size=1>/ig;

    // 默认文件上传到的版面：论坛帮助
    // 允许 gif|docx|xlsx|pptx|pdf|xap|jpg|jpeg|png|bmp|rar|txt|zip|mid|rm|doc|mp3
    var DEFAULT_UPLOAD_BOARDID = 184;

    // 其他文件扩展名与允许上传的boardid的对应列表
    var file2boardid = {
        'ipa': 598, // iOS
        'ppt': 598,
        'xls': 598,
        'chm': 598,
        'wma': 169, // 摇滚和独立音乐
        'lrc': 169,
        'asf': 169,
        'flv': 169,
        'wmv': 169,
        'rmvb': 169,
        'mpg': 169,
        'avi': 169,
        'swf': 170, // 史海拾贝
        'rep': 200, // 星际专区
        'tar': 212, // Linux天地
        'gz': 212,
        'bz2': 212,
        'tbz': 212,
        'tgz': 212,
        'psd': 239, // 贴图工坊
        'gtp': 308, // 乱弹吉他
        'gp3': 308,
        'gp4': 308,
        'gp5': 308,
        'torrent': 499, // 多媒体技术
        'srt': 499
    };

    // 回帖
    // @param {string}  opts.url 帖子地址
    // @param {string}  opts.expression 发帖心情
    // @param {string}  opts.content 回帖内容
    // @param {string}  [opts.subject] 发帖主题
    // @param {string}  [opts.password] md5加密后的密码（不提供就从cookie中获取）
    // @param {boolean} [opts.edit] 是否是在编辑已发布的帖子（是的话必须提供replyid）
    // @param {Number}  [opts.replyid] 引用的帖子的announceid
    // @param {boolean} [opts.sendsms] 站短提示
    // @param {boolean} [opts.viewerfilter] 使用指定用户可见
    // @param {string}  [opts.allowedviewers] 可见用户
    // @param {function(responseText)} [opts.callback=function(){}] 回调函数
    that.reply = function(opts) {
        var params = _lib.parseQS(opts["url"]);
        var postURL = REPLY_URL + "&boardid=" + params["boardid"];
        if (opts["edit"]) {
            postURL = EDIT_URL + "boardid=" + params["boardid"] + "&replyid=" + opts["replyid"] + "&id=" + params["id"];
        }
        /*
        if (!opts.password) {
            opts.password = document.querySelector('input[name=passwd]').value; //_lib.parseQS(_lib.parseCookies(document.cookie)['aspsky'])['password'];
        }
        if (!opts.username) {
            opts.username = document.querySelector('input[name=UserName]').value; //_lib.parseQS(_lib.parseCookies(document.cookie)['aspsky'])['username'];
        }
        */
        var data = {
                'subject': opts['subject'] || '',
                'expression': opts['expression'],
                'content': opts['content'],
                'followup': opts['edit'] ? params['id'] : (opts['replyid'] || params['id']),
                'replyid': opts['replyid'] || params['id'],
                'sendsms': opts['sendsms'] ? '1' : '0',
                'rootid': params['id'],
                'star': params['star'] || '1',
                //'passwd': opts['password'],
                'signflag': 'yes',
                'enableviewerfilter': opts['viewerfilter'] ? '1' : '',
            };
        if (opts['viewerfilter']) {
            data['allowedviewers'] = opts['allowedviewers'] || '';
        }

        console.dir(data)

        _lib.ajax({
            'type': 'POST',
            'url': postURL,
            'data': data,
            'success': opts['callback']
        });
    };

    // 站短
    // @param {string}  opts.recipient 收件人
    // @param {string}  opts.subject 站短标题
    // @param {string}  opts.message 站短内容
    // @param {function(responseText)} [opts.callback=function(){}] 回调函数
    that.sendPM = function(opts) {
        _lib.ajax({
            "type": "POST",
            "url": PM_URL,
            "data": {
                "touser": opts["recipient"],
                "title": opts["subject"],
                "message": opts["message"]
            },
            "success": opts["callback"]
        });
    };

    that.upload = function(file, callback) {
        var reader = new FileReader();

        var ext = file.name.substring(file.name.lastIndexOf('.') + 1);    // 文件扩展名
        var boardid = file2boardid[ext] || DEFAULT_UPLOAD_BOARDID;
        var url = location.origin + '/saveannouce_upfile.asp?boardid=' + boardid;

        reader.onload = function(e) {
            var boundary = '----------------';
            boundary += parseInt(Math.random()*98989898+1, 10);
            boundary += parseInt(Math.random()*98989898+1, 10);

            var data = [boundary,'\r\n',
                'Content-Disposition: form-data; name="act"\r\n\r\nupload',
                '\r\n',boundary,'\r\n',
                'Content-Disposition: form-data; name="fname"\r\n\r\n',_lib.toUnicode(file.name),
                '\r\n',boundary,'\r\n',
                'Content-Disposition: form-data; name="file1"; filename="',_lib.toUnicode(file.name),'"\r\n',
                'Content-Type: ',file.type,'\r\n\r\n',
                e.target.result,
                '\r\n',boundary,'\r\n',
                'Content-Disposition: form-data; name="Submit"\r\n\r\n\xc9\xcf\xb4\xab',  // 上传
                '\r\n',boundary,'--\r\n'].join('');

            _lib.ajax({
                'type': 'POST',
                'url': url,
                'contentType': 'multipart/form-data; boundary='+boundary,
                'data': data,
                'success': callback
            });

        };

        reader.readAsBinaryString(file);
    };

    // 回帖内容如果要从html转成ubb的话太麻烦，但是没有执行js的rawhtml里有包含ubb代码
    // 所以为了方便起见，把获取帖子内容的功能独立出来，为它再开一个ajax请求
    // @param {string} url 网址
    // @param {Number} storey 楼层[1-9,0]
    // @param {function(postContent)) callback 回调函数
    that.getPostContent = function(url, index, callback) {
        _lib.ajax({
            'type': 'GET',
            'url': url,
            'success': function(rawhtml) {
                var result;

                POST_RE.lastIndex = 0;  // reinitialize the regexp
                for (var i = 0; i !== index; ++i) {
                    POST_RE.exec(rawhtml);
                }
                result = POST_RE.exec(rawhtml)[1] || '';
                result = result
                    .replace(REPLYVIEW_RE, '')
                    .replace(/<br>/ig, '\n');
                callback(_lib.unescapeHTML(result));
            }
        });
    };

    // 获取页面中的用户列表，回帖时间回帖ID
    // @return {Array}  每个数组元素都有username, annouceid, posttime三个属性
    that.parseTopicPage = function(htmlText) {
        if (!htmlText) { htmlText = document.body.innerHTML; }
        var postList = [];

        var nameArr = htmlText.match(NAME_RE);
        nameArr.forEach(function(name) {
            var post = {};
            post['username'] = name.replace(NAME_RE, '$1');
            postList.push(post);
        });

        var idArr = htmlText.match(ANNOUNCEID_RE);
        // 考虑到心灵没有announceid，所以idArr可能为空
        if (idArr) {
            idArr.forEach(function(id, index) {
                postList[index]['announceid'] = id.replace(ANNOUNCEID_RE, '$1');
            });
        }

        var timeArr = htmlText.match(POST_TIME_RE);
        if (timeArr) {
            timeArr.forEach(function(t, index) {
                postList[index]['posttime'] = t.replace(POST_TIME_RE, '$1');
            });
        }

        return postList;
    };

    that.postCount = function(htmlText) {
        if (!htmlText) { htmlText = document.body.innerHTML; }
        return parseInt(htmlText.match(POST_COUNT_RE)[0].replace(POST_COUNT_RE, '$1'), 10);
    };

    that.pageCount = function(htmlText) {
        return Math.ceil(_cc98.postCount(htmlText) / 10);
    };

    // 格式化网址，去除无用的参数并转为相对链接
    // @param {string}  url 要格式化的网址
    // @param {boolean} maxPageFix 是否修正url中star参数的值，使其不超过当前最后页的实际值
    that.formatURL = function(url, maxPageFix) {
        var urlObj = _lib.parseURL(url);

        // 不在www.cc98.org域名下
        if (urlObj['host'] !== 'www.cc98.org' && urlObj['host'] !== 'hz.cc98.lifetoy.org') {
            return url;
        }

        // http://www.cc98.org/
        if (!urlObj['path']) {
            return '/';
        }

        var params = _lib.parseQS(urlObj['query']);
        var hash = urlObj['hash'] ? ('#' + urlObj['hash']) : '';

        // 如果不是在追踪页面，就去掉replyid
        if (!params['trace']) {
            params['replyid'] = '';
        }
        params['page'] = '';    // 去掉page

        //
        if (params['star'] && maxPageFix && parseInt(params['star'], 10) > _cc98.pageCount()) {
            params['star'] = _cc98.pageCount();
        }

        params['star'] = (params['star'] && params['star'] !== '1') ? params['star'] : '';    // star=1时去掉
        if (params['searchdate'] === 'all') { params['searchdate'] = 'ALL' };
        return '/' + urlObj['path'] + '?' + _lib.toQS(params) + hash;
    };

    that.currentPage = function() {
        return parseInt(/<span title="跳转到第\s*(\d+)\s*页/ig.exec(document.body.innerHTML)[1], 10);
    };

    return that;
})();


jq = jQuery.noConflict();   // 防止与98默认jQuery版本的冲突
(function($) {
// 实际代码
$(function() {

////////////////////////////////////////////////////////////////////////////////
// 配置相关
////////////////////////////////////////////////////////////////////////////////
var DEFAULT_OPTIONS = {
    autoSaveInterval: 30,           // 自动保存间隔(秒)，必须是10的倍数

    promptString: '[查看原帖]',      // 原帖链接的提示文字
    promptColor: 'royalblue',       //「查看原帖」的颜色

    replyTail: "",                  // 小尾巴
    defaultReplyContent: '\n',      // 文本框为空时的默认回复内容

    useRelativeURL: true,           // 使用相对链接
    disableInXinlin: false,         // 在心灵禁用这些设置

    showFastReplyButton: true,      // 显示快速回复按钮
    alwaysShowEmotions: false,      // 始终显示表情菜单
    replaceNativeQuoteButton: true, // 取代原生引用按钮

    modifierKey: "alt",             // 快速回复快捷键组合的modifier key
    hotKeyCode: 82                  // 快速回复快捷键组合中字母的keyCode
};

var file_host = (location.host == 'hz.cc98.lifetoy.org') ? 'hz.file.cc98.lifetoy.org' : 'file.cc98.org';
var file_host_url = 'http://' + file_host;

var DEFAULT_EMOTIONS = {
    '鱼妹兔': [
        file_host_url + '/uploadfile/2013/8/16/11132767374.gif',
        file_host_url + '/uploadfile/2013/8/16/11131811595.gif',
        file_host_url + '/uploadfile/2013/8/16/11132317496.gif',
        file_host_url + '/uploadfile/2013/8/16/11142640805.gif',
        file_host_url + '/uploadfile/2013/8/16/11133097063.gif',
        file_host_url + '/uploadfile/2013/8/16/11133261117.gif',
        file_host_url + '/uploadfile/2013/8/16/11133877409.gif',
        file_host_url + '/uploadfile/2013/8/16/11132990664.gif',
        file_host_url + '/uploadfile/2013/8/16/11132896422.gif',
        file_host_url + '/uploadfile/2013/8/16/11135565465.gif',
        file_host_url + '/uploadfile/2013/8/16/11134892987.gif',
        file_host_url + '/uploadfile/2013/8/16/11134625044.gif',
        file_host_url + '/uploadfile/2013/8/16/11144984412.gif',
        file_host_url + '/uploadfile/2013/8/16/11135050228.gif',
        file_host_url + '/uploadfile/2013/8/16/11141071306.gif',
        file_host_url + '/uploadfile/2013/8/16/11151652647.gif',
        file_host_url + '/uploadfile/2013/8/16/11153028995.gif',
        file_host_url + '/uploadfile/2013/8/16/11153733919.gif',
        file_host_url + '/uploadfile/2013/8/16/11141538787.gif',
        file_host_url + '/uploadfile/2013/8/16/11141175296.gif',
        file_host_url + '/uploadfile/2013/8/16/1113730230.gif',
        file_host_url + '/uploadfile/2013/8/16/1113624772.gif',
        file_host_url + '/uploadfile/2013/8/16/1113910433.gif',
        file_host_url + '/uploadfile/2013/8/16/11133317981.gif',
        file_host_url + '/uploadfile/2013/8/16/11154368817.gif',
        file_host_url + '/uploadfile/2013/8/16/1113634107.gif',
        file_host_url + '/uploadfile/2013/8/16/1113884021.gif',
        file_host_url + '/uploadfile/2013/8/16/11131089743.gif',
        file_host_url + '/uploadfile/2013/8/16/11131940692.gif',
        file_host_url + '/uploadfile/2013/8/16/11132523069.gif',
        file_host_url + '/uploadfile/2013/8/16/11132758302.gif',
        file_host_url + '/uploadfile/2013/8/16/11133237215.gif',
        file_host_url + '/uploadfile/2013/8/16/11134560576.gif',
        file_host_url + '/uploadfile/2013/8/16/11134922863.gif',
        file_host_url + '/uploadfile/2013/8/16/11135174922.gif',
        file_host_url + '/uploadfile/2013/8/16/11131732447.gif',
        file_host_url + '/uploadfile/2013/8/16/11135349466.gif',
        file_host_url + '/uploadfile/2013/8/16/11135616307.gif',
        file_host_url + '/uploadfile/2013/8/16/11135898667.gif',
        file_host_url + '/uploadfile/2013/8/16/11153969943.gif',
        file_host_url + '/uploadfile/2013/8/16/11135927224.gif',
        file_host_url + '/uploadfile/2013/8/16/1114127403.gif',
        file_host_url + '/uploadfile/2013/8/16/1114559137.gif',
        file_host_url + '/uploadfile/2013/8/16/11135425151.gif',
        file_host_url + '/uploadfile/2013/8/16/11141283164.gif',
        file_host_url + '/uploadfile/2013/8/16/11141498486.gif',
        file_host_url + '/uploadfile/2013/8/16/11141663959.gif',
        file_host_url + '/uploadfile/2013/8/16/11141888502.gif',
        file_host_url + '/uploadfile/2013/8/16/11141997838.gif',
        file_host_url + '/uploadfile/2013/8/16/1115717966.gif',
        file_host_url + '/uploadfile/2013/8/16/11151144355.gif',
        file_host_url + '/uploadfile/2013/8/16/11152434724.gif',
        file_host_url + '/uploadfile/2013/8/16/11153355120.gif',
        file_host_url + '/uploadfile/2013/8/16/11144312036.gif',
        file_host_url + '/uploadfile/2013/8/16/11151655319.gif',
        file_host_url + '/uploadfile/2013/8/16/11153640882.gif',
        file_host_url + '/uploadfile/2013/8/16/11145899464.gif',
        file_host_url + '/uploadfile/2013/8/16/11152829558.gif',
        file_host_url + '/uploadfile/2013/8/16/11153599689.gif',
        file_host_url + '/uploadfile/2013/8/16/1115171649.gif',
        file_host_url + '/uploadfile/2013/8/16/11153677996.gif',
        file_host_url + '/uploadfile/2013/8/16/11173439110.gif',
        file_host_url + '/uploadfile/2013/8/16/11152020229.gif',
        file_host_url + '/uploadfile/2013/8/16/1115495993.gif',
        file_host_url + '/uploadfile/2013/8/16/11152759795.gif',
        file_host_url + '/uploadfile/2013/8/16/11144880685.gif',
        file_host_url + '/uploadfile/2013/8/16/11143895344.gif',
        file_host_url + '/uploadfile/2013/8/16/11145217602.gif',
        file_host_url + '/uploadfile/2013/8/16/11151125120.gif',
        file_host_url + '/uploadfile/2013/8/16/11152295776.gif',
        file_host_url + '/uploadfile/2013/8/16/11153291593.gif',
        file_host_url + '/uploadfile/2013/8/16/11151831118.gif',
        file_host_url + '/uploadfile/2013/8/16/11145065442.gif',
        file_host_url + '/uploadfile/2013/8/16/1115820488.gif',
        file_host_url + '/uploadfile/2013/8/16/11151897893.gif',
        file_host_url + '/uploadfile/2013/8/16/11144029838.gif',
        file_host_url + '/uploadfile/2013/8/16/11145715222.gif',
        file_host_url + '/uploadfile/2013/8/16/11152646319.gif',
        file_host_url + '/uploadfile/2013/8/16/1117239341.gif',
        file_host_url + '/uploadfile/2013/8/16/11174118401.gif',
        file_host_url + '/uploadfile/2013/8/16/11151333598.gif',
        file_host_url + '/uploadfile/2013/8/16/1115134385.gif',
        file_host_url + '/uploadfile/2013/8/16/11152946761.gif',
        file_host_url + '/uploadfile/2013/8/16/11152745905.gif',
        file_host_url + '/uploadfile/2013/8/16/11133554005.gif',
        file_host_url + '/uploadfile/2013/8/16/11134346095.gif',
        file_host_url + '/uploadfile/2013/8/16/11131974343.gif',
        file_host_url + '/uploadfile/2013/8/16/1114980791.gif',
        file_host_url + '/uploadfile/2013/8/16/11133555473.gif',
        file_host_url + '/uploadfile/2013/8/16/11134548155.gif',
        file_host_url + '/uploadfile/2013/8/16/11131356271.gif',
        file_host_url + '/uploadfile/2013/8/16/11142528006.gif',
        file_host_url + '/uploadfile/2013/8/16/11142875361.gif',
        file_host_url + '/uploadfile/2013/8/16/11143720174.gif',
        file_host_url + '/uploadfile/2013/8/16/11133126148.gif',
        file_host_url + '/uploadfile/2013/8/16/1115999799.gif'
    ],
    'AC娘': [
        file_host_url + '/uploadfile/2013/5/1/154532278.gif',
        file_host_url + '/uploadfile/2013/5/1/154555581.gif',
        file_host_url + '/uploadfile/2013/5/1/154562837.gif',
        file_host_url + '/uploadfile/2013/5/1/154565096.gif',
        file_host_url + '/uploadfile/2013/5/1/154535058.gif',
        file_host_url + '/uploadfile/2013/5/1/154582527.gif',
        file_host_url + '/uploadfile/2013/5/1/154537281.gif',
        file_host_url + '/uploadfile/2013/5/1/154514697.gif',
        file_host_url + '/uploadfile/2013/5/1/154682556.gif',
        file_host_url + '/uploadfile/2013/5/1/175037946.gif',
        file_host_url + '/uploadfile/2013/5/1/175010088.gif',
        file_host_url + '/uploadfile/2013/5/1/175035836.gif',
        file_host_url + '/uploadfile/2013/5/1/175099939.gif',
        file_host_url + '/uploadfile/2013/5/1/175095150.gif',
        file_host_url + '/uploadfile/2013/5/1/175018213.gif',
        file_host_url + '/uploadfile/2013/5/1/175042828.gif',
        file_host_url + '/uploadfile/2013/5/1/175024007.gif',
        file_host_url + '/uploadfile/2013/5/1/175021712.gif',
        file_host_url + '/uploadfile/2013/5/1/175099968.gif',
        file_host_url + '/uploadfile/2013/5/1/1172189856.gif',
        file_host_url + '/uploadfile/2013/5/1/1172139907.gif',
        file_host_url + '/uploadfile/2013/5/1/1172179772.gif',
        file_host_url + '/uploadfile/2013/5/1/1172123950.gif',
        file_host_url + '/uploadfile/2013/5/1/1172196448.gif',
        file_host_url + '/uploadfile/2013/5/1/1172150639.gif',
        file_host_url + '/uploadfile/2013/5/1/1172128654.gif',
        file_host_url + '/uploadfile/2013/5/1/1172121164.gif',
        file_host_url + '/uploadfile/2013/5/1/1172190725.gif',
        file_host_url + '/uploadfile/2013/5/1/1172260303.gif',
        file_host_url + '/uploadfile/2013/5/1/1253071946.gif',
        file_host_url + '/uploadfile/2013/5/1/1253178110.gif',
        file_host_url + '/uploadfile/2013/5/1/1253139642.gif',
        file_host_url + '/uploadfile/2013/5/1/1253170357.gif',
        file_host_url + '/uploadfile/2013/5/1/1253179165.gif',
        file_host_url + '/uploadfile/2013/5/1/1253179956.gif',
        file_host_url + '/uploadfile/2013/5/1/1253190418.gif',
        file_host_url + '/uploadfile/2013/5/1/1253147958.gif',
        file_host_url + '/uploadfile/2013/5/1/1253120707.gif',
        file_host_url + '/uploadfile/2013/5/1/1253120443.gif',
        file_host_url + '/uploadfile/2013/5/1/1321942679.gif',
        file_host_url + '/uploadfile/2013/5/1/1321987811.gif',
        file_host_url + '/uploadfile/2013/5/1/1321941325.gif',
        file_host_url + '/uploadfile/2013/5/1/1321927514.gif',
        file_host_url + '/uploadfile/2013/5/1/1321991467.gif',
        file_host_url + '/uploadfile/2013/5/1/1321947653.gif',
        file_host_url + '/uploadfile/2013/5/1/1321990298.gif',
        file_host_url + '/uploadfile/2013/5/1/1321936622.gif',
        file_host_url + '/uploadfile/2013/5/1/1321992030.gif',
        file_host_url + '/uploadfile/2013/5/1/1321926723.gif',
        file_host_url + '/uploadfile/2013/5/1/1904549354.gif',
        file_host_url + '/uploadfile/2013/5/1/1904571788.gif',
        file_host_url + '/uploadfile/2013/5/1/1904644272.gif',
        file_host_url + '/uploadfile/2013/5/1/1904618902.gif',
        file_host_url + '/uploadfile/2013/5/1/18294161927.gif',
        file_host_url + '/uploadfile/2013/5/1/18294142166.gif',
        file_host_url + '/uploadfile/2013/5/1/18294278076.gif',
        file_host_url + '/uploadfile/2013/5/1/18294293433.gif',
        file_host_url + '/uploadfile/2013/5/1/18294249770.gif',
        file_host_url + '/uploadfile/2013/5/1/18294224400.gif',
        file_host_url + '/uploadfile/2013/5/1/18294259519.gif',
        file_host_url + '/uploadfile/2013/5/1/18294270736.gif',
        file_host_url + '/uploadfile/2013/5/1/18294328127.gif',
        file_host_url + '/uploadfile/2013/5/1/18294374463.gif',
        file_host_url + '/uploadfile/2013/5/1/18311799834.gif',
        file_host_url + '/uploadfile/2013/5/1/18311792758.gif',
        file_host_url + '/uploadfile/2013/5/1/18311713975.gif',
        file_host_url + '/uploadfile/2013/5/1/18311772996.gif',
        file_host_url + '/uploadfile/2013/5/1/18311712507.gif',
        file_host_url + '/uploadfile/2013/5/1/18311861366.gif',
        file_host_url + '/uploadfile/2013/5/1/18311886209.gif',
        file_host_url + '/uploadfile/2013/5/1/18311855230.gif',
        file_host_url + '/uploadfile/2013/5/1/18311967502.gif',
        file_host_url + '/uploadfile/2013/5/1/18311978719.gif',
        file_host_url + '/uploadfile/2013/5/1/18541959714.gif',
        file_host_url + '/uploadfile/2013/5/1/18541994833.gif',
        file_host_url + '/uploadfile/2013/5/1/18541982148.gif',
        file_host_url + '/uploadfile/2013/5/1/18541986288.gif',
        file_host_url + '/uploadfile/2013/5/1/18541955310.gif',
        file_host_url + '/uploadfile/2013/5/1/18541929939.gif',
        file_host_url + '/uploadfile/2013/5/1/18541941156.gif',
        file_host_url + '/uploadfile/2013/5/1/18541946765.gif',
        file_host_url + '/uploadfile/2013/5/1/18541915786.gif',
        file_host_url + '/uploadfile/2013/5/1/18541986025.gif',
        file_host_url + '/uploadfile/2013/5/1/1856855023.gif',
        file_host_url + '/uploadfile/2013/5/1/1856859163.gif',
        file_host_url + '/uploadfile/2013/5/1/1856811359.gif',
        file_host_url + '/uploadfile/2013/5/1/1856839401.gif',
        file_host_url + '/uploadfile/2013/5/1/1856951673.gif',
        file_host_url + '/uploadfile/2013/5/1/1856981184.gif',
        file_host_url + '/uploadfile/2013/5/1/1856986792.gif',
        file_host_url + '/uploadfile/2013/5/1/1856998009.gif',
        file_host_url + '/uploadfile/2013/5/1/1856943128.gif',
        file_host_url + '/uploadfile/2013/5/1/1856930443.gif'
    ],
    '彼尔德': [
        file_host_url + '/uploadfile/2013/5/1/1923581777.gif',
        file_host_url + '/uploadfile/2013/5/1/1923622342.gif',
        file_host_url + '/uploadfile/2013/5/1/1923686972.gif',
        file_host_url + '/uploadfile/2013/5/1/1923620874.gif',
        file_host_url + '/uploadfile/2013/5/1/1923672819.gif',
        file_host_url + '/uploadfile/2013/5/1/1923678428.gif',
        file_host_url + '/uploadfile/2013/5/1/194570315.gif',
        file_host_url + '/uploadfile/2013/5/1/194581533.gif',
        file_host_url + '/uploadfile/2013/5/1/194550554.gif',
        file_host_url + '/uploadfile/2013/5/1/194513967.gif',
        file_host_url + '/uploadfile/2013/5/1/194591282.gif',
        file_host_url + '/uploadfile/2013/5/1/194678183.gif',
        file_host_url + '/uploadfile/2013/5/1/194683792.gif',
        file_host_url + '/uploadfile/2013/5/1/194623302.gif',
        file_host_url + '/uploadfile/2013/5/1/194651345.gif',
        file_host_url + '/uploadfile/2013/5/1/194656953.gif',
        file_host_url + '/uploadfile/2013/5/1/19182984320.gif',
        file_host_url + '/uploadfile/2013/5/1/19182929439.gif',
        file_host_url + '/uploadfile/2013/5/1/19182964559.gif',
        file_host_url + '/uploadfile/2013/5/1/19183052928.gif',
        file_host_url + '/uploadfile/2013/5/1/19183014873.gif',
        file_host_url + '/uploadfile/2013/5/1/19183092188.gif',
        file_host_url + '/uploadfile/2013/5/1/19183097796.gif',
        file_host_url + '/uploadfile/2013/5/1/19183059741.gif',
        file_host_url + '/uploadfile/2013/5/1/19183047056.gif',
        file_host_url + '/uploadfile/2013/5/1/19183076567.gif',
        file_host_url + '/uploadfile/2013/5/1/19204268598.gif',
        file_host_url + '/uploadfile/2013/5/1/19204320380.gif',
        file_host_url + '/uploadfile/2013/5/1/19204380869.gif',
        file_host_url + '/uploadfile/2013/5/1/19204348422.gif',
        file_host_url + '/uploadfile/2013/5/1/19204361108.gif',
        file_host_url + '/uploadfile/2013/5/1/19204352563.gif',
        file_host_url + '/uploadfile/2013/5/1/19204321584.gif',
        file_host_url + '/uploadfile/2013/5/1/19204363780.gif',
        file_host_url + '/uploadfile/2013/5/1/19204373529.gif',
        file_host_url + '/uploadfile/2013/5/1/19204342550.gif',
        file_host_url + '/uploadfile/2013/5/1/19225773905.gif',
        file_host_url + '/uploadfile/2013/5/1/19225744395.gif',
        file_host_url + '/uploadfile/2013/5/1/19225724633.gif',
        file_host_url + '/uploadfile/2013/5/1/19225747067.gif',
        file_host_url + '/uploadfile/2013/5/1/19225769501.gif',
        file_host_url + '/uploadfile/2013/5/1/19225845186.gif',
        file_host_url + '/uploadfile/2013/5/1/19225884445.gif',
        file_host_url + '/uploadfile/2013/5/1/19225873228.gif',
        file_host_url + '/uploadfile/2013/5/1/19225842250.gif',
        file_host_url + '/uploadfile/2013/5/1/19225851999.gif',
        file_host_url + '/uploadfile/2013/5/1/19245387322.gif',
        file_host_url + '/uploadfile/2013/5/1/19245376105.gif',
        file_host_url + '/uploadfile/2013/5/1/19245385854.gif',
        file_host_url + '/uploadfile/2013/5/1/19245314148.gif',
        file_host_url + '/uploadfile/2013/5/1/19245354876.gif',
        file_host_url + '/uploadfile/2013/5/1/19245346331.gif',
        file_host_url + '/uploadfile/2013/5/1/19245382918.gif',
        file_host_url + '/uploadfile/2013/5/1/19245333646.gif',
        file_host_url + '/uploadfile/2013/5/1/19245426156.gif',
        file_host_url + '/uploadfile/2013/5/1/19245485177.gif'
    ]
};

var options = {};
var emotion_groups = {};

// 将修改后的设置存回到localStorage
function storeOptions() {
    localStorage.setItem('reply_options', JSON.stringify(options));
}

// 载入设置
function loadOptions() {
    options = JSON.parse(localStorage.getItem('reply_options')) || {};

    for (var prop in DEFAULT_OPTIONS) {
        if (options[prop] === undefined) {
            options[prop] = DEFAULT_OPTIONS[prop];
        }
    }

    storeOptions();
}

function storeEmotions() {
    localStorage.setItem('emotion_groups', JSON.stringify(emotion_groups));
}

function loadEmotions() {
    emotion_groups = JSON.parse(localStorage.getItem('emotion_groups')) || {};

    if (!emotion_groups || jQuery.isEmptyObject(emotion_groups)) { emotion_groups = DEFAULT_EMOTIONS; }
}

loadOptions();
loadEmotions();

////////////////////////////////////////////////////////////////////////////////
// 以下是界面无关的代码
////////////////////////////////////////////////////////////////////////////////

// unique id generator
var uid = function() {
    var id = 0;
    return function() {
        return id++;
    };
}();

// simple jquery draggable div plug-in
// from https://reader-download.googlecode.com/svn/trunk/jquery-draggable/index.html
// modified by soda<sodazju@gmail.com>
$.fn.drags = function(opt) {

    opt = $.extend({
        selected: "",   // 被鼠标选中的对象（默认为this）
        draggable: "",  // 被拖动的对象（默认为this）
        cursor: "move",
        draggableClass: "draggable",
        preventDefault: false
    }, opt);

    var $draggable = (opt.draggable === "") ? this : $(document).find(opt.draggable);
    var $selected = (opt.selected === "") ? this : $(document).find(opt.selected);

    $draggable.addClass(opt.draggableClass);
    $selected.css('cursor', opt.cursor);

    $selected.on('mousedown', function(e) {
        var pos_y = $draggable.offset().top - e.pageY;
        var pos_x = $draggable.offset().left - e.pageX;

        $(document).on('mousemove', function(e) {
            $draggable.offset({
                "top": e.pageY + pos_y,
                "left": e.pageX + pos_x
            });
        }).on('mouseup', function() {
            $(this).off('mousemove'); // Unbind events from document
        });
        if (opt.preventDefault) {
            e.preventDefault(); // disable selection
        }
    });

    return this;
};


////////////////////////////////////////////////////////////////////////////////
// 以下都是跟界面有关的函数
////////////////////////////////////////////////////////////////////////////////

// 显示当前设置
function showOptions() {
    $('#prompt-string').val(options.promptString);
    $('#prompt-color').val(options.promptColor);
    $('#reply-tail').val(options.replyTail);
    $('#default-reply-content').val(options.defaultReplyContent);
    $('#disable-in-xinlin').prop('checked', options.disableInXinlin);
    $('#use-relative-link').prop('checked', options.useRelativeURL);
    $('#show-fast-reply-button').prop('checked', options.showFastReplyButton);
    $('#always-show-emotions').prop('checked', options.alwaysShowEmotions);
    $('#replace-native-quote-button').prop('checked', options.replaceNativeQuoteButton);
    $('#modifier-key option[value="ctrl"]').prop('selected', options.modifierKey==='ctrl');
    $('#modifier-key option[value="alt"]').prop('selected', options.modifierKey==='alt');
    for (var i = 65; i <= 90; ++i) {
        $('#keycode').append('<option value="' + i + '"' + ((options.hotKeyCode === i) ? 'selected' : '') + '>' +
            String.fromCharCode(i) + '</option>');
    }
}

// 保存设置
function saveOptions() {
    options.promptString = $('#prompt-string').val();
    options.promptColor = $('#prompt-color').val();
    options.replyTail = $('#reply-tail').val();
    options.defaultReplyContent = $('#default-reply-content').val();
    options.disableInXinlin = $('#disable-in-xinlin').prop('checked');
    options.useRelativeURL = $('#use-relative-link').prop('checked');
    options.showFastReplyButton = $('#show-fast-reply-button').prop('checked');
    options.alwaysShowEmotions = $('#always-show-emotions').prop('checked');
    options.replaceNativeQuoteButton = $('#replace-native-quote-button').prop('checked');
    options.modifierKey = $('#modifier-key option:selected').val();
    options.hotKeyCode = parseInt($('#keycode option:selected').val(), 10);

    storeOptions();
    $('#reply_options').fadeOut("fast", function(){ $(this).remove(); });
}

// 显示发帖心情
function showExpressionList() {
    if ($('#expression_list').length) { return; }   // 如果页面中已经存在「心情列表」则返回

    $('#subject_line').append('<div id="expression_list"></div>');

    for (var i = 1; i <= 22; ++i) {
        $('#expression_list').append('<img src="' + location.origin + '/face/face' + i + '.gif">');
    }

    $('#expression_list > img').click(function() {
        $('#post_expression').children().eq(0).attr('src', this.src);
        $('#expression_list').fadeOut("fast", function(){ $(this).remove(); });
    });
    $('#expression_list').hide().fadeIn("fast");
}

// 添加UBB代码
function addUBBCode(key) {
    var elem = document.getElementById('post_content');
    var start = elem.selectionStart;
    var end = elem.selectionEnd;
    var open_tag = '[' + key + ']';
    var close_tag = '[/' + key + ']';
    var sel_txt = elem.value.substring(start,end);
    var replace = open_tag + sel_txt + close_tag;

    elem.value = elem.value.substring(0,start) + replace + elem.value.substring(end);

    elem.focus();
    elem.selectionStart = elem.selectionEnd = start + open_tag.length + sel_txt.length;
}

// 往输入框当前光标位置添加内容
function insertContent(content) {
    var elem = $('#post_content').get(0);
    var start = elem.selectionStart;
    var end = elem.selectionEnd;
    elem.value = elem.value.substring(0,start) + content + elem.value.substring(end);
    elem.focus();
    elem.selectionStart = elem.selectionEnd = start + content.length;
}

// 显示当前表情分组
function showCurrentEmotionGroup() {
    var current = $('.current').text();
    var default_list = $('#default_list');
    var user_defined_list = $('#user_defined_list');

    localStorage.setItem('last_emot_tab', current);

    if (current === '默认') {
        user_defined_list.hide();
        default_list.show();
        $('#delete_emot_group').hide();
        $('#edit_emot_group').hide();
        return;
    }

    // 隐藏默认表情列表，显示编辑、删除选项
    default_list.hide();
    $('#delete_emot_group').show();
    $('#edit_emot_group').show();

    // 如果选中的是之前缓存的分组就直接显示
    if (user_defined_list.data('group_name') === current) {
        user_defined_list.show();
        return;
    }

    user_defined_list.empty();
    user_defined_list.data('group_name', current);
    for (var i = 0; i !== emotion_groups[current].length; ++i) {
        if (!emotion_groups[current][i]) { continue; }  // 跳过空行
        user_defined_list.append('<img src="' + emotion_groups[current][i] + '">');
    }

    // 绑定点击事件、预览功能
    $('#user_defined_list > img').click(function() {
        insertContent('[upload=' + this.src.substring(this.src.lastIndexOf('.') + 1) +']' + this.src + '[/upload]');
    }).hover(function() {
        $('#emot_preview').attr('src', this.src);
        $('#emot_preview').show();
        if (this.offsetLeft < $('#user_defined_list').get(0).clientWidth / 2) {
            $('#emot_preview').css({
                'left': '',
                'right': '0'
            });
        } else {
            $('#emot_preview').css({
                'left': '0',
                'right': ''
            });
        }
    }, function() {
        $('#emot_preview').hide();
    });

    user_defined_list.show();
}

// 显示添加和编辑表情分组的界面
function showEmotionConfig() {
    $('body').append([
        '<div id="emotion_config">',
        '<form>',
        '<fieldset>',
            '<legend><h3 id="emotion_config_action">编辑分组</h3></legend>',
            '<label for="group_name">分组名称（不能和已有的重复）</label>',
            '<br>',
            '<input id="group_name" type="text">',
            '<br>',
            '<label for="group_content">分组表情列表（图片地址或者带[upload]标签的地址，用换行符分隔）</label>',
            '<br>',
            '<textarea id="group_content"></textarea>',
            '<br>',
            '<input type="button" id="confirm_emotion_config" value="确认">',
            '<input type="button" id="cancel_emotion_config" value="取消">',
        '</fieldset>',
        '</form>',
        '</div>',
        ].join('\n'));
    $('#emotion_config').hide().fadeIn("fast");
    $('#emotion_config').css({
        'top': (document.body.clientHeight - $('#emotion_config').height()) / 2 + $(window).scrollTop(),
        'left': (document.body.clientWidth - $('#emotion_config').width()) / 2 + $(window).scrollLeft()
    });
    $('#cancel_emotion_config').click(function() { $('#emotion_config').fadeOut("fast", function(){ $(this).remove(); }); });
}

// 添加表情分组
function addEmotionGroup() {
    showEmotionConfig();
    $('#emotion_config_action').text('添加表情分组');
    $('#confirm_emotion_config').click(function(){
        var group_name = $('#group_name').val();
        var group_content = $('#group_content').val();
        if (!group_name) {
            alert('请指定分组名称');
            return;
        }
        if (!group_content) {
            alert('请至少添加一个表情');
            return;
        }
        if (emotion_groups[group_name]) {
            alert('与其他分组重名');
            return;
        }

        emotion_groups[group_name] = group_content.replace(/((?:\[upload=.*\])(.*)(?:\[\/upload\]))/ig, '$2').split('\n');
        storeEmotions();

        // 添加表情分组
        var tab = $('<li class="tab_item">' + group_name + '</li>');
        tab.click(function() {
            if ($(this).hasClass('current')) {
                return;
            }

            $('.current').removeClass('current');
            $(this).addClass('current');
            showCurrentEmotionGroup();
        });
        $('#emot_tab').append(tab);

        $('#emotion_config').fadeOut("fast", function(){ $(this).remove(); });
    });
}

// 删除表情分组
function deleteEmotionGroup() {
    if (!confirm('确认删除该分组？')) {
        return;
    }

    delete emotion_groups[$('.current').text()];
    storeEmotions();

    $('.current').remove();
    $('#default_emotion_group').addClass('current');
    showCurrentEmotionGroup();
}

// 编辑表情分组
function editEmotionGroup() {
    showEmotionConfig();
    $('#emotion_config_action').text('编辑表情分组');

    var current = $('.current').text();
    $('#group_name').val(current);
    $('#group_content').val(emotion_groups[current].join('\n'));

    $('#confirm_emotion_config').click(function(){
        var group_name = $('#group_name').val();
        var group_content = $('#group_content').val();
        if (!group_name) {
            alert('请指定分组名称');
            return;
        }
        if (!group_content) {
            alert('请至少添加一个表情');
            return;
        }

        // 更新emotion_groups
        if (group_name !== current) {
            if (emotion_groups[group_name]) {
                alert('与其他分组重名');
                return;
            }

            delete emotion_groups[current];
            $('.current').text(group_name);
        }

        emotion_groups[group_name] = group_content.replace(/((?:\[upload=.*\])(.*)(?:\[\/upload\]))/ig, '$2').split('\n');
        storeEmotions();

        $('#emotion_config').fadeOut("fast", function(){ $(this).remove(); });

        // 刷新表情列表
        $('#user_defined_list').empty();
        $('#user_defined_list').data('group_name', '');
        showCurrentEmotionGroup();
    });
}

// 显示表情列表
function toggleEmotions() {
    if ($('#emot_panel').length) {
        $('#emot_panel').fadeToggle();
        return;
    }

    $('#reply_dialog').append([
        '<div id="emot_panel">',
            '<ul id="emot_tab">',
                '<li id="default_emotion_group" class="tab_item current">默认</li>',
            '</ul>',
            '<div id="default_list" class="emotion_list"></div>',
            '<div id="user_defined_list" class="emotion_list"></div>',
            '<img id="emot_preview"></img>',
            '<ul id="emot_action">',
                '<li id="add_emot_group">添加分组</li>',
                '<li id="edit_emot_group">编辑分组</li>',
                '<li id="delete_emot_group">删除分组</li>',
            '</ul>',
        '</div>'
        ].join('\n'));

    // 显示分组
    var emot_tab = $('#emot_tab');
    for (var group in emotion_groups) {
        if (emotion_groups.hasOwnProperty(group)) {
            emot_tab.append('<li class="tab_item">' + group + '</li>');
        }
    }

    // 显示默认分组
    for (var i = 0; i <= 91; ++i) {
        $('#default_list').append('<img src="' + location.origin + '/emot/simpleemot/emot' + ((i < 10) ? '0' + i : i) + '.gif">');
    }
    $('#default_list > img').click(function() {
        insertContent(this.src.replace(/.*emot(\d+)\.gif/ig, '[em$1]'));
    });

    $('#add_emot_group').click(addEmotionGroup);
    // 默认分组没有编辑和删除两个选项，也没有表情预览
    $('#edit_emot_group').click(editEmotionGroup).hide();
    $('#delete_emot_group').click(deleteEmotionGroup).hide();
    $('#emot_preview').hide();

    // 切换表情分组
    $('.tab_item').click(function() {
        if ($(this).hasClass('current')) {
            return;
        }

        $('.current').removeClass('current');
        $(this).addClass('current');
        showCurrentEmotionGroup();
    });

    // 显示最后使用的表情分组
    var last = localStorage.getItem('last_emot_tab');
    $('.tab_item').each(function() {
        if ($(this).text() === last) {
            $(this).click();
        }
    });

    $('#emot_panel').hide().fadeIn("fast");   // 渐显特效
}

// 上传文件
function uploadFiles() {
    var files = document.getElementById('files').files;

    if (!files.length) {
        document.getElementById('upload_msg').textContent = '请选择要上传的文件';
        return;
    }

    document.getElementById('attach_table').style.display = 'table';
    for (var i = 0, f; i < files.length; ++i) {
        f = files[i];

        var result = document.createElement('tr');
        var name = document.createElement('td');
        var size = document.createElement('td');
        var status = document.createElement('td');

        name.id = 'file' + uid();
        name.className = 'filename';
        name.textContent = f.name;
        size.textContent = (f.size / 1024).toFixed(2) + ' kB';
        status.textContent = '正在上传…';

        result.appendChild(name);
        result.appendChild(size);
        result.appendChild(status);

        document.getElementById('attach_list').appendChild(result);

        // jQuery和原生JS夹杂的风格很不喜欢，不过没办法了
        // 采用闭包的原因是为了防止for循环结束后，上层函数（uploadFile）里各个变量都固定为最后一个
        var callback = function(file_id, image_autoshow) {
            return function(html) {
                var file = $('#' + file_id);

                var pattern = /script>insertupload\('([^']+)'\);<\/script/ig;
                var ubb = pattern.exec(html);

                if (ubb) {
                    // 要插入的ubb代码
                    ubb = ubb[1] + '\n';

                    // 自动显示图片
                    if (image_autoshow) {
                        ubb = ubb.replace(/(,1)/ig, "");
                    }
                    // mp3 替换成 audio 标签
                    if (ubb.substr(ubb.indexOf('=') + 1, 3) === 'mp3') {
                        ubb = ubb.replace(/upload/g, 'audio')
                    }

                    file.next().next().addClass('uploadsuccess').text('上传成功');

                    // 点击文件名插入ubb代码
                    file.css('cursor', 'pointer');
                    file.click(function(ubb) {
                        return function() {
                            insertContent(ubb);
                        };
                    }(ubb));

                } else if (html.indexOf('文件格式不正确') !== -1) {
                    file.next().next().addClass('uploadfail').text('文件格式不正确');
                } else {
                    file.next().next().addClass('uploadfail').text('上传失败');
                }
            };
        }(name.id, $('#image_autoshow').prop('checked'));

        _cc98.upload(f, callback);
    }

    // 关闭上传面板
    $('#upload_panel').fadeOut("fast", function(){ $(this).remove(); });
}

// 保存草稿
function saveDraft() {
    sessionStorage.setItem('cc98_editor_subject', $('#post_subject').val());
    sessionStorage.setItem('cc98_editor_content', $('#post_content').val());
    var d = new Date();
    var time = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
    $('#e_tip').text('帖子内容保存于 ' + time);
}

// 将content中的URL替换为相对链接
function makeRelativeURL(content) {
    return content.replace(/(?:\[url=)?(?:http:\/\/)?(?:www|hz)\.cc98\.(?:lifetoy\.)?org\/[&=#%\w\+\.\?]+/g, function(match){
        if (match.indexOf('[url=') !== 0) {
            return '[u][url]' + _cc98.formatURL(match) + '[/url][/u]';
        } else {
            return '[url=' + _cc98.formatURL(match.substring(5));
        }
    });
}

// 显示发帖状态（成功、失败、10s等）
function showReplyStatus(status, color) {
    $('#submitting_status').text(status);
    if (color) { $('#submitting_status').css('color', color); }
}

// 显示@结果
function showAtStatus(username, success) {
    if (!$('#at-status').length) {
        $('#reply_dialog').append('<ul id="at-status"></ul>');
    }

    if (success) {
        $('#at-status').append('<li class="at-succeed">@' + username + '成功</li>');
    } else {
        $('#at-status').append('<li class="at-fail">@' + username + '失败</li>');
    }
}

// at用户并刷新页面（于回复成功后执行）
function atUsers() {
    // 去除引用内容（匹配规则并不十分准确不过够用了）
    var text = $('#post_content').val().replace(/(\[quote\][\s\S]*\[\/quote\])|(\[quotex\][\s\S]*\[\/quotex\])/ig, '');
    var tmp = text.match(/@@([^\s]*)(\s|$)/ig) || [];
    var users = [];
    var username;
    for (var i = 0; i !== tmp.length; ++i) {
        username = tmp[i].replace('@@', '').trim();
        if (username) {
            users.push(username);
        }
    }

    // 如果没有被@的用户则直接跳转
    if (!users.length) {
        showReplyStatus('回复成功，正在跳转…');
        location.reload();
        return;
    }

    // 否则开始@
    showReplyStatus('回复成功，正在处理@信息…');
    var title = document.title.replace(/ » CC98论坛$/ig, '');
    var message = '我在帖子' + '[url=' + _cc98.formatURL(location.href, true) + '][color=blue]' + title + '[/color][/url]' + '中@了你,快来看看吧~!';

    var pending = users.length;
    while (users.length) {
        username = users.shift();
        _cc98.sendPM({
            'recipient': username,
            'subject': '@提示',
            'message': message,
            'callback': function(username) {
                return function(html) {
                    if (html.indexOf('论坛成功信息') !== -1) {
                        showAtStatus(username, true);
                    } else {
                        showAtStatus(username, false);
                    }

                    pending--;
                    if (pending === 0) {
                        $('#at-status').append('<br><li class="at-complete">@完毕，正在跳转</li>');
                        setTimeout(function() { location.reload(); }, 1000);
                    }
                };
            }(username)
        });
    }
}

// 实际发表回复
function reply() {
    // 小表情
    var expr = $('#post_expression').children().eq(0).attr('src');
    expr = expr.substring(expr.lastIndexOf('/') + 1);

    // 考虑到用户可能把默认回复和小尾巴都去掉，所以回复内容仍可能为空
    if ($('#post_content').val() === "") {
        showReplyStatus('帖子内容不能为空');
        return;
    }

    showReplyStatus('发表帖子中…');

    _cc98.reply({
        "url": window.location.href,
        "expression": expr,
        "content": $('#post_content').val(),
        "subject": $('#post_subject').val(),
        "replyid": $('#the_reply_id').val(),
        "sendsms": $('#notfiy_user_checkbox').prop('checked'),
        "callback": function(html) {
            if (html.indexOf('状态：回复帖子成功') !== -1) {
                // 回复成功，下一步是处理@信息并刷新页面
                atUsers();
            } else if (html.indexOf('本论坛限制发贴距离时间为10秒') !== -1) {
                // 10s倒计时
                for (var i = 0; i <= 10; ++i) {
                    setTimeout(function(e) {
                        return function() { showReplyStatus('论坛限制发帖时间间隔10s，倒计时' + (10-e) + 's…'); };
                    }(i), i * 1000);
                }

                // 倒计时结束重新发帖
                setTimeout(reply, 10000);
            } else if (html.indexOf('主题长度不能超过100') !== -1) {
                showReplyStatus('主题长度不能超过100');
            } else if (html.indexOf('发言内容不得大于16240bytes') !== -1) {
                showReplyStatus('发言内容不得大于16240bytes');
            } else {
                showReplyStatus('未知错误');
            }
        }
    });
}

// 提交回复，包括对帖子内容的预处理（加小尾巴等）
function submit() {
    if (!options.disableInXinlin || _lib.parseQS(location.search)['boardid'] !== '182') {
        // 为空则添加默认回复
        if ($('#post_content').val() === '') {
            $('#post_content').val(options.defaultReplyContent);
        }

        // 添加小尾巴
        if (options.replyTail) {
            $('#post_content').val($('#post_content').val() + '\n' + options.replyTail);
        }
    }

    // 相对链接
    if (options.useRelativeURL) {
        $('#post_content').val(makeRelativeURL($('#post_content').val()));
    }

    if ($('#previewfrm').prev().children().children().children().text().indexOf('解锁') === -1 || confirm('本帖已锁定，确定要回复吗？')) {
        reply();
    }
}

// 显示回复面板，添加与其相关的各种事件绑定
function showDialog() {
    var reply_dialog_html = [
        '<div id="reply_dialog">',
        '<form id="replyform">',
        '<input id="the_reply_id" type="hidden" value="">',
        '<ul id="replytable"width="100%">',
            '<li id="dialog_header">',
                '<h3 id="replybox_title" class="box_title">',
                    '参与/回复主题',
                    '<a id="show_options" href="javascript:void(0);">[设置]</a>',
                    '<span><a id="dialog_close_btn" class="close_btn" title="关闭"></a></span>',
                '</h3>',
            '</li>',

            '<li id="subject_line" class="clearfix">',
                '<label for="post_subject"><a id="post_expression" href="javascript:void(0);"><img src="' + location.origin + '/face/face7.gif"></a></label>',
                '<input type="text" id="post_subject" name="post_subject">',
                '<input style="display:none"',  // form中如果只有一个input元素，按下enter会导致表格提交，这个input元素是为了防止这种情况
            '</li>',

            '<li>',
                '<div id="editor">',
                    '<div id="e_control">',
                        '<a id="add_emotions" title="表情" href="javascript:void(0);"><img class="e_ctrl_btn" src="' + location.origin + '/emot/simpleemot/emot88.gif"></a>',
                        '<a id="bold" title="加粗" href="javascript:void(0);"><img class="e_ctrl_btn" src="' + file_host_url + '/uploadfile/2013/8/7/22333264497.gif"></a>',
                        '<a id="strikethrough" title="删除线" href="javascript:void(0);"><img class="e_ctrl_btn" src="' + file_host_url + '/uploadfile/2013/8/7/22525420119.png"></a>',
                        '<a id="add_attachments" href="javascript:void(0);">| 添加附件</a>',
                        '<div id="notfiy_user" style="display:none; float: right; margin: 0px 15px 0px 0px; border-right-width: 0px; padding-right: 0px;">',
                            '<input type="checkbox" id="notfiy_user_checkbox" style="vertical-align: middle; margin: 0px 2px 0px 0px;">',
                            '<label style="vertical-align: middle;" for="notfiy_user_checkbox">站短提示 <a id="quoted_username" style="color:blue;" target="_blank" href="javascript:void(0);"></a></label>',
                        '</div>',
                    '</div>',

                    '<textarea id="post_content" role="textbox" aria-multiline="true"></textarea>',

                    '<div id="e_statusbar">',
                        '<span id="e_tip"></span>',
                        '<span id="e_autosavecount"></span>',
                        '<a id="e_save" href="javascript:void(0);">保存草稿</a>',
                        ' | ',
                        '<a id="e_recover" href="javascript:void(0);">恢复数据</a>',
                    '</div>',
                '</div>',
            '</li>',

            '<li>',
                '<table class="btn_bar">',
                    '<tbody>',
                        '<tr>',
                            '<td width="20%"><input type="button" id="submit_post" class="soda_button" value="提交回复"></td>',
                            '<td width="80%"><span id="submitting_status"></span></td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            '</li>',

        '</ul>',
        '</form>',

        '<table id="attach_table">',
            '<thead>',
                '<tr>',
                    '<th id="filenames" width="50%">点击文件名添加到帖子中（点此全部加入）</th>',
                    '<th width="20%">大小</th>',
                    '<th width="30%">状态</th>',
                '</tr>',
            '</thead>',
            '<tbody id="attach_list">',
            '</tbody>',
        '</table>',

        '</div>'
    ].join('\n');

    var upload_panel_html = [
        '<div id="upload_panel">',
            '<h3 id="upload_title" class="box_title">',
                '添加附件',
                '<span><a id="upload_close_btn" class="close_btn" title="关闭"></a></span>',
            '</h3>',
            '<input type="file" id="files" name="files[]" multiple>',
            '<br>',
            '<table class="btn_bar" width="100%">',
                '<tbody>',
                    '<tr>',
                        '<td><input type="checkbox" id="image_autoshow" name="image_autoshow" value="autoshow"><label for="image_autoshow">直接显示图片</label></td>',
                        '<td><input type="button" id="confirm_upload" class="soda_button" value="上传"></td>',
                    '</tr>',
                '</tbody>',
            '</table>',
            '<div id="upload_msg"></div>',
        '</div>'
    ].join('\n');

    // 回复设置的表单没有用fieldset，因为用了之后关闭按钮的摆放就显得很尴尬……
    var reply_options_html = [
        '<div id="reply_options">',
        '<form id="options_form">',
                '<header id="options_header" class="box_title">',
                    '<b>回复设置</b>',
                    '<span><a id="options_close_btn" class="close_btn" title="关闭"></a></span>',
                '</header>',
            '<div>',
                '<label for="prompt-string" class="desc">原帖链接提示文字</label>',
                '<div><input type="text" id="prompt-string"></div>',
            '</div>',
            '<div>',
                '<label for="prompt-color" class="desc">原帖链接文字颜色</label>',
                '<div><input type="text" id="prompt-color"></div>',
            '</div>',
            '<div>',
                '<label for="reply-tail" class="desc">回复后缀</label>',
                '<div><textarea id="reply-tail"></textarea></div>',
            '</div>',
            '<div>',
                '<label for="default-reply-content" class="desc">默认回复</label>',
                '<div><textarea id="default-reply-content"></textarea></div>',
            '</div>',
            '<fieldset>',
            '<legend></legend>',
            '<div>',
                '<input type="checkbox" id="disable-in-xinlin">',
                '<label for="disable-in-xinlin" >在心灵之约禁用以上设置</label>',
            '</div>',
            '</fieldset>',
            '<br>',

            '<fieldset>',
            '<legend>其他设置</legend>',
            '<div>',
                '<input type="checkbox" id="use-relative-link">',
                '<label for="use-relative-link" >使用相对链接</label>',
            '</div>',
            '<div>',
                '<input type="checkbox" id="show-fast-reply-button">',
                '<label for="show-fast-reply-button">显示快速回复和返回顶部</label>',
            '</div>',
            '<div>',
                '<input type="checkbox" id="always-show-emotions">',
                '<label for="always-show-emotions">总是显示表情菜单</label>',
            '</div>',
            '<div>',
                '<input type="checkbox" id="replace-native-quote-button">',
                '<label for="replace-native-quote-button">替换掉原本的引用按钮</label>',
            '</div>',
            '</fieldset>',
            '<fieldset>',
            '<legend></legend>',
            '<div>',
                '<label class="desc">快速回复快捷键</label>',
                '<select id="modifier-key">',
                    '<option value="ctrl">Ctrl</option>',
                    '<option value="alt">Alt</option>',
                '</select>',
                '<select id="keycode">',
                '</select>',
            '</div>',
            '</fieldset>',
            '<br>',
            '<input type="button" id="save_reply_options" class="soda_button" value="保存设置">',
        '</form>',
        '</div>'
    ].join('\n');


    if ($('#reply_dialog').length) {
        return;
    }
    $('body').append(reply_dialog_html);

    // 居中（可见区域内绝对居中，不是固定居中，考虑到上传文件数量可能特别多超过可见范围）
    $('#reply_dialog').css({
        'top': (document.body.clientHeight - $('#reply_dialog').height()) / 2 + $(window).scrollTop(),
        'left': (document.body.clientWidth - $('#reply_dialog').width()) / 2 + $(window).scrollLeft()
    });

    // 如果始终显示表情菜单，则把位置右移140px
    if (options.alwaysShowEmotions) {
        $('#reply_dialog').css('left', parseInt($('#reply_dialog').css('left'), 10) + 140 + 'px');
    }

    $('#reply_dialog').hide().fadeIn("fast"); // 渐显特效

    // 显示设置界面
    $('#show_options').click(function() {
        if($('#reply_options').length) {
            return;
        }

        $('body').append(reply_options_html);
        $('#options_header').drags({'draggable': '#reply_options'});
        $('#options_close_btn').click(function() { $('#reply_options').fadeOut("fast", function(){ $(this).remove(); }); });

        $('#reply_options').hide().fadeIn("fast");
        $('#reply_options').css({
            'top': (document.body.clientHeight - $('#reply_options').height()) / 2 + $(window).scrollTop(),
            'left': (document.body.clientWidth - $('#reply_options').width()) / 2 + $(window).scrollLeft()
        });

        // 显示当前设置
        showOptions();

        $('#save_reply_options').click(saveOptions);
    });

    // 显示上传界面
    $('#add_attachments').click(function() {
        if ($('#upload_panel').length) {
            return;
        }

        $('body').append(upload_panel_html);
        $('#upload_title').drags({'draggable': '#upload_panel'});
        $('#upload_close_btn').click(function() { $('#upload_panel').fadeOut("fast", function(){ $(this).remove(); }); });

        $('#upload_panel').hide().fadeIn("fast");
        $('#upload_panel').css({
            'top': (document.body.clientHeight - $('#upload_panel').height()) / 2 + $(window).scrollTop(),
            'left': (document.body.clientWidth - $('#upload_panel').width()) / 2 + $(window).scrollLeft()
        });

        $('#confirm_upload').click(uploadFiles);
    });

    // 自动保存草稿
    var autoSaveIntervalId = setInterval(function() {
        var remained = options.autoSaveInterval;  // 剩余时间
        return function() {
            remained -= 10;
            if (remained === 0) {
                saveDraft();
                remained = options.autoSaveInterval;
            }
            $('#e_autosavecount').text(remained + ' 秒后自动保存草稿');
        };
    }(), 10000);    // 10s更改一次状态

    // 各种事件绑定
    $('#replybox_title').drags({"draggable": "#reply_dialog"});
    $('#dialog_close_btn').click(function() {
        $('#reply_dialog').fadeOut("fast", function(){ $(this).remove(); });
        $('#upload_panel').fadeOut("fast", function(){ $(this).remove(); });
        clearInterval(autoSaveIntervalId);
    });

    $('#post_expression').click(showExpressionList);

    // UBB编辑器
    $('#bold').click(function() { addUBBCode('b'); });
    $('#strikethrough').click(function() { addUBBCode('del'); });

    // 表情列表
    if (!options.alwaysShowEmotions) {
        $('#add_emotions').click(toggleEmotions);
    } else {
        toggleEmotions();
    }

    // 点击输入框时，隐藏发帖心情列表
    $('#post_content').click(function() { $('#expression_list').fadeOut("fast", function(){ $(this).remove(); }); });

    // 初始状态
    $('#e_autosavecount').text(options.autoSaveInterval + ' 秒后自动保存草稿');
    // 保存草稿
    $('#e_save').click(saveDraft);
    // 恢复数据
    $('#e_recover').click(function() {
        if ($('#post_content').val() === '' || confirm('此操作将覆盖当前帖子内容，确定要恢复数据吗？')) {
          $('#post_content').val(sessionStorage.getItem('cc98_editor_content'));
      }
    });

    // 提交
    $('#submit_post').click(submit);

    // 将所有上传文件加到帖子中
    $('#filenames').css('cursor', 'pointer').click(function() { $('.filename').click(); });

    // 打开回复时将鼠标焦点定到输入框
    $('#post_content').focus();
}

var libcc98 = require('libcc98');

// 给引用加上查看原帖链接
function addQuoteURL(url, storey, quoteContent) {
    var insertIndex = quoteContent.indexOf('[/b]');
    var quoteURL = _cc98.formatURL(url, true).split('#')[0] + '#' + storey;
    return quoteContent.substring(0, insertIndex) + '  [url=' + quoteURL + '][color=' + options.promptColor + ']' + options.promptString +
        '[/color][/url]' + quoteContent.substring(insertIndex);
}

function showNotifyUser(storey) {
    if (_lib.parseQS(location.search)['boardid'] === '182') { return; }

    var index = ((storey-1) >= 0) ? (storey-1) : 9;
    var post = libcc98.getPostList()[index];
    if (!post) { return; }

    $('#notfiy_user').css('display', '');

    $('#quoted_username').attr('href', location.origin + '/dispuser.asp?name=' + encodeURIComponent(post.author))
                         .text(post.author);
    $('#the_reply_id').val(post.annouceid);
}

// 添加回复内容（这里的storey是1-9再到0,，不是从0开始的）
function addFastQuote(url, index) {
    var storey = (index == 9) ? 0 : (index + 1);

    showDialog();
    showNotifyUser(storey);

    var list = libcc98.getPostList();
    var replyurl = list[index].quote_btn.href;
    $.get(replyurl, function(html) {
        var quoteContent = _lib.unescapeHTML((/<textarea.*>([\s\S]*)<\/textarea>/ig).exec(html)[1]);

        if (!options.disableInXinlin || _lib.parseQS(location.search)['boardid'] !== '182') {
            quoteContent = addQuoteURL(url, storey, quoteContent);
        }

        $('#post_content').val($('#post_content').val() + quoteContent);
    });
}

// 多重引用
function addMultiQuote(url, index) {
    var storey = (index == 9) ? 0 : (index + 1);
    showDialog();
    showNotifyUser(storey);

    url = _cc98.formatURL(url, true);

    libcc98.getPostList(location.origin + url).then(function(posts) {
        var isXinlin = (_lib.parseQS(location.search)['boardid'] === '182');
        var quoteContent = '[quote][b]以下是引用[i]' + (isXinlin ? "匿名" : posts[index].author) + '在' + posts[index].time +
            '[/i]的发言：[/b]\n' + posts[index].content + '\n[/quote]\n';

        if (!options.disableInXinlin || _lib.parseQS(location.href)['boardid'] !== '182') {
            quoteContent = addQuoteURL(url, storey, quoteContent);
        }

        $('#post_content').val($('#post_content').val() + quoteContent);
    });
}

// 给页面加上引用按钮
function addButtons() {

    // 获取所有「引用」链接
    $('a[href*="reannounce.asp"]').each(function(index) {
        var link = $(this);

        // 如果是「答复」则跳过
        if (link.attr('href').indexOf('setfilter') > 0) {
            return;
        }

        // 如果在完整版中没有引用图片作为子节点，或者在简版中文字内容不是[引用]，就不是真正的引用链接
        // 考虑到简版中纯文字的话还可能伪造[引用]链接，所以再加上对它父节点的判断
        if (link.children().first().attr('src') !== 'pic/reply.gif' &&
            (link.text() !== '[引用]' || link.parent().get(0).className !== 'usernamedisp')) {
            return;
        }

        link.addClass('quote_btn');

        link.parent().append('<a href="javascript:void(0);" title="快速引用" class="fastquote_btn"><img src="' + file_host_url + '/uploadfile/2010/4/11/2201680240.png"></a>')
            .append('<a href="javascript:void(0);" title="多重引用" class="multiquote_btn"><img src="' + file_host_url + '/uploadfile/2010/5/12/9395977181.png"></a>');
    });

    // 原生引用按钮
    if (options.replaceNativeQuoteButton) {
        $('.quote_btn').each(function (index) {
            $(this).click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                addFastQuote(location.href, index);
            });
        });
    }

    $('.fastquote_btn').each(function (index) {
        $(this).click(function() { addFastQuote(location.href, index); });
    });

    $('.multiquote_btn').each(function (index) {
        $(this).click(function() { addMultiQuote(location.href, index); });
    });

    // 显示快速回复按钮
    if (options.showFastReplyButton) {
        $('body').append('<div id="tooltip_button_group"><a id="fast_reply" title="快速回复" href="javascript:void(0)"></a><a id="scroll_to_top" style="visibility: hidden; opacity: 0" title="回到页首" href="javascript:void(0)"></a></div>');
        $('#fast_reply').click(showDialog);
        $('#scroll_to_top').click(function() { $('html,body').animate({ scrollTop: 0 }, 'slow'); });

        // show gototop buttons after scroll 100px
        $(window).on('scroll',function(){
            if ($(window).scrollTop() != 0) {
                $('#scroll_to_top').css('visibility', 'visible').fadeTo(200, 1);
            } else {
                $('#scroll_to_top').fadeTo(200, 0).css('visibility', 'hidden');
            }
        });
        $(window).trigger('scroll');
    }
}

// 处理各种键盘快捷键
// 似乎先处理keyCode再处理ctrlKey比较灵敏
function shortcutHandlers(evt) {
    // ALT + R 打开弹出回复框
    var modifierKey = (options.modifierKey === "ctrl") ? evt.ctrlKey : evt.altKey;
    if (evt.keyCode === options.hotKeyCode && modifierKey) {
        showDialog();
    }

    // CTRL + SHIFT + 0-9 快速引用
    if (evt.keyCode >= 48 && evt.keyCode <= 57 && evt.ctrlKey && evt.shiftKey) {
        var storey = evt.keyCode - 48;
        var index = (storey == 0) ? 9 : (storey - 1);
        addFastQuote(location.href, index);
    }
}

function submitShortcut(evt) {
    // CTRL/CMD + ENTER 提交回复
    if (evt.keyCode === 13 && (evt.metaKey || evt.ctrlKey)) {
        submit();
    }
    // ESC 关闭回复框和上传框
    if (evt.keyCode === 27) {
        $('#reply_dialog').fadeOut("fast", function(){ $(this).remove(); });
        $('#upload_panel').fadeOut("fast", function(){ $(this).remove(); });
    }
}

// 给界面添加图标
addButtons();

// 绑定快捷键
$(document).keyup(shortcutHandlers);
// 似乎很多快捷键必须是keydown才足够灵敏（还能防止中文输入法状态下ESC键太灵敏），只好分离出来
$(document).keydown(submitShortcut);

_lib.addStyles([
    '#reply_dialog, #reply_options {',
        'color: #222;',
        'background-color: white;',
        'font: 12px/1.4 ubuntu, "Lucida Grande", "Hiragino Sans GB W3", "Microsoft Yahei", sans-serif;',
        'width: 600px;',
        'position: absolute;',
        'border-radius: 5px;',
        'box-shadow: rgba(0, 0, 0, 0.4) 0 0 20px;',
        'padding: 15px;',
        'margin: 0 auto;',
    '}',

    '#replytable{',
        'display: block;',
        'list-style: none;',
        'padding-left: 0;',
        'margin: 0;',
    '}',

    '.clearfix { clear: both; }',

  '.box_title {',
        'cursor: move;',
        'font-size: 16px;',
        'line-height: 20px;',
        'margin: 0 0 20px 0;',
        'color: #6595D6;',
        'text-align: left;',
    '}',
    '.close_btn {',
        'cursor: pointer;',
        'width: 20px;',
        'height: 20px;',
        'background: url("' + file_host_url + '/uploadfile/2013/8/7/1954562236.gif");',
        'float: right;',
    '}',
    '.close_btn:hover { background-position: 0 -20px; }',

    '#show_options {',
        'color: #fff;',
        'display: inline-block;',
        'margin-left: 5px;',
        'padding: 0 15px;',
        'font-size: 12px;',
    '}',
    '#replybox_title:hover a {color: #222;}',
    '#reply_dialog #subject_line{',
        'height: 20px;',
        'margin: 10px 0;',
    '}',
    '#post_expression {',
        'display: inline-block;',
        'height: 15px;',
        'width: 15px;',
        'margin: 3px;',
        'vertical-align: middle;',
    '}',
    '#post_subject {',
        'margin-left: 5px;',
        'width: 400px;',
        'border: 1px solid #e0e0e0;',
    '}',
    '#post_subject:focus { outline: 1px solid #9AC0E6; }',

    '#expression_list {',
        'position: relative;',
        'background-color: #fff;',
        'z-index: 100;',
        'margin-top: -24px; /* 比原表情的位置偏离一点点，以覆盖住后面表示被选中的虚线框 */',
        'margin-left: 2px;',
    '}',
    '#expression_list img {',
        'cursor: pointer;',
        'margin: 0 10px 0 0;',
        'border: 0;',
    '}',

    '#editor {',
        'margin: 0 auto;',
        'border: 1px solid #9AC0E6;',
        'overflow: auto;',
    '}',

    '#e_control {',
        'color: grey;',

        'background-color: #F1F4F8;',
        'border-bottom: 1px solid #9AC0E6;',
        'padding: 3px;',
    '}',
    'img.e_ctrl_btn {',
        'height: 16px;',
        'width: 16px;',
        'margin: 0 3px 0 0;',
        'border: 0;',
        'vertical-align: middle;',
    '}',
    '#add_attachments {',
        'display: inline-block;',
        'margin-left: 20px;',
        'color: grey;',
        'text-decoration: none;',
        'vertical-align: middle',
    '}',


    '#emot_panel {',
        'position: absolute;',
        'top: 0;',
        'right: 635px;',
        'width: 280px;',
        'background-color: #fff;',
        'padding: 5px 8px;',
        'border-radius: 5px;',
        'box-shadow: rgba(0, 0, 0, 0.4) 0 0 5px;',
    '}',
    '#emot_panel li {',
        'display: inline-block;',
        'padding: 0 4px;',
        'height: 21px;',
        'line-height: 22px;',
        'color: #369;',
        'cursor: pointer;',
    '}',

    '#emot_tab {',
        'border-bottom: 1px solid #B8D4E8;',
        'height: 22px;',
        'margin: 0px;',
        'margin-bottom: 5px;',
        'padding: 0 3px;',
    '}',
    '.current {',
        'font-weight: bold;',
        'padding: 0 8px;',
        'border: 1px solid #B8D4E8;',
        'border-bottom: 1px solid #fff;',
        'border-radius: 3px 3px 0 0;',
    '}',

    '.emotion_list img {',
        'cursor: pointer;',
        'height: 20px;',
        'width: 20px;',
        'margin: 2px;',
        'padding: 1px;',
        'border: 1px solid #ccc;',
    '}',
    '.emotion_list img:hover {',
        'border: 1px solid #f78639;',
    '}',

    '#emot_preview {',
        'position: absolute;',
        'top: 28px;',
        'display: block;',
        'max-height: 100px;',
        'max-width: 100px;',
    '}',

    '#emot_action {',
        'padding-left: 0;',
        'margin: 10px 0 0 0;',
    '}',

    '#emotion_config {',
        'position: absolute;',
        'background-color: #fff;',
        'padding: 3px 5px;',
        'box-shadow: rgba(0, 0, 0, 0.4) 0 0 20px;',
    '}',
    '#group_name { width: 400px; }',
    '#group_content {',
        'width: 400px;',
        'min-height: 300px;',
    '}',


    '#post_content {',
        'border: 0;',
        'height: 200px;',
        'width: 100%;',
        'padding: 5px;',
        'box-sizing: border-box;',
        '-moz-box-sizing: border-box;',
        '-webkit-box-sizing: border-box;',

        'overflow: auto;',
        'resize: vertical;',
        'word-wrap: break-word;',
    '}',
    '#post_content:focus { outline: 0px solid #9AC0E6; }',

    '#e_statusbar {',
        'background-color: #f2f2f2;',
        'border-top: 1px solid #9AC0E6;',

        'color: grey;',
        'padding: 2px;',
        'text-align: right;',
    '}',
    '#e_autosavecount {',
        'display: inline-block;',
        'padding-right: 20px;',
    '}',
    '#e_save, #e_recover {',
        'text-decoration: none;',
        'color: grey;',
    '}',
    '#e_tip {',
        'width: 200px;',
        'float: left;',
        'text-align: left;',
    '}',


    '/* 一个对话框中的（末行）按钮区 */',
    '.btn_bar {',
        'margin: 10px 0 0 0;',
        'width: 100%;',
    '}',
    '/* 标准按钮样式 */',
    '.soda_button {',
        'height: 20px;',
        'width: 75px;',
        'border: 0;',
        'border-radius: 2px;',

        'cursor: pointer;',
        'color: #fff;',
        'background-color: #6595D6;',
        'padding: 0 0 2px; /* 用baseliner测试了一下，这样内部文字是居中的，不过我也不清楚为什么是这个数 */',
    '}',
    '#submitting_status {',
        'display: inline-block;',
        'padding-left: 20px;',
        'text-align: left;',
        'color: red;',

        'padding-bottom: 1px;  // 因为button中的文字也有1px的padding，因此，为了对齐，加了这一句',
        'vertical-align: middle;',
    '}',


    '#attach_table {',
        'display: none;',
        'position:relative;',
        'height:50px;',
        'width: 100%;',
        'margin-top: 10px;',

        'padding: 2px;',
        'border-collapse: collapse;',
        'overflow: visible;',
        'text-align: left;',
    '}',
    '#attach_table th, #attach_table td { border: 1px solid #fff;}',
    '#attach_table th {',
        'color: #fff;',
        'background-color: #6595D6;',
        'background-image: none;',
    '}',
    '#attach_list > *:nth-child(even) { background-color:#ddd; }',
    '#attach_list > *:nth-child(odd) { background-color:#eee; }',

    '.filename { color: #090; }',
    '.uploadfail { color:#900; }',
    '.uploadsuccess { color:#090; }',

    '#upload_panel {',
        'position: absolute;',

        'border: 0px solid #ccc;',
        'border-radius: 5px;',
        'box-shadow: rgba(0, 0, 0, 0.4) 0 0 18px;',
        'margin: 0 auto;',
        'padding: 8px;',

        'color: #000;',
        'background-color: #fff;',
        'z-index: 200;',
    '}',
    '/* 上传面板的留白要比回复面板的留白稍小，故margin要覆盖定义 */',
    '#upload_title { margin: 0 0 15px 0; }',
    '/* 这个只是用来保证各浏览器的上传按钮宽度一样 */',
    '#files { width: 250px; }',
    '/* 垂直居中显示checkbox */',
    '#image_autoshow {',
        'margin: 0 2px 2px 0;',
        'padding: 0;',
        'vertical-align: middle;',
    '}',
    '#upload_msg {',
        'color: red;',
        'padding-left: 3px;',
    '}',
    '.fastquote_btn, .multiquote_btn {',
        'display: inline-block;',
        'vertical-align: middle;',
        'margin: 0 5px;',
    '}',


    '#reply_options {',
        'border: 0;',
        'width: 400px;',
    '}',
    '#reply_options input[type="text"]{',
        'width: 50%;',
        'height: 25px;',
    '}',
    '#reply_options textarea {',
        'width: 80%;',
        'height: 50px;',
        'resize: vertical;',
    '}',
    '#reply_options input[type="checkbox"] {',
        'margin: 0 2px 2px 0;',
        'vertical-align: middle;',
    '}',
    '#tooltip_button_group {',
        'position: fixed;',
        'bottom: 30%;',
        'right: 0;',
        'padding: 0',
    '}',
    '#fast_reply, #scroll_to_top {',
        'display: block;',
        'background-image: url("' + file_host_url + '/uploadfile/2014/5/29/14283021823.png");',
        'background-color: #f4f4f4;',
        'width: 30px;',
        'height: 24px;',
        'border: 1px #cdcdcd solid;',
        'border-radius: 3px;',
        'padding: 3px 5px;',
        'margin: 0;',
        'cursor: pointer;',
    '}',
    '#fast_reply {',
        'background-position: 0 90px;',
    '}',
    '#scroll_to_top {',
        'background-position: 0 0;',
    '}',
    '#fast_reply:hover {',
        'background-position: 40px 90px;',
    '}',
    '#scroll_to_top:hover {',
        'background-position: 40px 0;',
    '}',
    '#at-status {',
        'position: absolute;',
        'background-color: #fff;',
        'box-shadow: grey 0px 0px 2px 2px;',
        'opacity: 0.8;',
        'top: 88px;',
        'right: 17px;',
        'margin: 0;',
        'padding: 5px 15px;',
        'list-style: none;',
    '}',
    '.at-succeed { color: green; }',
    '.at-fail { color: brown; }',
    '.at-complete { color: blue; }',
    '#reply_options fieldset {',
        'border: medium none;',
        'margin: 0;',
        'padding: 0;',
    '}',
    '#reply_options legend {',
        'font-weight: bold;',
        'padding: 0 0 10px;',
    '}',
    '.desc {',
        'display: block;',
        'padding: 5px 0 0;',
        'font-weight: bold;',
    '}'
    ].join('\n'));

});
})(jq);
