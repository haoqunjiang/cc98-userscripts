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

$(function() {
// function format:
// function(opts)

var FAMI_URL = "http://www.cc98.org/master_users.asp?action=award";
var PM_URL = "http://www.cc98.org/messanger.asp?action=send";
var POST_URL = "http://www.cc98.org/SaveReAnnounce.asp?method=Topic"
var EDIT_URL = "http://www.cc98.org/SaveditAnnounce.asp?"

// 发米/扣米
// opts["fami"]         {boolean} 发米/扣米
// opts["url"]      {string} 贴子地址
// opts["announceid"]   /\d+/ 回帖ID
// opts["amount"]       /\d{1,3}|1000/ 发米/扣米数量
// opts["reason"]       {string} 发米理由
// opts["ismsg"]        {boolean} 站短/不站短
// 以下为可选项
// opts["async"]        {boolean} 是否异步（默认为真）
// opts["callback"]     function(responseText)
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
// opts["callback"]         function(responseText)
function reply(opts) {
    opts["async"] = opts["async"] | (opts["async"] === undefined);
    var params = parseQS(opts["url"]);
    var postUrl = POST_URL + "&boardID=" + params["boardid"];
    if (opts["edit"]) {
        postUrl = EDIT_URL + "boardID=" + params["boardid"] + "&replyID=" + opts["replyid"] + "&id=" + params["id"];
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
        "url": postUrl,
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
// opts["callback"]     function(responseText)
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

// helper functions
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

});
