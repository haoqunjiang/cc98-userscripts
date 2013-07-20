// ==UserScript==
// @id             cc98_qiangshouye
// @name           cc98 qiangshouye
// @version        0.1
// @namespace      soda@cc98.org
// @author         soda <sodazju@gmail.com>
// @description    
// @include        http://www.cc98.org/*
// @run-at         document-end
// ==/UserScript==

(function() {

var POST_URL = "http://www.cc98.org/SaveReAnnounce.asp?method=Topic";
var EDIT_URL = "http://www.cc98.org/SaveditAnnounce.asp?";

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
function reply(opts) {
    var params = parseQS(opts["url"]);
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

    ajax({
        "type": "POST",
        "url": postURL,
        "data": data,
        "success": opts["callback"],
        "async": opts["async"],
        
    });
}

// parse the url get parameters
function parseQS(url) {
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
}

function toQS(obj) {
    var ret = [];
    for (var key in obj) {
        if ("" === key) continue;
        if ("" === obj[key]) continue;
        ret.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
    }
    return ret.join("&");
}

function ajax(opts) {
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
    xhr.send(toQS(opts.data));
}

function parseCookies(theCookie) {
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
}

function main() {
    var id = setInterval( function() {
        ajax({
            "url": "http://www.cc98.org/queryresult.asp?stype=3",
            "success": qiangshouye,
        });
    }, 3000);
    localStorage.setItem("qiangshouye", id);
}

function qiangshouye(html) {
    var NEWTOPIC_RE = /<\/a>\s*<a href='([^']*)'[^>]*>\s*(.*)\r/g;
    var latest = html.match(NEWTOPIC_RE)[0];
    var url = "http://www.cc98.org/" + latest.replace(NEWTOPIC_RE, "$1");
    var title = latest.replace(NEWTOPIC_RE, "$2");
    console.log(title)
    if (title.indexOf("水楼") > 0) {
        reply({
            "url": url,
            "expression": "face7.gif",
            "content": "[em03]sy",
            "password": parseQS(parseCookies(document.cookie)["aspsky"])["password"],
            "callback": function() { alert("成功抢到贴子“" + title + "”的首页！"); }
        })
        clearInterval(parseInt(localStorage.getItem("qiangshouye")));
        localStorage.remove("qiangshouye");
    }
}

var btn = document.createElement("input");
btn.setAttribute("type", "submit");
btn.setAttribute("value", "开始抢首页");
btn.setAttribute("id", "qiangshouye");

// Using xpath
function xpath(expr)
{
    return document.evaluate(
        expr,
        document,
        null,
        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
        null
    );
}

var pos = xpath("//td[@class='TopLighNav1']/div/div").snapshotItem(0);

pos.appendChild(btn);
document.getElementById("qiangshouye").addEventListener("click", main);

})();