// ==UserScript==
// @id             cc98_enhancement_suite
// @name           cc98 enhancement suite
// @version        0.1.0
// @namespace      soda@cc98.org
// @author         soda <sodazju@gmail.com>
// @description    enhanced cc98 browsing and replying experience
// @include        http://www.cc98.org/*
// @include        http://www.cc98.org/dispbbs.asp*
// @include        http://www.cc98.org/announce.asp*
// @include        http://www.cc98.org/vote.asp*
// @include        http://www.cc98.org/reannounce.asp*
// @include        http://www.cc98.org/editannounce.asp*
// @include        http://www.cc98.org/list.asp*
// @run-at         document-end
// ==/UserScript==

// thanks to ltt_Real, 如嫣

// todo:
// 选项界面
// 增加「下一页」按钮
// 快速回复界面（模仿如嫣的脚本，但应当更易于扩展，并优化界面）
// AJAX回复、自动读秒、多重引用
// @功能
// 自定义表情
// 马甲切换器（优化一下界面，提供顶贴功能）

(function() {
var options = {
    // 回复选项
    autoSave: true,                 // 自动保存输入框里的内容
    autoReply: true,                // 10秒错误后自动读秒回复
    enableMultiquote: false,        // 默认不多重引用
    useRelativeUrl: true,           // 使用相对链接
    useUrlTitle: false,             // 把站内链接替换成链接指向的帖子名，优先级高于「使用相对链接」。（注意对logout页面进行判断）
    viewOriginalPost: true,         // 在引用中加入"查看原帖"
    blockQuotedEmotions: false,     // 是否屏蔽引用里的表情和图片

    // 网站显示选项
    blockedIds: ['竹林来客'],        // 被屏蔽的ID列表，用双引号（""）括住，半角逗号（,）分隔
    blockQmd: false,                // 是否屏蔽签名档
    blockAvatars: false,            // 是否屏蔽头像
    useImageViewer: false,          // 待实现：图片浏览器

    // 次级选项，懒得再分离出来了
    autoSaveInterval: 0.5,          // 自动保存间隔(分钟)
    expireTime: 30,                 // 帖子内容过期时间(分钟)
    maxTextareaLength: 16240,       // 文本框的最大输入长度(字节数)
    maxSubjectLength: 100,          // 主题框的最大输入长度(字节数)
    viaString: "|查看原帖|",         // 查看原帖的提示文字
    viaColor: "seagreen",           //「查看原帖」的颜色
};

/* 各种辅助函数 */
var isInt = function(n) {
   return n % 1 === 0;
}

var $ = function(id) { return document.getElementById(id); }

var xpath = function(expr, contextNode) {
    contextNode = contextNode || document;
    return document.evaluate(
        expr, contextNode, null,
        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
};

var addStyles = function(css) {
    var head = document.getElementsByTagName("head")[0];
    var style = document.createElement("style");

    style.setAttribute("type", "text/css");
    style.innerHTML = css;
    head.appendChild(style);
};

var ajax = function(opts) {
    opts = {
        method: opts.method || "GET",
        url: opts.url || '',
        content: opts.content || null,
        contentType: opts.contentType || "application/x-www-form-urlencoded; charset=UTF-8",
        onload: opts.onload || function(){},
        async: opts.async || (opts.async === undefined)
    };
    var xhr = new XMLHttpRequest;
    xhr.open(opts.method, opts.url, opts.async);
    xhr.setRequestHeader("Content-type", opts.contentType);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            opts.onload(xhr.responseText);
        }
    };
    xhr.send(opts.content);
};

var getQueryString = function(url) {
    url = url.toLowerCase().split("#")[0];
    var t = url.indexOf("?");
    var hash = {};
    if (t > 0) {
        params = url.substring(t+1).split("&");
        for (var i = 0; i < params.length; ++i) {
            var val = params[i].split("=");
            hash[decodeURIComponent(val[0])] = decodeURIComponent(val[1]);
        }
    }
    return hash;
};

var toQueryString = function(obj) {
    var ret = [];
    for (var key in obj) {
        if ("" === key) continue;
        ret.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
    }
    return ret.join("&");
};

var path = function(url) {
    var url = url.toLowerCase();

    if (url === "http://www.cc98.org") {
        url = "http://www.cc98.org/"
    }

    return "/" + url.split("/")[3].split("?")[0];  // paths such as "list.asp"
};

// 在Scriptish中似乎不能对Element.prototype进行修改，所以暂时只能这样了
var prev = function(node) {
    var ret = node.previousSibling;
    if (!ret) {
        return null;
    } else if (ret.nodeType === 1) {
        return ret;
    } else {
        return prev(ret); 
    }
};

var next = function(node) {
    var ret = node.nextSibling;
    if (!ret) {
        return null;
    } else if (ret.nodeType === 1) {
        return ret;
    } else {
        return next(ret);
    }
};

var first = function(node) {
    ret = node.firstChild;
    if (!ret) {
        return null;
    } else if (ret.nodeType === 1) {
        return ret;
    } else {
        return next(ret);
    }
};

var addClass = function(element, value) {
    if (!element.className) {
        element.className = value;
    } else {
        newClassName = element.className;
        newClassName += " ";
        newClassName += value;
        element.className = newClassName;
    }
};

var removeClass = function(element, value) {
    element.className = element.className.replace(
                new RegExp("(^|\\s+)" + value + "(\\s+|$)", "g"),
                "$2"
            );
};

var processUrl = function (content) {
    return content.replace(/(http.*)www\.cc98\.org\/([&=#%\w\+\.\?]+)/g, '[url] /$2 [/url]');
}

/* 各种辅助函数完 */


/* 马甲切换器 */

// 在账号选项下增加「添加账号」、「马甲顶贴」选项，给每个账号边上加上X
function accountSwitchUI() {
    accountSettings = xpath("//td[@class='TopLighNav1']/div/div/a");
}

/* 马甲切换器完 */


// 一些全局变量
var postList = [];
var nextPage;
var submit_btn = xpath("//input[@name='Submit']");

// 解析当前页面，获取以及更改一些DOM元素
// 主要用于屏蔽选项
function parseDOM() {
    if (path(window.location.href) === "/dispbbs.asp") {
        // 一般是第7-16个table，不过启用指定用户可见后是第8-17个table
        for (var first = 7, last = 16; first <= last; first++) {
            var post = xpath("/html/body/table[" + first + "]");
            if (!post.className) {
                // 紧跟着回帖的是用作页面导航的table，它没有class
                break;
            } else if (post != null ) {
                postList.push(post);
            } else if (first === 7) {
                last++;
            } 
        }

        // 下一页
        var curPageNode = xpath("/html/body/table[" + first + "]/tbody/tr/td[1]/span");
        if (next(curPageNode)) {
            nextPage = next(curPageNode).href;
        } else {
            nextPage = null;
        }

        // add classes and ids tto the nodes
        // 暂未考虑到心灵之约
        postList.forEach(function (post, index, array) {
            addClass(post, "post-block");

            // 发帖用户
            var tmp = xpath("tbody/tr[1]/td[1]/table/tbody/tr/td[1]/a/span/b", post);
            if (!tmp) return;
            post.announceid = tmp.parentNode.parentNode.name;
            post.postBy = tmp.innerHTML;

            // 屏蔽用户
            if (options.blockedIds.indexOf(post.postBy) >= 0) {
                addClass(post, "blocked");
            }

            // 用户头像
            tmp = xpath("tbody/tr[1]/td[1]/a/img", post);
            if (tmp) {
                addClass(tmp, "avatar");
                if ( options.blockAvatars ) {
                    addClass(tmp, "blocked");
                }
            }

            // 发帖时间
            post.postTime = xpath("tbody/tr[2]/td[1]/text()", post);

            // 引用按钮
            post.quoteBtn = xpath("tbody/tr[1]/td[2]/table/tbody/tr[1]/td/a[5]", post);

            // 答复按钮
            post.replyBtn = xpath("tbody/tr[1]/td[2]/table/tbody/tr[1]/td/a[6]", post);

            // 发帖心情
            tmp = xpath("tbody/tr[1]/td[2]/blockquote/table/tbody/tr/td/img", post);
            addClass(tmp, "expression");
            post.expression = tmp.src.match("face/(.*)")[1];

            // 签名档
            post.qmd = xpath("tbody/tr[1]/td[2]/blockquote/div", post);
            if (post.qmd != null) {
                addClass(post.qmd, "qmd");
                if ( options.blockQmd ) {
                    addClass(post.qmd, "blocked");
                }
            }
        });
    }
}


// 实际程序
(function () {
    parseDOM();
    addStyles(".blocked { display: none !important; }");

    // 相对链接。此处是临时解决方案
    if (submit_btn) {
        submit_btn.addEventListener('click', function(e) {
            var text_area = $("content");
            text_area.value = processUrl(text_area.value);
            }, false);
    }
})();

})();

/*
指定用户可见的POST格式:
    upfilerename:
    followup:689916213
    rootID:4063110
    star:791
    TotalUseTable:bbs12
    username:苏打绿茶
    passwd:004c2cc633af408d
    ReplyId:689916213
    subject:
    Expression:face7.gif
    EnableViewerFilter:1
    AllowedViewers:矫若惊鸿, 蘇打紅茶
    Content:帖子内容
回帖提醒的格式：
    SendSms: 1
*/
