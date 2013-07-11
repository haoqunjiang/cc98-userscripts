// ==UserScript==
// @id             cc98_distribute_money
// @name           cc98 distribute money
// @version        0.2
// @namespace      soda@cc98.org
// @author         soda <sodazju@gmail.com>
// @description    inspired by Li Zhao's distribute_money.user.js
// @include        http://www.cc98.org/dispbbs.asp*
// @run-at         document-end
// ==/UserScript==

(function() {

// 一些全局变量
var postList = [];
var nextPage;

// 各种辅助函数
var isInt = function(n) {
   return n % 1 === 0;
}

var $ = function(id) { return document.getElementById(id); }

var xpath = function(expr, contextNode) {
    contextNode = contextNode || document;
    return document.evaluate(
        expr, contextNode, null,
        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
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

// 发米机界面
function showDialog() {
    var managementOptions = first(first(first(prev($("previewfrm")))));

    var distributeBtn = document.createElement("a");
    distributeBtn.id = "distributeBtn";
    distributeBtn.setAttribute("href", "javascript:;");
    distributeBtn.setAttribute("title", "使用发米机");
    distributeBtn.innerHTML = "发米";
    managementOptions.appendChild(distributeBtn);

    var mask = document.createElement("div");
    mask.id = "mask-hidden";
    document.body.appendChild(mask);

    var distOptions = document.createElement("form");
    distOptions.id ="dist-options-hidden";
    distOptions.innerHTML =
        '\n\
          <fieldset>\n\
            <legend>发米设置<span class="tips">（点击周围空白处关闭窗口）</span></legend>\n\
\n\
            <ul class="options">\n\
            <li>\n\
              <label for="reason">发米理由:</label>\n\
              <input type="text" class="required" id="reason" name="reason" value="" />\n\
              <input type="checkbox" id="ismsg" checked="true"/>\n\
              <label for="inifinite-pages">站短通知</label> <br>\n\
            </li>\n\
\n\
            <li>\n\
            <label for="amount">发米数量:</label>\n\
            <input type="text" class="required number" id="amount" name="amount" value="1000" />\n\
            <input type="checkbox" id="random-amount" name="amount" />\n\
            <label for="random">随机</label>\n\
            </li>\n\
\n\
            <li>\n\
            <label for="count">发米次数:</label>\n\
            <input type="text" class="required number" id="count" name="count" value="1">\n\
            <input type="checkbox" id="unlimited-count" name="count" />\n\
            <label for="unlimited-count">不限</label> <br>\n\
            </li>\n\
\n\
            <li>\n\
            <label for="page-count">发米页数:</label>\n\
            <input type="text" class="required number" id="page-count" name="page-count" value="1">\n\
            <input type="checkbox" id="inifinite-pages" name="page-count" />\n\
            <label for="inifinite-pages">不限</label> <br>\n\
            </li>\n\
\n\
            <li>\n\
            从当前页的第<input type="text" class="required number" id="start-level" name="start-level" value="1" />楼开始发米 <br>\n\
            </li>\n\
            </ul>\n\
\n\
            <input type="submit" id="start-btn" value="开始发米" />\n\
          </fieldset>';
    document.body.appendChild(distOptions);

    addStyles(
        '#mask {\n\
          left: 0px;\n\
          top: 0px;\n\
          height: 100%;\n\
          width: 100%;\n\
          position:fixed;\n\
          z-index: 100;\n\
          opacity:0.75;\n\
          background-color: #222;\n\
          background-repeat: repeat;\n\
        }\n\
\n\
        #dist-options {\n\
          position: fixed;\n\
          top: 150px;\n\
          left: 35%;\n\
          width: 400px;\n\
          z-index: 200;\n\
        }\n\
\n\
        fieldset {\n\
          border: 0;\n\
          border-radius: 5px;\n\
          background: #fff;\n\
          color: #222;\n\
          font-size: 14px;\n\
          text-align: left;\n\
        }\n\
\n\
        legend {\n\
          border-radius: 4px;\n\
          padding: 4px;\n\
          font-size: 16px;\n\
          color: #fff;\n\
          background: #2975C4;\n\
        }\n\
\n\
        .tips {\n\
          font-size: 12px;\n\
        }\n\
\n\
        ul.options > li {\n\
          list-style-type: none;\n\
          line-height: 24px;\n\
        }\n\
\n\
        input[type="text"].required {\n\
            border: 1px solid #a0a0a0;\n\
            padding: 4px 3px;\n\
        }\n\
        input[type="text"].noneed {\n\
            background-color: #D4D4D4;\n\
            border: 1px solid #D4D4D4;\n\
            color: #aaa;\n\
            padding: 4px 3px;\n\
        }\n\
        #reason, #amount, #count, #page-count {\n\
          width: 160px;\n\
        }\n\
        #start-level {\n\
          width: 2em;\n\
        }\n\
\n\
        #mask-hidden {\n\
          display: none;\n\
        }\n\
        #dist-options-hidden {\n\
          display: none;\n\
        }');

    distributeBtn.addEventListener("click", function(e) {
        mask.id ="mask";
        distOptions.id ="dist-options";
    });

    mask.addEventListener("click", function(e) {
        mask.id ="mask-hidden";
        distOptions.id = "dist-options-hidden";
    });

    $("random-amount").addEventListener("click", function(e) {
        if ($("random-amount").checked) {
            removeClass($("amount"), "required");
            addClass($("amount"), "noneed");
        } else {
            removeClass($("amount"), "noneed");
            addClass($("amount"), "required");
        }
    });

    $("unlimited-count").addEventListener("click", function(e) {
        if ($("unlimited-count").checked) {
            removeClass($("count"), "required");
            addClass($("count"), "noneed");
        } else {
            removeClass($("count"), "noneed");
            addClass($("count"), "required");
        }
    });

    $("inifinite-pages").addEventListener("click", function(e) {
        if ($("inifinite-pages").checked) {
            removeClass($("page-count"), "required");
            addClass($("page-count"), "noneed");
        } else {
            removeClass($("page-count"), "noneed");
            addClass($("page-count"), "required");
        }
    });

    $("start-btn").addEventListener("click", startDistribute);

}

function startDistribute(e) {
    e.preventDefault();

    // validate the input fields first
    // ommited here

    // format the url and then redirect
    var qs = getQueryString(window.location.href);
    window.location.href = "http://www.cc98.org/dispbbs.asp?" + toQueryString({
        "boardid": qs["boardid"],
        "id": qs["id"],
        "star": qs["star"] || "1",
        "distributing": "true",
        "amount": $("random-amount").checked ? "random" : $("amount").value,
        "count" : $("unlimited-count").checked ? "unlimited" : $("count").value,
        "rest-pages": $("inifinite-pages").checked ? "32767" : $("page-count").value,
        "start-level": $("start-level").value,
        "reason": $("reason").value,
        "ismsg": $("ismsg").checked ? "on" : ""
    });

}

// 根据当前页面url中的distributing是否为true来判断是否需要发米
function distribute() {
    var qs = getQueryString(window.location.href);
    if (qs["distributing"] !== "true") {
        return;
    }

    var restPages = qs["rest-pages"];
    restPages -= 1;

    document.title = "正在发米，请稍后……"

    postList.forEach(function (post, index, array) {
        // 发帖用户
        var tmp = xpath("tbody/tr[1]/td[1]/table/tbody/tr/td[1]/a/span/b", post).snapshotItem(0);
        if (!tmp) return;
        post.announceid = tmp.parentNode.parentNode.name;
        post.postBy = tmp.innerHTML;

        if (qs["start-level"] && index + 1 < parseInt(qs["start-level"])) return;
        curCount = GM_getValue(post.postBy) || 0;
        if ( qs["count"] === "unlimited" || curCount < parseInt(qs["count"])) {
            ajax({
                method: "POST",
                content: toQueryString({
                    "content": qs["reason"],
                    "awardtype":"0",
                    "doWealth": qs["amount"] === "random" ? parseInt(Math.random() * 1000) + 1 : qs["amount"],
                    "topicid": qs["id"],
                    "announceid": post.announceid,
                    "boardid": qs["boardid"],
                    "msg": "",
                    "ismsg": qs["ismsg"]
                }),
                url: "http://www.cc98.org/master_users.asp?action=award",
                onload: function(text) {
                    if (text.match("论坛错误信息") == null) {
                        GM_setValue(post.postBy, curCount + 1);
                    }
                },
                async: false
            });
        }
    });

    if (nextPage && restPages) {
        window.location.href = nextPage + "&" + toQueryString({
            "distributing": true,
            "amount": qs["amount"],
            "count" : qs["count"],
            "rest-pages": restPages,
            "reason": qs["reason"]
        });
    } else {
        // 清除发米信息
        var keys = GM_listValues();
        for (var i=0, key=null; key=keys[i]; i++) {
            GM_deleteValue(key);
        }
        document.title = "发米结束，正在跳转……";
        window.location.href = "http://www.cc98.org/dispbbs.asp?" + toQueryString({
            "boardid": qs["boardid"],
            "id": qs["id"],
            "star": qs["star"] || "1"
        });
    }
}

// 解析当前页面，获取以及更改一些DOM元素
function parseDOM() {
    // 一般是第7-16个table，不过启用指定用户可见后是第8-17个table
    for (var first = 7, last = 16; first <= last; first++) {
        var post = xpath("/html/body/table[" + first + "]").snapshotItem(0);
        if (!post.className) {
            // 紧跟着回帖的是用作页面导航的table，它没有class
            break;
        } else if (post != null ) {
            postList.push(post);
        } else if (first === 7) {
            last++;
        } 
    }
    var curPageNode = xpath("/html/body/table[" + first + "]/tbody/tr/td[1]/span").snapshotItem(0);
    if (next(curPageNode)) {
        nextPage = next(curPageNode).href;
    } else {
        nextPage = null;
    }
}

// 页面载入时真正执行的函数
(function (){
    parseDOM();
    showDialog();
    distribute();
})();

})();
