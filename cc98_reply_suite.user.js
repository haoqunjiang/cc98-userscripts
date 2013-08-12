// ==UserScript==
// @id             cc98_reply_suite
// @name           cc98 reply suite
// @version        0.2.5
// @namespace      soda@cc98.org
// @author         soda <sodazju@gmail.com>
// @description    
// @include        http://www.cc98.org/dispbbs.asp*
// @require        http://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js
// @run-at         document-end
// ==/UserScript==

// 注意，查看原帖的链接默认在新选项卡打开

// 功能：快速回复、快速引用、10s后自动读秒回复、多重引用、查看原帖、默认回复、小尾巴、自动保存草稿、@用户、多文件上传、相对链接、简单的UBB编辑器、自定义表情

// todo:
// @，提示输入内容的最大长度，自定义表情

// 自己写的cc98 JavaScript SDK
// _lib对象是各种辅助函数，比如解析querystring，ajax调用，xpath等
// _cc98对象中是各种98相关的函数，比如发米、回帖、站短、解析页面等

// 注意，本脚本中所有storey都是以1-9表示对应楼层，0表示第十层（为了跟脚本快捷键一致╮(╯▽╰)╭）
// 而index表示楼层的序号，0是第一楼，1是第二楼……
(function() {

// Chrome 没有sendAsBinary函数，这里是一个实现
if (!XMLHttpRequest.prototype.sendAsBinary) {
    XMLHttpRequest.prototype.sendAsBinary = function(datastr) {
        function byteValue(x) {
            return x.charCodeAt(0) & 0xff;
        }
        var ords = Array.prototype.map.call(datastr, byteValue);
        var ui8a = new Uint8Array(ords);
        this.send(ui8a);
    }
}

// 转成UNICODE编码（sendAsBinary不能识别中文）
function toUnicode(str){
    return escape(str).toLocaleLowerCase().replace(/%u/gi,'\\u');
}

// 辅助函数
// parseQS, toQS, parseURL, parseCookies, unescapeHTML, ajax, xpath, addStyles
window._lib = {

    // parse the url get parameters
    parseQS: function(url) {
        url = url.toLowerCase().split('#')[0];  // remove the hash part
        var t = url.indexOf('?');
        var hash = {};
        if (t >= 0) {
            var params = url.substring(t+1).split('&');
        } else {    // plain query string without '?' (e.g. in cookies)
            var params = url.split('&');
        }
        for (var i = 0; i < params.length; ++i) {
            var val = params[i].split('=');
            hash[decodeURIComponent(val[0])] = decodeURIComponent(val[1]);
        }
        return hash;
    },

    toQS: function(obj) {
        var ret = [];
        for (var key in obj) {
            if ('' === key) continue;
            if ('' === obj[key]) continue;
            ret.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
        }
        return ret.join('&');
    },

    parseURL: function(url) {
        // from JavaScript: The Good Parts
        var parse_url = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/
        var arr = parse_url.exec(url);
        var result = {};
        result['url'] = arr[0];
        result['scheme'] = arr[1];
        result['slash'] = arr[2];
        result['host'] = arr[3];
        result['port'] = arr[4];
        result['path'] = arr[5];
        result['query'] = arr[6];
        result['hash'] = arr[7];
        return result;
    },

    parseCookies: function(theCookie) {
        var cookies = {};           // The object we will return
        var all = theCookie;        // Get all cookies in one big string
        if (all === '')             // If the property is the empty string
            return cookies;         // return an empty object
        var list = all.split('; '); // Split into individual name=value pairs
        for(var i = 0; i < list.length; i++) {  // For each cookie
            var cookie = list[i];
            var p = cookie.indexOf('=');        // Find the first = sign
            var name = cookie.substring(0,p);   // Get cookie name
            var value = cookie.substring(p+1);  // Get cookie value
            value = decodeURIComponent(value);  // Decode the value
            cookies[name] = value;              // Store name and value in object
        }
        return cookies;
    },

    // 将转义后的html转回来
    unescapeHTML: function(input) {
        var e = document.createElement('div');
        e.innerHTML = input;
        return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue;
    },

    ajax: function(opts) {
        opts = {
            type: opts.type || 'GET',
            url: opts.url || '',
            data: opts.data || null,
            contentType: opts.contentType || 'application/x-www-form-urlencoded; charset=UTF-8',
            success: opts.success || function() {},
            async: opts.async || (opts.async === undefined)
        };

        var xhr = new XMLHttpRequest;
        xhr.open(opts.type, opts.url, opts.async);
        xhr.setRequestHeader('Content-type', opts.contentType);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                opts.success(xhr.responseText);
            }
        };
        if (opts.contentType === 'application/x-www-form-urlencoded; charset=UTF-8') {
            xhr.send(_lib.toQS(opts.data));
        } else {
            xhr.sendAsBinary(opts.data);
        }
    },

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
    // 添加CSS
    addStyles: function(css) {
        var head = document.getElementsByTagName('head')[0];
        var style = document.createElement('style');

        style.setAttribute('type', 'text/css');
        style.innerHTML = css;
        head.appendChild(style);
    }
}

