// ==UserScript==
// @id             cc98_reply_suite
// @name           cc98 reply suite
// @version        0.1
// @namespace      soda@cc98.org
// @author         soda <sodazju@gmail.com>
// @description    
// @include        http://www.cc98.org/dispbbs.asp*
// @require        http://file.cc98.org/uploadfile/2013/7/7/1444331657.txt
// @run-at         document-end
// ==/UserScript==

// todo:
// 查看原帖
// 内容为空的时候快捷回复（可选）
// ajax回复
// @
// 自动10s倒计时
// 常用表情+自定义表情
// 新回复框（悬浮，@高亮，加粗，颜色选择器，传图，发贴心情，表情）
// 未来考虑整合马甲切换器，实现马甲发贴功能

$(function() {

    var INITIAL_CONFIG = {
        autoReply: true,                // 10秒错误后自动读秒回复
        enableMultiquote: false,        // 默认不多重引用
        useRelativeUrl: true,           // 使用相对链接
        viewOriginalPost: true,         // 在引用中加入"查看原帖"
        blockQuotedEmotions: false,     // 是否屏蔽引用里的表情和图片

        autoSaveInterval: 1,            // 自动保存间隔(分钟)
        expireTime: 30,                 // 帖子内容过期时间(分钟)
        maxTextareaLength: 16240,       // 文本框的最大输入长度(字节数)
        maxSubjectLength: 100,          // 主题框的最大输入长度(字节数)
        rtString: "|查看原帖|",         // 查看原帖的提示文字
        rtColor: "seagreen",            //「查看原帖」的颜色
    };

    var config;

    function loadConfig() {
        config = JSON.parse(localStorage.getItem("reply_config"));
        if (!config) {
            config = INITIAL_CONFIG;
            localStorage.setItem("reply_config", JSON.stringify(config));
        }
    }

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
    };

    // 回帖
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
            "star": params["star"] || 1
        };
        $.ajax({
            "type": "POST",
            "url": postAddr,
            "data": reply,
            "success": callback
        })
    };

    // 引用

    // 答复

    // 站短
    function sendMessage(recipient, subject, content, callback) {
        $.ajax({
            "type": "POST",
            "url": "http://www.cc98.org/messanger.asp?action=send",
            "data": {
                "touser": recipient,
                "title": subject,
                "message": content
            },
            "success": callback
        })
    }

    function makeRelativeUrl (content) {
        return content.replace(/(http.*)www\.cc98\.org\/([&=#%\w\+\.\?]+)/g, '[url] /$2 [/url]');
    };

    function view () {
        quoteBtn = $("img[src='pic/reply.gif']").parent();
        fastReplyImg = $('<img src="http://file.cc98.org/uploadfile/2013/7/17/2156264601.png">');
        fastReplyImg.css({
            "vertical-align": "middle",
            "margin-left": "5px"
        })
        fastReplyBtn = $('<a class="fastreply-btn" href="javascript:void(0);"></a>');
        fastReplyBtn.append(fastReplyImg);

        quoteBtn.parent().append(fastReplyBtn);

        $(".fastreply-btn").each(function (index, ele) {
            this.id = "fastreply-" + index;
        });
    };

    // loadConfig();
    view();

})

// reply button image: http://file.cc98.org/uploadfile/2013/7/17/2156264601.png
