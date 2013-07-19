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
    // function(options)

    var FAMI_URL = "http://www.cc98.org/master_users.asp?action=award";
    var PM_URL = "http://www.cc98.org/messanger.asp?action=send";
    var POST_URL = "http://www.cc98.org/SaveReAnnounce.asp?BoardID="

    // 发米/扣米
    // options["fami"]          {boolean} 发米/扣米
    // options["boardid"]       /\d+/ 版面ID
    // options["topicid"]       /\d+/ 贴子ID
    // options["announceid"]    /\d+/ 回帖ID
    // options["amount"]        /\d{1,3}|1000/ 发米/扣米数量
    // options["reason"]        {string} 发米理由
    // options["ismsg"]         {boolean} 站短/不站短
    // options["async"]         {boolean} 是否异步（默认为真）
    // options["callback"]      function(responseText)
    function fami(options) {
        options["async"] = options["async"] | (options["async"] === undefined);
        $.ajax({
            "type": "POST",
            "url": FAMI_URL,
            "data": {
                "awardtype": options["fami"] ? 0 : 1,
                "boardid": options["boardid"],
                "topicid": options["topicid"],
                "announceid": options["announceid"],
                "doWealth": options["amount"],
                "content": options["reason"],
                "ismsg": options["ismsg"] ? "on" : ""
            },
            "success": options["callback"],
            "async": options["async"]
        });
    }

    // 回贴
    // options["url"]               {string} 贴子地址
    // options["cookies]            {string} 用户cookie
    // options["subject"]           {string} 发贴主题
    // options["expression"]        /face([01]\d)|(2[0-2])/ 发贴心情
    // options["content"]           {string} 回贴内容
    // options["replyid"]           /\d+/ 引用的贴子的announceid
    // options["sendsms"]           {boolean} 站短提示
    // options["viewerfilter"]      {boolean} 使用指定用户可见
    // options["allowedviewers"]    {string} 可见用户
    // options["async"]             {boolean} 是否异步（默认为真）
    // options["callback"]          function(responseText)


    // 站短（异步）
    // options["recipient"]     收件人
    // options["subject"]       站短标题
    // options["message"]       站短内容
    // options["async"]         {boolean} 是否异步（默认为真）
    // options["callback"]      function(responseText)
    function sendPM(options) {
        options["async"] = options["async"] | (options["async"] === undefined);
        $.ajax({
            "type": "POST",
            "url": PM_URL,
            "data": {
                "touser": options["recipient"],
                "title": options["subject"],
                "message": options["message"]
            },
            "success": options["callback"],
            "async": options["async"];
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


});
