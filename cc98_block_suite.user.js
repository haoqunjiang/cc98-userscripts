// ==UserScript==
// @id             cc98_block_suite
// @name           cc98 block suite
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
// @run-at         document-end
// ==/UserScript==

(function() {
var options = {
    // 网站显示选项
    blockedIds: ['竹林来客'],        // 被屏蔽的ID列表，用双引号（""）或单引号（''）括住，半角逗号（,）分隔
    blockQmd: false,                // 是否屏蔽签名档
    blockAvatars: false,            // 是否屏蔽头像
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

// todo: 跳过[code][/code]标签中的内容
var processUrl = function (content) {
    return content.replace(/(http.*)www\.cc98\.org\/([&=#%\w\+\.\?]+)/g, '[url] /$2 [/url]');
}

/* 各种辅助函数完 */


// 一些全局变量
var postList = [];
var submit_btn = xpath("//input[@name='Submit']");

// 解析当前页面，获取以及更改一些DOM元素
// 主要用于屏蔽选项
function parseDOM() {
    if (window.location.pathname === "/dispbbs.asp") {
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
