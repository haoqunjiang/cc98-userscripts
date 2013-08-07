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

// 正在试图写一个JavaScripr SDK for cc98，这个脚本用来测试一些单独的函数
// 非官方，纯蛋疼。暂时懒得完整实现，只考虑dispbbs有关的部分，不面向对象
// 页面解析部分没有考虑简版（其实要是只考虑简版的话会简单很多啊><）
// 注释随便写的没有固定风格，大致遵循JSDoc。很多错误处理没写

// todo:
// 上传文件
// 修复reply中Content加号被吞的问题

// 全局变量
var _cc98, _lib, _dom;

(function() {

var FAMI_URL = "http://www.cc98.org/master_users.asp?action=award";
var PM_URL = "http://www.cc98.org/messanger.asp?action=send";
var REPLY_URL = "http://www.cc98.org/SaveReAnnounce.asp?method=Topic";
var EDIT_URL = "http://www.cc98.org/SaveditAnnounce.asp?";

var POST_COUNT_RE = /本主题贴数\s*<b>(\d+)<\/b>/ig;

var NAME_RE = /<span style="color:\s*\#\w{6}\s*;"><b>([^<]+)<\/b><\/span>/g;
var ANNOUNCEID_RE = /<a name="(\d{2,})">/g; // 注意网页上<a name="1">之类的标签是作为#0的anchor出现的
var POST_TIME_RE = /<\/a>\s*([^AP]*[AP]M)\s*<\/td>/g;
var POST_RE = /\s<span id="ubbcode[^>]*>(.*)<\/span>|>本楼只允许特定用户查看|>该帖子设置了楼主可见|>该账号已经被禁止|>DisplayDel()/ig;

var REPLYVIEW_RE = /<hr noshade size=1>.*<hr noshade size=1>/ig;

// 默认文件上传到的版面
// 论坛帮助
// 默认允许 gif|docx|xlsx|pptx|pdf|xap|jpg|jpeg|png|bmp|rar|txt|zip|mid|rm|doc|mp3
var DEFAULT_UPLOAD_BOARDID = 184;

// 文件扩展名与允许上传的boardid的对应列表
var file2boardid = {
    "ipa": 598, // iOS
    "ppt": 598,
    "xls": 598,
    "chm": 598,
    "wma": 169, // 摇滚和独立音乐
    "lrc": 169,
    "asf": 169,
    "flv": 169,
    "wmv": 169,
    "rmvb": 169,
    "mpg": 169,
    "avi": 169,
    "swf": 170, // 史海拾贝
    "rep": 200, // 星际专区
    "tar": 212, // Linux天地
    "gz": 212,
    "bz2": 212,
    "tbz": 212,
    "tgz": 212,
    "psd": 239, // 贴图工坊
    "gtp": 308, // 乱弹吉他
    "gp3": 308,
    "gp4": 308,
    "gp5": 308,
    "torrent": 499, // 多媒体技术
    "srt": 499
};

// 98相关的函数接口
// fami, reply, sendPM, parseTopicPage, postCount, pageCount, getPostContent, formatURL
_cc98 = {

    // 发米/扣米
    // @param {string}      opts.url 帖子地址
    // @param {Number}      opts.announceid 回帖ID
    // @param {Number}      opts.amount 发米/扣米数量[0-1000]
    // @param {string}      opts.reason 发米理由
    // @param {boolean}     opts.ismsg  站短/不站短
    // @param {boolean}     [opts.awardtype=true] 是否发米
    // @param {boolean}     [opts.async=true] 是否异步
    // @param {function(text)} [opts.callback=function(){}] 回调函数，参数为bool类型，表示成功与否
    fami: function(opts) {
        opts.callback = opts.callback || (function() {});
        opts.awardtype = opts.awardtype || (opts.awardtype === undefined);

        var params = _lib.parseQS(opts["url"]);
        var boardid = params["boardid"];
        var topicid = params["id"];

        _lib.ajax({
            "type": "POST",
            "url": FAMI_URL,
            "data": {
                "awardtype": opts["awardtype"] ? 0 : 1,
                "boardid": boardid,
                "topicid": topicid,
                "announceid": opts["announceid"],
                "doWealth": opts["amount"],
                "content": opts["reason"],
                "ismsg": opts["ismsg"] ? "on" : ""
            },
            "success": opts["callback"],
            "async": opts["async"]
        });
    },

    // 回帖
    // @param {string}  opts.url 帖子地址
    // @param {string}  opts.expression 发帖心情
    // @param {string}  opts.content 回帖内容
    // @param {string}  opts.password md5加密后的密码（可以从cookie中获取）
    // @param {string}  [opts.username] 用户名
    // @param {string}  [opts.subject] 发帖主题
    // @param {Number}  [opts.replyid] 引用的帖子的announceid
    // @param {boolean} [opts.edit] 是否是在编辑已发布的帖子（是的话必须提供replyid）
    // @param {boolean} [opts.sendsms] 站短提示
    // @param {boolean} [opts.viewerfilter] 使用指定用户可见
    // @param {string}  [opts.allowedviewers] 可见用户
    // @param {boolean} [opts.async] 是否异步（默认为真）
    // @param {function(text)} [opts.callback=function(){}] 回调函数
    reply: function(opts) {
        var params = _lib.parseQS(opts["url"]);
        var postURL = REPLY_URL + "&boardid=" + params["boardid"];
        if (opts["edit"]) {
            postURL = EDIT_URL + "boardid=" + params["boardid"] + "&replyid=" + opts["replyid"] + "&id=" + params["id"];
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

        _lib.ajax({
            "type": "POST",
            "url": postURL,
            "data": data,
            "success": opts["callback"],
            "async": opts["async"],
            
        });
    },

    // 站短
    // @param {string}  opts.recipient 收件人
    // @param {string}  opts.subject 站短标题
    // @param {string}  opts.message 站短内容
    // @param {boolean} [opts.async] 是否异步
    // @param {function(text)} [opts.callback=function(){}] 回调函数
    sendPM: function(opts) {
        _lib.ajax({
            "type": "POST",
            "url": PM_URL,
            "data": {
                "touser": opts["recipient"],
                "title": opts["subject"],
                "message": opts["message"]
            },
            "success": opts["callback"],
            "async": opts["async"]
        });
    },

    upload: function(file, callback) {
        var reader = new FileReader();

        var ext = file.name.substring(lastIndexOf(".") + 1);    // 文件扩展名
        var boardid = file2boardid[ext] || DEFAULT_UPLOAD_BOARDID;
        var url = "http://www.cc98.org/saveannouce_upfile.asp?boardid=" + boardid;

        reader.onload = function(e)
        {
            var boundary = "----------------";
            boundary += parseInt(Math.random()*98989898+1);
            boundary += parseInt(Math.random()*98989898+1);

            var data = [boundary,"\r\n",
                "Content-Disposition: form-data; name=\"act\"\r\n\r\nupload",
                "\r\n",boundary,"\r\n",
                "Content-Disposition: form-data; name=\"fname\"\r\n\r\n",file.name,
                "\r\n",boundary,"\r\n",
                "Content-Disposition: form-data; name=\"file1\"; filename=\"",file.name,"\"\r\n",
                "Content-Type: ",file.type,"\r\n\r\n",
                e.target.result,
                "\r\n",boundary,"\r\n",
                "Content-Disposition: form-data; name=\"Submit\"\r\n\r\n\xc9\xcf\xb4\xab",  // 上传
                "\r\n",boundary,"--\r\n"].join("");

            _lib.ajax({
                "type": "POST",
                "url": url,
                "contentType": "multipart/form-data; boundary="+boundary,
                "data": data,
                "success": calback
            })

        }
        reader.readAsBinaryString(file);
    }

    // 获取页面中的用户列表，回帖时间回帖ID
    // @return {Array}  每个数组元素都有username, annouceid, posttime三个属性
    parseTopicPage: function(htmlText) {
        var postList = [];
        
        var nameArr = htmlText.match(NAME_RE);
        nameArr.forEach(function(name, index, arr) {
            var post = {};
            post["username"] = name.replace(NAME_RE, "$1");
            postList.push(post);
        });

        var idArr = htmlText.match(ANNOUNCEID_RE);
        // 考虑到心灵没有announceid，所以idArr可能为空
        if (idArr) {
            idArr.forEach(function(id, index, arr) {
                postList[index]["announceid"] = id.replace(ANNOUNCEID_RE, "$1");
            });
        }

        var timeArr = htmlText.match(POST_TIME_RE);
        if (timeArr) {
            timeArr.forEach(function(t, index, arr) {
                postList[index]["posttime"] = t.replace(POST_TIME_RE, "$1");
            })
        }

        return postList;
    },

    postCount: function(htmlText) {
        return parseInt(htmlText.match(POST_COUNT_RE)[0].replace(POST_COUNT_RE, "$1"));
    },

    pageCount: function(htmlText) {
        return Math.ceil(_cc98.postCount(htmlText) / 10);
    },

    // 回帖内容如果要从html转成ubb的话太麻烦
    // 但是没有执行js的rawhtml里有包含ubb代码
    // 所以为了方便起见，把获取帖子内容的功能独立出来
    // 使用一个sync的ajax请求获取rawhtml再解析
    getPostContent: function(url, storey) {
        var result;
        POST_RE.lastIndex = 0;  // reinitialize the regexp
        _lib.ajax({
            "type": "GET",
            "url": url,
            "success": function(rawhtml) {
                for (var i = 0; i != storey-1; ++i)
                    POST_RE.exec(rawhtml)
                result = POST_RE.exec(rawhtml)[1] || "";
                result = result
                    .replace(REPLYVIEW_RE, "")
                    .replace(/<br>/ig, "\n");
            },
            "async": false
        });
        return _lib.unescapeHTML(result);
    },

    // 格式化网址，去除无用的参数并转为相对链接
    formatURL: function(url) {
        var urlObj = _lib.parseURL(url);

        // 不在www.cc98.org域名下
        if (urlObj["host"] != "www.cc98.org") {
            return url;
        }

        // http://www.cc98.org/
        if (!urlObj["path"]) {
            return "/";
        }

        var params = _lib.parseQS(urlObj["query"]);
        var hash = urlObj["hash"] ? ("#" + urlObj["hash"]) : ""

        // 不是dispbbs.asp开头的链接，只去掉空的get参数，转为相对链接，不做其他处理
        if (urlObj["path"] === "dispbbs,asp") {
            return "/" + urlObj["path"] + "?" + _lib.toQS(params) + hash;
        }

        // 如果不是在追踪页面，就去掉replyid
        if (!params["trace"]) {
            params["replyid"] = "";
        }
        params["page"] = "";    // 去掉page
        params["star"] = (params["star"] && params["star"] !== "1") ? params["star"] : "";    // star=1时去掉
        return "/" + urlObj["path"] + "?" + _lib.toQS(params) + hash;
    }
};



// 一些_lib函数，跟98无关但方便编程
// parseQS, toQS, parseURL, parseCookies, unescapeHTML, ajax
_lib = {

    // parse the url get parameters
    parseQS: function(url) {
        url = url.toLowerCase().split("#")[0];  // remove the hash part
        var t = url.indexOf("?");
        var hash = {};
        if (t >= 0) {
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
    unescapeHTML: function(input) {
        var e = document.createElement('div');
        e.innerHTML = input;
        return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
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
        if (opts.contentType === "application/x-www-form-urlencoded; charset=UTF-8") {
            xhr.send(_lib.toQS(opts.data));
        } else {
            xhr.send(opts.data)
        }
    }
};

_dom = {
    // xpath query
    //@return {Array}   返回由符合条件的DOMElement组成的数组
    xpath: function(expr, contextNode) {
        contextNode = contextNode || document;
        var xresult = document.evaluate(expr, contextNode, null,
                    XPathResult.ORDERED_NODE_ITERATOR_TYPE , null);
        var xnodes = [];
        var xres;
        while (xres = xresult.iterateNext()) {
            xnodes.push(xres);
        }

        return xnodes;
    },
}


})();