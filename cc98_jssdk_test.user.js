// ==UserScript==
// @id             cc98_jssdk_test
// @name           cc98 jssdk test
// @version        1.0
// @namespace      soda@cc98.org
// @author         soda <sodazju@gmail.com>
// @description    
// @include        http://www.cc98.org/dispbbs.asp*
// @require        http://file.cc98.org/uploadfile/2013/7/7/1444331657.txt
// @run-at         document-end
// ==/UserScript==

// 正在试图写一个JavaScripr SDK for cc98
// 这个脚本用来测试一些单独的函数
// 实际SDK大致是面向对象的
// 非官方，纯蛋疼

// 想了想还是懒得实现了。暂时只考虑dispbbs有关的部分
// 不面向对象了
// 页面解析部分没有考虑简版（其实要是只考虑简版的话会简单很多啊）

// todo:
// 正则解析页面回贴
// 上传文件
// 给每个函数加上错误处理

$(function() {

var FAMI_URL = "http://www.cc98.org/master_users.asp?action=award";
var PM_URL = "http://www.cc98.org/messanger.asp?action=send";
var POST_URL = "http://www.cc98.org/SaveReAnnounce.asp?method=Topic";
var EDIT_URL = "http://www.cc98.org/SaveditAnnounce.asp?";

var NAME_RE = /<span style="color:\s*\#\w{6}\s*;"><b>([^<]+)<\/b><\/span>/g;
var ANNOUNCEID_RE = /<a name="(\d{2,})">/g;  // 注意网页上<a name="1">之类的标签是作为#0的anchor出现的
// ubb到html的转码是在客户端执行的，所以对页面源码可以直接匹配正则然后获取ubb
var ARTICLE_RE = /<br>\s+<span id="ubbcode\d+">(.*)<\/span>/g;  //还未考虑回复可见、楼主可见、指定用户可见、被删除、被屏蔽的帖子

// 发米/扣米
// opts["fami"]         {boolean} 发米/扣米
// opts["url"]          {string} 贴子地址
// opts["announceid"]   /\d+/ 回帖ID
// opts["amount"]       /\d{1,3}|1000/ 发米/扣米数量
// opts["reason"]       {string} 发米理由
// opts["ismsg"]        {boolean} 站短/不站短
// 以下为可选项
// opts["async"]        {boolean} 是否异步（默认为真）
// opts["callback"]     function(responseText) 回调函数
function faMi(opts) {
    if (opts["async"] === undefined) {
        opts["async"] = true;
    }

    var params = parseQS(opts["url"]);
    var boardid = params["boardid"];
    var topicid = params["id"]

    $.ajax({
        "type": "POST",
        "url": FAMI_URL,
        "data": {
            "awardtype": opts["fami"] ? 0 : 1,
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
}

// 回贴
// opts["url"]              {string} 贴子地址
// opts["expression"]       /face([01]\d)|(2[0-2])/ 发贴心情
// opts["content"]          {string} 回贴内容
// opts["password"]         {string} md5加密后的密码
// 以下为可选项
// opts["username"]         {string} 用户名
// opts["subject"]          {string} 发贴主题
// opts["replyid"]          /\d+/ 引用的贴子的announceid
// opts["edit"]             {bpplean} 是否是在编辑已发布的贴子（必须提供replyid）
// opts["sendsms"]          {boolean} 站短提示
// opts["viewerfilter"]     {boolean} 使用指定用户可见
// opts["allowedviewers"]   {string} 可见用户
// opts["async"]            {boolean} 是否异步（默认为真）
// opts["callback"]         function(responseText) 回调函数
function reply(opts) {
    opts["async"] = opts["async"] | (opts["async"] === undefined);
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

    $.ajax({
        "type": "POST",
        "url": postURL,
        "data": data,
        "success": opts["callback"],
        
        "async": opts["async"],
        
    });
}

// 站短（异步）
// opts["recipient"]    {string} 收件人
// opts["subject"]      {string} 站短标题
// opts["message"]      {string} 站短内容
// 以下为可选项
// opts["async"]        {boolean} 是否异步（默认为真）
// opts["callback"]     function(responseText) 回调函数
function sendPM(opts) {
    opts["async"] = opts["async"] | (opts["async"] === undefined);
    $.ajax({
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
}

// 获取页面中的用户列表和回贴ID
// 返回格式
// [
//     {
//         "username": "苏打绿茶",
//         "announceid": "703654358"
//     },
// ],
// todo: 返回发贴心情，发贴时间，回贴内容的ubb代码
function parseTopicPage(htmlText) {
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
}

// 回贴内容如果要从html转成ubb的话太麻烦
// 但是没有执行js的rawhtml里有包含ubb代码
// 所以为了方便起见，把获取贴子内容的功能独立出来
// 使用一个sync的ajax请求获取rawhtml再解析
function getArticleContent(url, storey) {
    // body...
}

// 格式化网址，去除无用的参数并转为相对链接
function formatURL(url) {
    var urlObj = parseURL(url);

    // 不在www.cc98.org域名下
    if (urlObj["host"] != "www.cc98.org") {
        return url;
    }

    // http://www.cc98.org/
    if (!urlObj["path"]) {
        return "/";
    }

    var params = parseQS(urlObj["query"]);
    var hash = urlObj["hash"] ? ("#" + urlObj["hash"]) : ""

    // 不是dispbbs.asp开头的链接，只去掉空的get参数，转为相对链接，不做其他处理
    if (urlObj["path"] === "dispbbs,asp") {
        return "/" + urlObj["path"] + "?" + toQS(params) + hash;
    }

    // 如果不是在追踪页面，就去掉replyid
    if (!params["trace"]) {
        params["replyid"] = "";
    }
    params["page"] = "";    // 去掉page
    params["star"] = (params["star"] === "1") ? "" : params["star"];    // star=1时去掉
    return "/" + urlObj["path"] + "?" + toQS(params) + hash;
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
};

function toQS(obj) {
    var ret = [];
    for (var key in obj) {
        if ("" === key) continue;
        if ("" === obj[key]) continue;
        ret.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
    }
    return ret.join("&");
};

function parseURL(url) {
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
};

});