// 98相关的函数接口
// fami, reply, sendPM, upload, getPostContent, parseTopicPage, postCount, pageCount, formatURL
window._cc98 = function() {

    // 各种常量
    var FAMI_URL = 'http://www.cc98.org/master_users.asp?action=award';
    var PM_URL = 'http://www.cc98.org/messanger.asp?action=send';
    var REPLY_URL = 'http://www.cc98.org/SaveReAnnounce.asp?method=Topic';
    var EDIT_URL = 'http://www.cc98.org/SaveditAnnounce.asp?';

    var POST_COUNT_RE = /本主题贴数\s*<b>(\d+)<\/b>/ig;

    // 以下三个没有考虑被删除的帖子，因为在当前页解析的时候DisplayDel()和正常的发帖时间之类的会一起出现，导致匹配会乱掉
    // 因此引起的发米机发米楼层可能不精确的问题也没办法了……
    var NAME_RE = /(?:name="\d+">| middle;">&nbsp;)\s*<span style="color:\s*\#\w{6}\s*;"><b>([^<]+)<\/b><\/span>/g;
    var ANNOUNCEID_RE = /<a name="(\d{2,})">/g; // 注意网页上<a name="1">之类的标签是作为#0的anchor出现的
    var POST_TIME_RE = /<\/a>\s*([^AP]*[AP]M)\s*<\/td>/g;

    var POST_RE = /\s<span id="ubbcode[^>]*>(.*)<\/span>|>本楼只允许特定用户查看|>该帖子设置了楼主可见|>该账号已经被禁止|>DisplayDel()/ig;

    // 用于在getPostContent()函数中去掉回复可见的内容
    var REPLYVIEW_RE = /<hr noshade size=1>.*<hr noshade size=1>/ig;

    // 默认文件上传到的版面：论坛帮助
    // 允许 gif|docx|xlsx|pptx|pdf|xap|jpg|jpeg|png|bmp|rar|txt|zip|mid|rm|doc|mp3
    var DEFAULT_UPLOAD_BOARDID = 184;

    // 其他文件扩展名与允许上传的boardid的对应列表
    var file2boardid = {
        'ipa': 598, // iOS
        'ppt': 598,
        'xls': 598,
        'chm': 598,
        'wma': 169, // 摇滚和独立音乐
        'lrc': 169,
        'asf': 169,
        'flv': 169,
        'wmv': 169,
        'rmvb': 169,
        'mpg': 169,
        'avi': 169,
        'swf': 170, // 史海拾贝
        'rep': 200, // 星际专区
        'tar': 212, // Linux天地
        'gz': 212,
        'bz2': 212,
        'tbz': 212,
        'tgz': 212,
        'psd': 239, // 贴图工坊
        'gtp': 308, // 乱弹吉他
        'gp3': 308,
        'gp4': 308,
        'gp5': 308,
        'torrent': 499, // 多媒体技术
        'srt': 499
    };

    // 发米/扣米
    // @param {string}      opts.url 帖子地址
    // @param {Number}      opts.announceid 回帖ID
    // @param {Number}      opts.amount 发米/扣米数量[0-1000]
    // @param {string}      opts.reason 发米理由
    // @param {boolean}     opts.ismsg  站短/不站短
    // @param {boolean}     [opts.awardtype=true] 是否发米
    // @param {function(responseText)} [opts.callback=function(){}] 回调函数
    this.fami = function(opts) {
        opts.callback = opts.callback || (function() {});
        opts.awardtype = opts.awardtype || (opts.awardtype === undefined);

        var params = _lib.parseQS(opts["url"]);
        var boardid = params["boardid"];
        var topicid = params["id"];

        _lib.ajax({
            'type': 'POST',
            'url': FAMI_URL,
            'data': {
                'awardtype': opts['awardtype'] ? 0 : 1,
                'boardid': boardid,
                'topicid': topicid,
                'announceid': opts['announceid'],
                'doWealth': opts['amount'],
                'content': opts['reason'],
                'ismsg': opts['ismsg'] ? 'on' : ''
            },
            'success': opts['callback'],
        });
    },

    // 回帖
    // @param {string}  opts.url 帖子地址
    // @param {string}  opts.expression 发帖心情
    // @param {string}  opts.content 回帖内容
    // @param {string}  [opts.subject] 发帖主题
    // @param {string}  [opts.password] md5加密后的密码（不提供就从cookie中获取）
    // @param {boolean} [opts.edit] 是否是在编辑已发布的帖子（是的话必须提供replyid）
    // @param {Number}  [opts.replyid] 引用的帖子的announceid
    // @param {boolean} [opts.sendsms] 站短提示
    // @param {boolean} [opts.viewerfilter] 使用指定用户可见
    // @param {string}  [opts.allowedviewers] 可见用户
    // @param {function(responseText)} [opts.callback=function(){}] 回调函数
    this.reply = function(opts) {
        var params = _lib.parseQS(opts["url"]);
        var postURL = REPLY_URL + "&boardid=" + params["boardid"];
        if (opts["edit"]) {
            postURL = EDIT_URL + "boardid=" + params["boardid"] + "&replyid=" + opts["replyid"] + "&id=" + params["id"];
        }

        if (!opts.password) {
            opts.password = _lib.parseQS(_lib.parseCookies(document.cookie)['aspsky'])['password'];
        }
        if (!opts.username) {
            opts.username = _lib.parseQS(_lib.parseCookies(document.cookie)['aspsky'])['username'];
        }

        var data = {
                'subject': opts['subject'] || '',
                'expression': opts['expression'],
                'content': opts['content'],
                'followup': opts['edit'] ? params['id'] : (opts['replyid'] || params['id']),
                'replyid': opts['replyid'] || params['id'],
                'sendsms': opts['sendsms'] ? '1' : '0',
                'rootid': params['id'],
                'star': params['star'] || '1',
                'passwd': opts['password'],
                'signflag': 'yes',
                'enableviewerfilter': opts['viewerfilter'] ? '1' : '',
            };
        if (opts['viewerfilter']) {
            data['allowedviewers'] = opts['allowedviewers'] || '';
        }

        _lib.ajax({
            'type': 'POST',
            'url': postURL,
            'data': data,
            'success': opts['callback']
        });
    },

    // 站短
    // @param {string}  opts.recipient 收件人
    // @param {string}  opts.subject 站短标题
    // @param {string}  opts.message 站短内容
    // @param {function(responseText)} [opts.callback=function(){}] 回调函数
    this.sendPM = function(opts) {
        _lib.ajax({
            "type": "POST",
            "url": PM_URL,
            "data": {
                "touser": opts["recipient"],
                "title": opts["subject"],
                "message": opts["message"]
            },
            "success": opts["callback"]
        });
    },

    this.upload = function(file, callback) {
        var reader = new FileReader();

        var ext = file.name.substring(file.name.lastIndexOf('.') + 1);    // 文件扩展名
        var boardid = file2boardid[ext] || DEFAULT_UPLOAD_BOARDID;
        var url = 'http://www.cc98.org/saveannouce_upfile.asp?boardid=' + boardid;

        reader.onload = function(e)
        {
            var boundary = '----------------';
            boundary += parseInt(Math.random()*98989898+1);
            boundary += parseInt(Math.random()*98989898+1);

            var data = [boundary,'\r\n',
                'Content-Disposition: form-data; name="act"\r\n\r\nupload',
                '\r\n',boundary,'\r\n',
                'Content-Disposition: form-data; name="fname"\r\n\r\n',toUnicode(file.name),
                '\r\n',boundary,'\r\n',
                'Content-Disposition: form-data; name="file1"; filename="',toUnicode(file.name),'"\r\n',
                'Content-Type: ',file.type,'\r\n\r\n',
                e.target.result,
                '\r\n',boundary,'\r\n',
                'Content-Disposition: form-data; name="Submit"\r\n\r\n\xc9\xcf\xb4\xab',  // 上传
                '\r\n',boundary,'--\r\n'].join('');

            _lib.ajax({
                'type': 'POST',
                'url': url,
                'contentType': 'multipart/form-data; boundary='+boundary,
                'data': data,
                'success': callback
            });

        }
        reader.readAsBinaryString(file);
    },

    // 回帖内容如果要从html转成ubb的话太麻烦，但是没有执行js的rawhtml里有包含ubb代码
    // 所以为了方便起见，把获取帖子内容的功能独立出来，为它再开一个ajax请求
    // @param {string} url 网址
    // @param {Number} storey 楼层[1-9,0]
    // @param {function(postContent)) callback 回调函数
    this.getPostContent = function(url, storey, callback) {
        var index;  // 实际索引
        index = ((storey-1) >= 0) ? (storey-1) : 9;
        POST_RE.lastIndex = 0;  // reinitialize the regexp
        _lib.ajax({
            'type': 'GET',
            'url': url,
            'success': function(rawhtml) {
                var result;
                for (var i = 0; i != index; ++i)
                    POST_RE.exec(rawhtml)
                    result = POST_RE.exec(rawhtml)[1] || '';
                    result = result
                        .replace(REPLYVIEW_RE, '')
                        .replace(/<br>/ig, '\n');
                    callback(_lib.unescapeHTML(result));
            }
        });
    },

    // 获取页面中的用户列表，回帖时间回帖ID
    // @return {Array}  每个数组元素都有username, annouceid, posttime三个属性
    this.parseTopicPage = function(htmlText) {
        if (!htmlText) htmlText = document.body.innerHTML;
        var postList = [];
        
        var nameArr = htmlText.match(NAME_RE);
        nameArr.forEach(function(name, index, arr) {
            var post = {};
            post['username'] = name.replace(NAME_RE, '$1');
            postList.push(post);
        });

        var idArr = htmlText.match(ANNOUNCEID_RE);
        // 考虑到心灵没有announceid，所以idArr可能为空
        if (idArr) {
            idArr.forEach(function(id, index, arr) {
                postList[index]['announceid'] = id.replace(ANNOUNCEID_RE, '$1');
            });
        }

        var timeArr = htmlText.match(POST_TIME_RE);
        if (timeArr) {
            timeArr.forEach(function(t, index, arr) {
                postList[index]['posttime'] = t.replace(POST_TIME_RE, '$1');
            })
        }

        return postList;
    },

    this.postCount = function(htmlText) {
        if (!htmlText) htmlText = document.body.innerHTML;
        return parseInt(htmlText.match(POST_COUNT_RE)[0].replace(POST_COUNT_RE, '$1'));
    },

    this.pageCount = function(htmlText) {
        if (!htmlText) htmlText = document.body.innerHTML;
        return Math.ceil(_cc98.postCount(htmlText) / 10);
    },

    // 格式化网址，去除无用的参数并转为相对链接
    // @param {string}  url 要格式化的网址
    // @param {boolean} maxPageFix 是否修正url中star参数的值，使其不超过当前最后页的实际值
    this.formatURL = function(url, maxPageFix) {
        var urlObj = _lib.parseURL(url);

        // 不在www.cc98.org域名下
        if (urlObj['host'] != 'www.cc98.org') {
            return url;
        }

        // http://www.cc98.org/
        if (!urlObj['path']) {
            return '/';
        }

        var params = _lib.parseQS(urlObj['query']);
        var hash = urlObj['hash'] ? ('#' + urlObj['hash']) : ''

        // 不是dispbbs.asp开头的链接，只去掉空的get参数，转为相对链接，不做其他处理
        if (urlObj['path'] === 'dispbbs,asp') {
            return '/' + urlObj['path'] + '?' + _lib.toQS(params) + hash;
        }

        // 如果不是在追踪页面，就去掉replyid
        if (!params['trace']) {
            params['replyid'] = '';
        }
        params['page'] = '';    // 去掉page

        // 
        if (params['star'] && maxPageFix && parseInt(params['star']) > _cc98.pageCount()) {
            params['star'] = _cc98.pageCount()
        }

        params['star'] = (params['star'] && params['star'] !== '1') ? params['star'] : '';    // star=1时去掉
        return '/' + urlObj['path'] + '?' + _lib.toQS(params) + hash;
    }

    return this;
}();
})();


