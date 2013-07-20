// ==UserScript==
// @id             cc98_jssdk_test
// @name           cc98 jssdk test
// @version        1.0
// @namespace      soda@cc98.org
// @author         soda <sodazju@gmail.com>
// @description    
// @include        http://www.cc98.org/dispbbs.asp*
// @run-at         document-end
// ==/UserScript==

// 正在试图写一个JavaScripr SDK for cc98
// 这个脚本用来测试一些单独的函数
// 实际SDK大致是面向对象的
// 非官方，纯蛋疼

// 想了想还是懒得实现了。暂时只考虑dispbbs有关的部分
// 不面向对象了
// 页面解析部分没有考虑简版（其实要是只考虑简版的话会简单很多啊）
// 注释随便写的没有固定风格，不过大致是遵循JSDoc的
// 很多错误处理懒得写了，反正在我自己用这些函数的时候不会犯那么傻的错误的

// todo:
// 上传文件

// 全局变量
var soda, helper;

(function() {

var FAMI_URL = "http://www.cc98.org/master_users.asp?action=award";
var PM_URL = "http://www.cc98.org/messanger.asp?action=send";
var POST_URL = "http://www.cc98.org/SaveReAnnounce.asp?method=Topic";
var EDIT_URL = "http://www.cc98.org/SaveditAnnounce.asp?";

var NAME_RE = /<span style="color:\s*\#\w{6}\s*;"><b>([^<]+)<\/b><\/span>/g;

// 注意网页上<a name="1">之类的标签是作为#0的anchor出现的
var ANNOUNCEID_RE = /<a name="(\d{2,})">/g;

// 还未考虑被删除的帖子
var ARTICLE_RE = /(?:\s<span id="ubbcode[^>]*>(.*)<\/span>)|>本楼只允许特定用户查看|>该帖子设置了楼主可见|>该账号已经被禁止/ig;
var REPLYVIEW_RE = /<hr noshade size=1>.*<hr noshade size=1>/ig;

// 考虑到下面的函数的callback都只接受boolean作为参数
// 而ajax请求的callback参数是responseText，故写了这样一个function generator
function cc98CallbackGen(callback) {
    return function (responseText) {
        if (!responseText.match("论坛错误信息")) {
            callback(true);
        } else {
            callback(false);
        }
    }
}

// 98相关的函数接口
// faMi, reply, sendPM, parseTopicPage, getArticleContent, formatURL
soda = {

    // 发米/扣米
    // @param {string}      opts.url 贴子地址
    // @param {Number}      opts.announceid 回帖ID
    // @param {Number}      opts.amount 发米/扣米数量[0-1000]
    // @param {string}      opts.reason 发米理由
    // @param {boolean}     opts.ismsg  站短/不站短
    // @param {boolean}     [opts.koumi=false] 是否扣米
    // @param {boolean}     [opts.async=true] 是否异步
    // @param {function(success)} [opts.callback=function(){}] 回调函数，参数为bool类型，表示成功与否
    faMi: function(opts) {
        opts.callback -= opts.callback || (function() {});

        var params = helper.parseQS(opts["url"]);
        var boardid = params["boardid"];
        var topicid = params["id"];

        helper.ajax({
            "type": "POST",
            "url": FAMI_URL,
            "data": {
                "awardtype": opts["koumi"] ? 1 : 0,
                "boardid": boardid,
                "topicid": topicid,
                "announceid": opts["announceid"],
                "doWealth": opts["amount"],
                "content": opts["reason"],
                "ismsg": opts["ismsg"] ? "on" : ""
            },
            "success": cc98CallbackGen(opts["callback"]),
            "async": opts["async"]
        });
    },

    // 回贴
    // @param {string}  opts.url 贴子地址
    // @param {string}  opts.expression 发贴心情
    // @param {string}  opts.content 回贴内容
    // @param {string}  opts.password md5加密后的密码（可以从cookie中获取）
    // @param {string}  [opts.username] 用户名
    // @param {string}  [opts.subject] 发贴主题
    // @param {Number}  [opts.replyid] 引用的贴子的announceid
    // @param {boolean} [opts.edit] 是否是在编辑已发布的贴子（是的话必须提供replyid）
    // @param {boolean} [opts.sendsms] 站短提示
    // @param {boolean} [opts.viewerfilter] 使用指定用户可见
    // @param {string}  [opts.allowedviewers] 可见用户
    // @param {boolean} [opts.async] 是否异步（默认为真）
    // @param {function(success)} [opts.callback=function(){}] 回调函数
    reply: function(opts) {
        var params = helper.parseQS(opts["url"]);
        var postURL = POST_URL + "&boardID=" + params["boardid"];
        if (opts["edit"]) {
            postURL = EDIT_URL + "boardID=" + params["boardid"] + "&replyID=" + opts["replyid"] + "&id=" + params["id"];
        }

        var data = {
                "subject": opts["subject"] || "",
                "expression": opts["expression"],
                "content": opts["content"],
                "followup": opts["edit"] ? params["id"] : (opts["replyid"] || params["id"]),
                "replyid": opts["replyid"] || params["id"],
                "sendsms": opts["sendsms"] ? "1" : "0",
                "rootid": params["id"],
                "star": params["star"] || "1",
                "username": opts["username"],
                "passwd": opts["password"],
                "signflag": "yes",
                "enableviewerfilter": opts["viewerfilter"] ? "1" : "",
            };
        if (opts["viewerfilter"]) {
            data["allowedviewers"] = opts["allowedviewers"] || "";
        }

        helper.ajax({
            "type": "POST",
            "url": postURL,
            "data": data,
            "success": cc98CallbackGen(opts["callback"]),
            "async": opts["async"],
            
        });
    },

    // 站短
    // @param {string}  opts.recipient 收件人
    // @param {string}  opts.subject 站短标题
    // @param {string}  opts.message 站短内容
    // @param {boolean} [opts.async] 是否异步
    // @param {function(success)} [opts.callback=function(){}] 回调函数
    sendPM: function(opts) {
        helper.ajax({
            "type": "POST",
            "url": PM_URL,
            "data": {
                "touser": opts["recipient"],
                "title": opts["subject"],
                "message": opts["message"]
            },
            "success": cc98CallbackGen(opts["callback"]),
            "async": opts["async"]
        });
    },

    // 获取页面中的用户列表和回贴ID
    // 返回格式
    // [
    //     {
    //         "username": "苏打绿茶",
    //         "announceid": "703654358"
    //     },
    // ],
    // todo: 返回发贴时间
    parseTopicPage: function(htmlText) {
        var articleList = [];
        
        var nameArr = htmlText.match(NAME_RE);
        nameArr.forEach(function(name, index, arr) {
            var article = {};
            article["username"] = name.replace(NAME_RE, "$1");
            articleList.push(article);
        });

        var idArr = htmlText.match(ANNOUNCEID_RE);
        // 考虑到心灵没有announceid，所以idArr可能为空
        if (idArr) {
            idArr.forEach(function(id, index, arr) {
                articleList[index]["announceid"] = id.replace(ANNOUNCEID_RE, "$1");
            });
        }

        return articleList;
    },

    // 回贴内容如果要从html转成ubb的话太麻烦
    // 但是没有执行js的rawhtml里有包含ubb代码
    // 所以为了方便起见，把获取贴子内容的功能独立出来
    // 使用一个sync的ajax请求获取rawhtml再解析
    getArticleContent: function(url, storey) {
        var result;
        helper.ajax({
            "type": "GET",
            "url": url,
            "success": function(rawhtml) {
                for (var i = 0; i != storey-1; ++i)
                    ARTICLE_RE.exec(rawhtml)
                result = ARTICLE_RE.exec(rawhtml)[1] || "";
                result = result
                    .replace(REPLYVIEW_RE, "")
                    .replace(/<br>/ig, "\n");
            },
            "async": false
        });
        return helper.unescapeHTML(result);
    },

    // 格式化网址，去除无用的参数并转为相对链接
    formatURL: function(url) {
        var urlObj = helper.parseURL(url);

        // 不在www.cc98.org域名下
        if (urlObj["host"] != "www.cc98.org") {
            return url;
        }

        // http://www.cc98.org/
        if (!urlObj["path"]) {
            return "/";
        }

        var params = helper.parseQS(urlObj["query"]);
        var hash = urlObj["hash"] ? ("#" + urlObj["hash"]) : ""

        // 不是dispbbs.asp开头的链接，只去掉空的get参数，转为相对链接，不做其他处理
        if (urlObj["path"] === "dispbbs,asp") {
            return "/" + urlObj["path"] + "?" + helper.toQS(params) + hash;
        }

        // 如果不是在追踪页面，就去掉replyid
        if (!params["trace"]) {
            params["replyid"] = "";
        }
        params["page"] = "";    // 去掉page
        params["star"] = (params["star"] === "1") ? "" : params["star"];    // star=1时去掉
        return "/" + urlObj["path"] + "?" + helper.toQS(params) + hash;
    }
};



// 一些helper函数，跟98无关但方便编程
// parseQS, toQS, parseURL, parseCookies, unescapeHTML, ajax
helper = {

    // parse the url get parameters
    parseQS: function(url) {
        url = url.toLowerCase().split("#")[0];  // remove the hash part
        var t = url.indexOf("?");
        var hash = {};
        if (t > 0) {
            var params = url.substring(t+1).split("&");
        } else {    // plain query string without "?" (e.g. in cookies)
            var params = url.split("&");
        }
        for (var i = 0; i < params.length; ++i) {
            var val = params[i].split("=");
            hash[decodeURIComponent(val[0])] = decodeURIComponent(val[1]);
        }
        return hash;
    },

    toQS: function(obj) {
        var ret = [];
        for (var key in obj) {
            if ("" === key) continue;
            if ("" === obj[key]) continue;
            ret.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
        }
        return ret.join("&");
    },

    parseURL: function(url) {
        // from JavaScript: The Good Parts
        var parse_url = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/
        var arr = parse_url.exec(url);
        var result = {};
        result["url"] = arr[0];
        result["scheme"] = arr[1];
        result["slash"] = arr[2];
        result["host"] = arr[3];
        result["port"] = arr[4];
        result["path"] = arr[5];
        result["query"] = arr[6];
        result["hash"] = arr[7];
        return result;
    },

    parseCookies: function(theCookie) {
        var cookies = {};           // The object we will return
        var all = theCookie;        // Get all cookies in one big string
        if (all === "")             // If the property is the empty string
            return cookies;         // return an empty object
        var list = all.split("; "); // Split into individual name=value pairs
        for(var i = 0; i < list.length; i++) {  // For each cookie
            var cookie = list[i];
            var p = cookie.indexOf("=");        // Find the first = sign
            var name = cookie.substring(0,p);   // Get cookie name
            var value = cookie.substring(p+1);  // Get cookie value
            value = decodeURIComponent(value);  // Decode the value
            cookies[name] = value;              // Store name and value in object
        }
        return cookies;
    },

    // 将部分常见的转义后的html转回来
    unescapeHTML: function(htmlText) {
        return htmlText
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, "\"")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&nbsp;/g, " ");
    },

    ajax: function(opts) {
        opts = {
            type: opts.type || "GET",
            url: opts.url || "",
            data: opts.data || null,
            contentType: opts.contentType || "application/x-www-form-urlencoded; charset=UTF-8",
            success: opts.success || function() {},
            async: opts.async || (opts.async === undefined)
        };
        var xhr = new XMLHttpRequest;
        xhr.open(opts.type, opts.url, opts.async);
        xhr.setRequestHeader("Content-type", opts.contentType);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                opts.success(xhr.responseText);
            }
        };
        xhr.send(helper.toQS(opts.data));
    }
};


console.log(soda.getArticleContent(location.href, 3))

})();
