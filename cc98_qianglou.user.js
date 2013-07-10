// ==UserScript==
// @id             cc98_qianglou
// @name           cc98 qianglou
// @version        1.0
// @namespace      soda@cc98.org
// @author         soda <sodazju@gmail.com>
// @description    cc98抢楼脚本
// @include        http://www.cc98.org/dispbbs.asp*
// @require        http://file.cc98.org/uploadfile/2013/7/7/1444331657.txt
// @run-at         document-end
// ==/UserScript==

// use sessionStorage to keep working during a browser session

$(function() {
    // helper functions

    // parse the url get parameters
    function qs(url) {
        url = url.toLowerCase().split("#")[0];
        var t = url.indexOf("?");
        var hash = {};
        if (t > 0) {
            var params = url.substring(t+1).split("&");
        } else {
            var params = url.split("&");
        }
        for (var i = 0; i < params.length; ++i) {
            var val = params[i].split("=");
            hash[decodeURIComponent(val[0])] = decodeURIComponent(val[1]);
        }
        return hash;
    };

    // from https://www.inkling.com/read/javascript-definitive-guide-david-flanagan-6th/chapter-20/parsing-the-document-cookies
    // Return the document's cookies as an object of name/value pairs.
    // Assume that cookie values are encoded with encodeURIComponent().
    function getCookies() {
        var cookies = {};           // The object we will return
        var all = document.cookie;  // Get all cookies in one big string
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

    // post a reply in cc98
    function post (url, content, expression, subject, callback) {
        var params = qs(url);
        var postAddr = "http://www.cc98.org/SaveReAnnounce.asp?method=fastreply&BoardID=" + params["boardid"];
        var cookies = getCookies()["aspsky"];
        var aspsky = qs(cookies)
        var reply = {
            "Content": content,
            "Expression": expression,
            "Subject": subject || "",
            "followup": params["id"],
            "RootID": params["id"],
            "UserName": aspsky["username"],
            "passwd": aspsky["password"],
            "signflag": "yes",
            "star": params["star"] ||   1
        };
        $.ajax({
            "type": "POST",
            "url": postAddr,
            "data": reply,
            "success": callback
        })
    }

    // monitor the current post num
    function monitor (html, target, callback) {
        var re = /<span id="topicPagesNavigation">本主题贴数 <b>(\d+)<\/b>/g;
        var num = parseInt((html.match(re))[0].replace(re, "$1"));
        if (num === target - 1) {
            callback;
        }
    }

    function view () {
        // UI
        var editRow = $("#EditArea").parent().parent();
        editRow.before('\n\
            <tr>\n\
                <td class="tablebody1"><b>抢楼选项</b></td>\n\
                <td class="tablebody1">第\
                    <input id="target-num" type="text" style="width: 50px;">\
                    楼；\n\
                    刷新间隔：\
                    <input id="qianglou-interval" type="text" value="1" style="width: 30px;">\
                    秒\n\
                    <input id="start-qianglou" type="button" value="开始抢楼">\n\
                    <span id="qianglou-msg" style="display: inline-block; padding-left: 5px;"></span>\n\
            ');

        $("start-qianglou").click(storeOptions);
    }

    function showMsg (msg, color) {
        color = color || "black";
        $("#qianglou-msg").text(msg);
        $("#qianglou-msg").css("color", color);
    }

    function storeOptions () {
        // check and store qianglou options in session storage

        // stop the previous routine and start again
        var intervalID = parseInt(sessionStorage.getItem("qianglou-intervalid"));
        if (intervalID) {
            clearInterval(intervalID);
        }
        qianglou();
    }

    // starts
    function qianglou () {
        // get the options from sessionStorage
        if (sessionStorage.getItem("qianglou") == "true") {
            var intervalID = setInterval(function() {
                $.ajax({});
            }, sessionStorage.getItem("qianglou-interval"));
            sessionStorage.setItem("qianglou-intervalid", intervalID);
        }
    }

    /*setInterval(function() {
        $.ajax({
            type: "GET",
            url: "http://www.cc98.org/dispbbs.asp?BoardID=537&id=4221421",
            dataType: "text",
            success: function(text) {
            }
        })
    }, 1000)*/

    view();
    qianglou();
})