// 实际代码
$(function() {

var maxTextareaLength = 16240;       // 文本框的最大输入长度(字节数)
var maxSubjectLength = 100;          // 主题框的最大输入长度(字节数)


////////////////////////////////////////////////////////////////////////////////
// 配置相关
////////////////////////////////////////////////////////////////////////////////
var INITIAL_OPTIONS = {
    version: '0.2.5',                   // 脚本的版本号，便于后续升级时对配置做更改

    viewOriginalPost: true,         // 在引用中加入"查看原帖"
    rtString: '➤➤➤➤➤',          // 原帖链接的提示文字
    rtColor: 'seagreen',            //「查看原帖」的颜色
    //blockQuotedEmotions: false,   // 是否屏蔽引用里的表情和图片（暂未实现）

    autoSaveInterval: 30,           // 自动保存间隔(秒)，必须是10的倍数
    useRelativeURL: true,           // 使用相对链接
    defaultReplyContent: '\n',      // 文本框为空时的默认回复内容
    replyTail: ""                   // 小尾巴
};

var options = INITIAL_OPTIONS;

/*
function loadoptions() {
    options = JSON.parse(localStorage.getItem('reply_options'));
    if (!options) {
        options = INITIAL_OPTIONS;
        storeoptions();
    }
}

function storeoptions() {
    localStorage.setItem('reply_options', JSON.stringify(options));
}

loadoptions();
*/

////////////////////////////////////////////////////////////////////////////////
// 以下是界面无关的代码
////////////////////////////////////////////////////////////////////////////////

// unique id generator
var uid = function() {
    var id = 0;
    return function() {
        return id++;
    }
}();

// simple jquery draggable div plug-in
// from https://reader-download.googlecode.com/svn/trunk/jquery-draggable/index.html
// modified by soda<sodazju@gmail.com>
$.fn.drags = function(opt) {

    opt = $.extend({
        selected: "",   // 被鼠标选中的对象（默认为this）
        draggable: "",  // 被拖动的对象（默认为this）
        cursor: "move",
        draggableClass: "draggable",
        preventDefault: true
    }, opt);

    var $draggable = (opt.draggable === "") ? this : $(document).find(opt.draggable);
    var $selected = (opt.selected === "") ? this : $(document).find(opt.selected);

    $draggable.addClass(opt.draggableClass);
    $selected.css('cursor', opt.cursor);

    $selected.on('mousedown', function(e) {
        var pos_y = $draggable.offset().top - e.pageY;
        var pos_x = $draggable.offset().left - e.pageX;

        $(document).on('mousemove', function(e) {
            $draggable.offset({
                "top": e.pageY + pos_y,
                "left": e.pageX + pos_x
            });
        }).on('mouseup', function() {
            $(this).off('mousemove'); // Unbind events from document
        });
        if (opt.preventDefault) {
            e.preventDefault(); // disable selection
        }
    });

    return this;
}


////////////////////////////////////////////////////////////////////////////////
// 以下都是跟界面有关的函数
////////////////////////////////////////////////////////////////////////////////

// 显示发帖状态（成功、失败、10s等）
function showStatus(status, color) {
    $('#submitting_status').text(status);
    if (color) $('#submitting_status').css('color', color);
}

// 显示发帖心情
function showExpressionList() {
    if ($('#expression_list').length) return; // 如果页面中已经存在「心情列表」则返回

    $('#subject_line').append('<div id="expression_list"></div>');

    var expressionList = $('#expression_list');
    expressionList.css({
        'position': 'relative',
        'background-color': '#fff',
        'z-index': 100,
        'margin-top': '-24px',  // 比原表情的位置偏离一点点，以覆盖住后面表示被选中的虚线框
        'margin-left': '2px'
    });

    for (var i = 1; i <= 22; ++i) {
        var img = $('<img src="http://www.cc98.org/face/face' + i + '.gif">');
        img.css({
            'cursor': 'pointer',
            'margin': '0 10px 0 0',
            'border': '0'
        });

        img.click(function() {
            $('#post_expression').children().eq(0).attr('src', this.src);
            $('#expression_list').remove();
        });

        expressionList.append(img);
    }
}

// 添加UBB代码
function addUBBCode(key) {
    var elem = document.getElementById('post_content');
    var start = elem.selectionStart;
    var end = elem.selectionEnd;
    var open_tag = '[' + key + ']';
    var close_tag = '[/' + key + ']';
    var sel_txt = elem.value.substring(start,end);
    var replace = open_tag + sel_txt + close_tag;

    elem.value = elem.value.substring(0,start) + replace + elem.value.substring(end);

    elem.focus();
    elem.selectionStart = elem.selectionEnd = start + open_tag.length + sel_txt.length;
}

// 往输入框当前光标位置添加内容
function insertContent(content) {
    var elem = $('#post_content').get(0);
    var start = elem.selectionStart;
    var end = elem.selectionEnd;
    elem.value = elem.value.substring(0,start) + content + elem.value.substring(end);
    elem.focus();
    elem.selectionStart = elem.selectionEnd = start + content.length;
}

// 显示表情列表（待完成）
function toggleEmotions() {
    if ($('#emot_panel').length) {
        $('#emot_panel').remove();
        return;
    }

    $('#reply_dialog').append('<div id="emot_panel"></div>');


    for (var i = 0; i <= 91; ++i) {
        var img = $('<img src="http://www.cc98.org/emot/simpleemot/emot' + ((i < 10) ? '0' + i : i) + '.gif">');

        img.click(function() {
            insertContent(this.src.replace(/.*emot(\d+)\.gif/ig, '[em$1]'));
        });

        $('#emot_panel').append(img);
    }
}

// 上传文件
function uploadFiles() {
    var files = document.getElementById('files').files;

    if (!files.length) {
        document.getElementById('upload_msg').textContent = '请选择要上传的文件';
        return;
    }

    document.getElementById('attach_table').style.display = 'table';
    for (var i = 0, f; i < files.length; ++i) {
        f = files[i];

        var result = document.createElement('tr');
        var name = document.createElement('td');
        var size = document.createElement('td');
        var status = document.createElement('td');

        name.id = 'file' + uid();
        name.className = 'filename';
        name.textContent = f.name;
        size.textContent = (f.size / 1024).toFixed(2) + ' kB';
        status.textContent = '正在上传…';

        result.appendChild(name);
        result.appendChild(size);
        result.appendChild(status);

        document.getElementById('attach_list').appendChild(result);

        // jQuery和原生JS夹杂的风格很不喜欢，不过没办法了
        // 采用闭包的原因是为了防止for循环结束后，上层函数（uploadFile）里各个变量都固定为最后一个
        var callback = function(file_id, image_autoshow) {
            return function(html) {
                var file = $('#' + file_id);

                var pattern = /script>insertupload\('([^']+)'\);<\/script/ig;
                var ubb = pattern.exec(html);

                if (ubb) {
                    // 要插入的ubb代码
                    ubb = ubb[1] + '\n';

                    // 自动显示图片
                    if (image_autoshow) {
                        ubb = ubb.replace(/(,1)/ig, "");
                    }

                    file.next().next().addClass('uploadsuccess').text('上传成功');

                    // 点击文件名插入ubb代码
                    file.css('cursor', 'pointer');
                    file.click(function(ubb) {
                        return function() {
                            insertContent(ubb);
                        }
                    }(ubb));

                } else if (html.indexOf('文件格式不正确') != -1) {
                    file.next().next().addClass('uploadfail').text('文件格式不正确');
                } else {
                    file.next().next().addClass('uploadfail').text('上传失败');
                }
            }
        }(name.id, $('#image_autoshow').prop('checked'));

        _cc98.upload(f, callback);
    }

    // 关闭上传面板
    $('#upload_panel').remove();
}

// 保存草稿
function saveDraft() {
    sessionStorage.setItem('cc98_editor_content', $('#post_content').val());
    var d = new Date();
    var time = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
    $('#e_tip').text('帖子内容保存于 ' + time);
}

// 将content中的URL替换为相对链接
function makeRelativeURL(content) {
    return content.replace(/(?:http:\/\/)?www\.cc98\.org\/[&=#%\w\+\.\?]+/g, function(match, offset, string){
        return '[url]' + _cc98.formatURL(match) + '[/url]';
    });
}

// at用户并刷新页面（于回复成功后执行）
function atUsers() {
    showStatus('发帖成功，正在跳转…');
    location.reload();
}

// 实际发表回复
function reply() {
    var expr = $('#post_expression').children().eq(0).attr('src')
    expr = expr.substring(expr.lastIndexOf('/') + 1);

    // 考虑到用户可能把默认回复和小尾巴都去掉，所以回复内容仍可能为空
    if ($('#post_content').val() === "") {
        showStatus('帖子内容不能为空');
        return;
    }

    showStatus('发表帖子中…');

    _cc98.reply({
        "url": window.location.href,
        "expression": expr,
        "content": $('#post_content').val(),
        "subject": $('#post_subject').val(),
        "callback": function(html) {
            if (html.indexOf("状态：回复帖子成功") !== -1) {
                // 回复成功，下一步是处理@信息并刷新页面
                atUsers();
            } else if (html.indexOf("本论坛限制发贴距离时间为10秒") !== -1) {
                // 10s倒计时
                for (var i = 0; i <= 10; ++i) {
                    setTimeout(function(e) {
                        return function() { showStatus('论坛限制发帖时间间隔10s，倒计时' + (10-e) + 's…'); }
                    }(i), i * 1000);
                }

                // 倒计时结束重新发帖
                setTimeout(reply, 10000);
            } else {
                // 未知错误
                showStatus('未知错误');
            }
        }
    });
}

// 提交回复，包括对帖子内容的预处理（加小尾巴等）
function submit() {
    // 为空则添加默认回复
    if ($('#post_content').val() === '')
        $('#post_content').val(options.defaultReplyContent);

    // 添加小尾巴
    if (options.replyTail) {
        $('#post_content').val($('#post_content').val() + '\n' + options.replyTail);
    }

    // 相对链接
    if (options.useRelativeURL) {
        $('#post_content').val(makeRelativeURL($('#post_content').val()));
    }

    // 提交回复
    reply();
}

// 显示回复面板，添加与其相关的各种事件绑定
function showDialog() {
    var reply_dialog_html = 
    '<div id="reply_dialog">' +
    '<form id="replyform">' +
    '<ul id="replytable"width="100%">' +
        '<li id="dialog_header">' +
            '<h3 id="replybox_title" class="box_title">' +
                '参与/回复主题' +
                '<span><a id="dialog_close_btn" class="close_btn" title="关闭"></a></span>' +
            '</h3>' +
        '</li>' +
    '' +
        '<li id="subject_line" class="clearfix">' +
            '<label for="post_subject"><a id="post_expression" href="javascript:void(0);"><img src="http://www.cc98.org/face/face7.gif"></a></label>' +
            '<input type="text" id="post_subject" name="post_subject">' +
        '</li>' +
    '' +
        '<li>' +
            '<div id="editor">' +
                '<div id="e_control">' +
                    '<a id="add_emotions" title="表情" href="javascript:void(0);"><img class="e_ctrl_btn" src="http://www.cc98.org/emot/simpleemot/emot88.gif"></a>' +
                    '<a id="bold" title="加粗" href="javascript:void(0);"><img class="e_ctrl_btn" src="http://file.cc98.org/uploadfile/2013/8/7/22333264497.gif"></a>' +
                    '<a id="strikethrough" title="删除线" href="javascript:void(0);"><img class="e_ctrl_btn" src="http://file.cc98.org/uploadfile/2013/8/7/22525420119.png"></a>' +
                    '<a id="add_attachments" href="javascript:void(0);">| 添加附件</a>' +
                '</div>' +
    '' +
                '<textarea id="post_content" role="textbox" aria-multiline="true"></textarea>' +
    '' +
                '<div id="e_statusbar">' +
                    '<span id="e_tip"></span>' +
                    '<span id="e_autosavecount"></span>' +
                    '<a id="e_save" href="javascript:void(0);">保存草稿</a>' +
                    ' | ' +
                    '<a id="e_recover" href="javascript:void(0);">恢复数据</a>' +
                '</div>' +
            '</div>' +
        '</li>' +
    '' +
        '<li>' +
            '<table class="btn_bar">' +
                '<tbody>' +
                    '<tr>' +
                        '<td width="20%"><input type="button" id="submit_post" class="soda_button" value="提交回复"></td>' +
                        '<td width="80%"><span id="submitting_status"></span></td>' +
                    '</tr>' +
                '</tbody>' +
            '</table>' +
        '</li>' +
    '' +
    '</ul>' +
    '</form>' +
    '' +
    '<table id="attach_table">' +
        '<thead>' +
            '<tr>' +
                '<th id="filenames" width="50%">点击文件名添加到帖子中（点此全部加入）</th>' +
                '<th width="20%">大小</th>' +
                '<th width="30%">状态</th>' +
            '</tr>' +
        '</thead>' +
        '<tbody id="attach_list">' +
        '</tbody>' +
    '</table>' +
    '' +
    '</div>';

    var upload_panel_html =
    '<div id="upload_panel">' +
        '<h3 id="upload_title" class="box_title">' +
            '添加附件' +
            '<span><a id="upload_close_btn" class="close_btn" title="关闭"></a></span>' +
        '</h3>' +
        '<input type="file" id="files" name="files[]" multiple>' +
        '<br>' +
        '<table class="btn_bar" width="100%">' +
            '<tbody>' +
                '<tr>' +
                    '<td><input type="checkbox" id="image_autoshow" name="image_autoshow" value="autoshow"><label for="image_autoshow">直接显示图片</label></td>' +
                    '<td><input type="button" id="confirm_upload" class="soda_button" value="上传"></td>' +
                '</tr>' +
            '</tbody>' +
        '</table>' +
        '<div id="upload_msg"></div>' +
    '</div>';

    if ($('#reply_dialog').length) return;
    $('body').append(reply_dialog_html);

    var reply_dialog = $('#reply_dialog');
    // 居中（可见区域内绝对居中，不是固定居中，考虑到上传文件数量可能特别多超过可见范围）
    reply_dialog.css({
        'top': (document.body.clientHeight - reply_dialog.height()) / 2 + $(window).scrollTop(),
        'left': (document.body.clientWidth - reply_dialog.width()) / 2 + $(window).scrollLeft()
    });

    // 各种事件绑定
    $('#replybox_title').drags({"draggable": "#reply_dialog"});
    $('#dialog_close_btn').click(function() { $('#reply_dialog').remove(); $('#upload_panel').remove(); });

    $('#post_expression').click(showExpressionList);

    // UBB编辑器
    $('#bold').click(function() { addUBBCode('b') });
    $('#strikethrough').click(function() { addUBBCode('del') });

    // 表情列表
    $('#add_emotions').click(toggleEmotions);

    // 显示上传面板，添加与其相关的事件绑定
    $('#add_attachments').click(function() {
        if ($('#upload_panel').length) return;

        $('body').append(upload_panel_html);  // 这样每次都会新建一个div而不是重复使用之前的那个
        $('#upload_title').drags({'draggable': '#upload_panel'});
        $('#upload_close_btn').click(function() { $('#upload_panel').remove(); })
        // 居中显示
        var upload_panel = $('#upload_panel');
        upload_panel.css({
            'top': (document.body.clientHeight - upload_panel.height()) / 2 + $(window).scrollTop(),
            'left': (document.body.clientWidth - upload_panel.width()) / 2 + $(window).scrollLeft()
        });

        $('#confirm_upload').click(uploadFiles);
    });

    // 点击输入框时，隐藏发帖心情列表
    $('#post_content').click(function() { $('#expression_list').remove(); });

    // 自动保存草稿
    setInterval(function() {
        var remained = options.autoSaveInterval;  // 剩余时间
        return function() {
            remained -= 10;
            if (remained === 0) {
                saveDraft();
                remained = options.autoSaveInterval;
            }
            $('#e_autosavecount').text(remained + ' 秒后自动保存草稿');
        }
    }(), 10000);    // 10s更改一次状态

    // 初始状态
    $('#e_autosavecount').text(options.autoSaveInterval + ' 秒后自动保存草稿');
    // 保存草稿
    $('#e_save').click(saveDraft);
    // 恢复数据
    $('#e_recover').click( function() {
        if ($('#post_content').val() === '' || confirm('此操作将覆盖当前帖子内容，确定要恢复数据吗？')) {
          $('#post_content').val(sessionStorage.getItem('cc98_editor_content'));
      }
    });

    // 提交
    $('#submit_post').click(submit);

    // 将所有上传文件加到帖子中
    $('#filenames').css('cursor', 'pointer').click(function() { $('.filename').click(); });


    // 打开回复时将鼠标焦点定到输入框
    $('#post_content').focus();
}


// 给引用加上查看原帖链接
function addQuoteURL(url, storey, quoteContent) {
    var insertIndex = quoteContent.indexOf('[/b]') + 4;
    var quoteURL = _cc98.formatURL(url, true).split('#')[0] + '#' + storey;
    return quoteContent.substring(0, insertIndex) + '  [url=' + quoteURL + '][color=' + options.rtColor + ']' + options.rtString +
        '[/color][/url]' + quoteContent.substring(insertIndex);
}

// 添加回复内容（这里的storey是1-9再到0,，不是从0开始的）
function addFastQuote(url, storey) {
    replyNum = storey + 48;
    if (!document.getElementById('reply'+replyNum)) return;

    showDialog();

    var replyurl = document.getElementById('reply'+replyNum).value;
    $.ajax({
        'url': replyurl,
        'success': function(html) {
            var quoteContent = _lib.unescapeHTML((/<textarea.*>([\s\S]*)<\/textarea>/ig).exec(html)[1]);

            if (options.viewOriginalPost) {
                quoteContent = addQuoteURL(url, storey, quoteContent);
            }

            $('#post_content').val( $('#post_content').val() + quoteContent);
        }
    });
}

// 多重引用
function addMultiQuote(url, storey) {
    showDialog();

    index = ((storey-1) >= 0) ? (storey-1) : 9;
    var post = _cc98.parseTopicPage()[index];

    if (!post) return;

    _cc98.getPostContent(url, storey, function(content) {
        quoteContent = '[quote][b]以下是引用[i]' + post.username.replace("匿名\d+", "匿名") + '在' + post.posttime + '[/i]的发言：[/b]\n'
            + content + '\n[/quote]\n';

        if (options.viewOriginalPost) {
                quoteContent = addQuoteURL(url, storey, quoteContent);
        }

        $('#post_content').val( $('#post_content').val() + quoteContent);
    });
}

// 给页面加上引用按钮
function addQuoteBtns() {
    // 插入引用按钮
    // 获取所有「引用」链接
    $('a[href*="reannounce.asp"]').each(function(index, ele) {
        link = $(this);

        // 如果是「答复」则跳过
        if (link.attr('href').indexOf('setfilter') > 0) return;

        // 如果在完整版中没有图片作为子节点，或者在简版中文字内容不是[引用]
        // 考虑到简版中纯文字的话还可能伪造[引用]链接，所以再加上对它父节点的判断
        if (link.children().first().attr('src') !== 'pic/reply.gif'
            && (link.text() !== '[引用]' || link.parent().get(0).className !== 'usernamedisp'))
            return;

        link.parent().append('<a href="javascript:void(0);" class="fastquote_btn"><img src="http://file.cc98.org/uploadfile/2010/4/11/2201680240.png"></a>')
            .append('<a href="javascript:void(0);" class="multiquote_btn"><img src="http://file.cc98.org/uploadfile/2010/5/12/9395977181.png"></a>')
    })

    $('.fastquote_btn').each(function (index, ele) {
        var storey = (index === 9) ? 0 : (index + 1);
        $(this).click(function() { addFastQuote(location.href, storey); });
    });

    $('.multiquote_btn').each(function (index, ele) {
        var storey = (index === 9) ? 0 : (index + 1);
        $(this).click(function() { addMultiQuote(location.href, storey); });
    });
}

// 处理各种键盘快捷键
function shortcutHandlers(evt) {
    // CTRL + M 打开弹出回复框
    if (evt.ctrlKey && evt.keyCode === 77) {
        showDialog();
    }

    // ESC 关闭回复框和上传框
    if (evt.keyCode === 27) {
        $('#reply_dialog').remove();
        $('#upload_panel').remove();
    }

    // CTRL + SHIFT + 0-9 快速引用
    if (evt.ctrlKey && evt.shiftKey && evt.keyCode >= 48 && evt.keyCode <= 57) {
        addFastQuote(location.href, evt.keyCode-48);
    }
}

// 处理提交事件，似乎keyup的话很可能按不到，所以特地分离出来
function submitShortcut(evt) {
    // CTRL + ENTER 提交回复
    if (evt.keyCode === 13 && evt.ctrlKey) {
        submit();
    }
}

addQuoteBtns();

// 绑定快捷键
$(document).keyup(shortcutHandlers);
$(document).keydown(submitShortcut);

_lib.addStyles(
    '#reply_dialog {' +
        'color: #222;' +
        'background-color: white;' +
        'font: 12px/1.4 ubuntu, "Lucida Grande", "Hiragino Sans GB W3", "Microsoft Yahei", sans-serif;' +
        'width: 650px;' +
        'position: absolute;' +
        'border: 5px solid transparent;' +
        'border-radius: 5px;' +
        'box-shadow: rgba(0, 0, 0, 0.4) 0 0 20px;' +
        'padding: 10px;' +
        'margin: 0 auto;' +
        'opacity: 1;' +
    '}' +
    '' +
    '#reply_dialog ul{' +
        'display: block;' +
        'list-style: none;' +
        'padding-left: 0;' +
        'margin: 0;' +
    '}' +
    '' +
    '.clearfix { clear: both; }' +
    '' +
  '.box_title {' +
        'cursor: move;' +
        'font-size: 16px;' +
        'line-height: 20px;' +
        'margin: 0 0 20px 0;' +
        'color: #6595D6;' +
        'text-align: left;' +
    '}' +
    '.close_btn {' +
        'cursor: pointer;' +
        'width: 20px;' +
        'height: 20px;' +
        'background: url("http://file.cc98.org/uploadfile/2013/8/7/1954562236.gif");' +
        'float: right;' +
    '}' +
    '.close_btn:hover { background-position: 0 -20px; }' +
    '' +
    '#reply_dialog #subject_line{' +
        'height: 20px;' +
        'margin: 10px 0;' +
    '}' +
    '#post_expression {' +
        'display: inline-block;' +
        'height: 15px;' +
        'width: 15px;' +
        'margin: 3px;' +
        'vertical-align: middle;' +
    '}' +
    '#post_subject {' +
        'margin-left: 5px;' +
        'width: 400px;' +
        'border: 1px solid #e0e0e0;' +
    '}' +
    '#post_subject:focus { outline: 1px solid #4A8CF7; }' +
    '' +
    '#editor {' +
        'margin: 0 auto;' +
        'border: 1px solid #9AC0E6;' +
        'overflow: auto;' +
    '}' +
    '' +
    '#e_control {' +
        'color: grey;' +
    '' +
        'background-color: #F1F4F8;' +
        'border-bottom: 1px solid #9AC0E6;' +
        'padding: 3px 3px 5px 3px;' +
    '}' +
    'img.e_ctrl_btn {' +
        'height: 16px;' +
        'width: 16px;' +
        'margin: 0 3px 0 0;' +
        'border: 0;' +
        'vertical-align: middle;' +
    '}' +
    '#add_attachments {' +
        'display: inline-block;' +
        'margin-left: 20px;' +
        'color: grey;' +
        'text-decoration: none;' +
        'vertical-align: middle' +
    '}' +
    '' +
    '#emot_panel {' +
        'position: absolute;' +
        'top: 0;' +
        'right: 680px;' +
        'width: 270px;  /* (20+3*2+1*2) * 9 + 8 + 5*2 */' +
        'opacity: 1;' +
        'background-color: #fff;' +
        'border: 5px solid transparent;' +
        'border-radius: 5px;' +
        'box-shadow: rgba(0, 0, 0, 0.4) 0 0 18px;' +
    '}' +
    '#emot_panel img {' +
        'cursor: pointer;' +
        'height: 20px;' +
        'width: 20px;' +
        'margin: 1px;' +
        'padding: 3px;' +
        'border: 1px solid #ccc;' +
    '}' +
    '#emot_panel img:hover {' +
        'border: 1px solid #f78639;' +
    '}' +
    '' +
    '#post_content {' +
        'border: 0;' +
        'height: 200px;' +
        'width: 100%;' +
        'padding: 5px;' +
        'box-sizing: border-box;' +
        '-moz-box-sizing: border-box;' +
        '-webkit-box-sizing: border-box;' +
    '' +
        'font: inherit;' +
        'overflow: auto;' +
        'resize: vertical;' +
        'word-wrap: break-word;' +
    '}' +
    '#post_content:focus { outline: 0px solid #9AC0E6; }' +
    '' +
    '#e_statusbar {' +
        'background-color: #f2f2f2;' +
        'border-top: 1px solid #9AC0E6;' +
    '' +
        'color: grey;' +
        'padding: 2px;' +
        'text-align: right;' +
    '}' +
    '#e_autosavecount {' +
        'display: inline-block;' +
        'padding-right: 20px;' +
    '}' +
    '#e_save, #e_recover {' +
        'text-decoration: none;' +
        'color: grey;' +
    '}' +
    '#e_tip {' +
        'width: 200px;' +
        'float: left;' +
        'text-align: left;' +
    '}' +
    '' +
    '' +
    '/* 一个对话框中的（末行）按钮区 */' +
    '.btn_bar {' +
        'margin: 10px 0 0 0;' +
        'width: 100%;' +
    '}' +
    '/* 标准按钮样式 */' +
    '.soda_button {' +
        'height: 20px;' +
        'width: 75px;' +
        'border: 0;' +
        'border-radius: 2px;' +
    '' +
        'cursor: pointer;' +
        'font: inherit;' +
        'color: #fff;' +
        'background-color: #6595D6;' +
        'padding: 0 0 1px; /* 用baseliner测试了一下，这样内部文字是居中的，不过我也不清楚为什么是这个数 */' +
    '}' +
    '#submitting_status {' +
        'display: inline-block;' +
        'padding-left: 20px;' +
        'text-align: left;' +
        'color: red;' +
    '' +
        'padding-bottom: 1px;  // 因为button中的文字也有1px的padding，因此，为了对齐，加了这一句' +
        'vertical-align: middle;' +
    '}' +
    '' +
    '' +
    '#attach_table {' +
        'display: none;' +
        'position:relative;' +
        'height:50px;' +
        'width: 100%;' +
        'margin-top: 10px;' +
    '' +
        'padding: 2px;' +
        'border-collapse: collapse;' +
        'overflow: visible;' +
        'text-align: left;' +
    '}' +
    '#attach_table th, #attach_table td { border: 1px solid #fff;}' +
    '#attach_table th {' +
        'color: #fff;' +
        'background-color: #6595D6;' +
        'background-image: none;' +
    '}' +
    '#attach_list > *:nth-child(even) { background-color:#ddd; }' +
    '#attach_list > *:nth-child(odd) { background-color:#eee; }' +
    '' +
    '.filename { color: #090; }' +
    '.uploadfail { color:#900; }' +
    '.uploadsuccess { color:#090; }' +
    '' +
    '#upload_panel {' +
        'position: absolute;' +
    '' +
        'border: 0px solid #ccc;' +
        'border-radius: 5px;' +
        'box-shadow: rgba(0, 0, 0, 0.4) 0 0 18px;' +
        'margin: 0 auto;' +
        'padding: 8px;' +
    '' +
        'color: #000;' +
        'background-color: #fff;' +
        'opacity: 0.8;' +
        'z-index: 200;' +
    '}' +
    '/* 上传面板的留白要比回复面板的留白稍小，故margin要覆盖定义 */' +
    '#upload_title { margin: 0 0 15px 0; }' +
    '/* 这个只是用来保证各浏览器的上传按钮宽度一样 */' +
    '#files { width: 250px; }' +
    '/* 垂直居中显示checkbox */' +
    '#image_autoshow {' +
        'margin: 0 2px 2px 0;' +
        'padding: 0;' +
        'vertical-align: middle;' +
    '}' +
    '#upload_msg {' +
        'color: red;' +
        'padding-left: 3px;' +
    '}' +
    '.fastquote_btn, .multiquote_btn {' +
        'display: inline-block;' +
        'vertical-align: middle;' +
        'margin: 0 5px;' +
    '}');


// 设置界面

});