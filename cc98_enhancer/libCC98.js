// @require chaos.js

// shim (for Chrome)
if (!XMLHttpRequest.prototype.sendAsBinary) {
    XMLHttpRequest.prototype.sendAsBinary = function (datastr) {
        function byteValue(x) {
            return x.charCodeAt(0) & 0xff;
        }
        var ords = Array.prototype.map.call(datastr, byteValue);
        var ui8a = new Uint8Array(ords);
        this.send(ui8a);
    };
}

// 从 cookie 中获取
var userInfo;

var CC98URLMap = (function() {})(
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

    var baseURL = 'http://www.cc98.org/';

    // 以下用于 POST
    // famiURL 发米
    // uploadURL 上传
    // postURL 发新帖
    // replyURL 回复
    // editURL 编辑
    // pmURL 站短
    // loginURL 登录

);

var libCC98 = (function() {

    var that = {};

    // 发米/扣米
    // @param {string}      opts.url 帖子地址
    // @param {Number}      opts.announceid 回帖ID
    // @param {Number}      opts.amount 发米/扣米数量[0-1000]
    // @param {string}      opts.reason 发米理由
    // @param {boolean}     opts.ismsg  站短/不站短
    // @param {boolean}     [opts.awardtype=true] 是否发米
    // @param {function(responseText)} [opts.callback=function(){}] 回调函数
    that.fami = function(opts) {
        opts.callback = opts.callback || (function() {});
        opts.awardtype = opts.awardtype || (opts.awardtype === undefined);

        var params = chaos.parseQS(opts['url']);
        var boardid = params['boardid'];
        var topicid = params['id'];

        chaos.ajax({
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
    };

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
    that.reply = function(opts) {
        var params = chaos.parseQS(opts["url"]);
        var postURL = REPLY_URL + "&boardid=" + params["boardid"];
        if (opts["edit"]) {
            postURL = EDIT_URL + "boardid=" + params["boardid"] + "&replyid=" + opts["replyid"] + "&id=" + params["id"];
        }

        if (!opts.password) {
            opts.password = chaos.parseQS(chaos.parseCookies(document.cookie)['aspsky'])['password'];
        }
        if (!opts.username) {
            opts.username = chaos.parseQS(chaos.parseCookies(document.cookie)['aspsky'])['username'];
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

        chaos.ajax({
            'type': 'POST',
            'url': postURL,
            'data': data,
            'success': opts['callback']
        });
    };

    // 站短
    // @param {string}  opts.recipient 收件人
    // @param {string}  opts.subject 站短标题
    // @param {string}  opts.message 站短内容
    // @param {function(responseText)} [opts.callback=function(){}] 回调函数
    that.sendPM = function(opts) {
        chaos.ajax({
            "type": "POST",
            "url": PM_URL,
            "data": {
                "touser": opts["recipient"],
                "title": opts["subject"],
                "message": opts["message"]
            },
            "success": opts["callback"]
        });
    };

    that.upload = function(file, callback) {
        var reader = new FileReader();

        var ext = file.name.substring(file.name.lastIndexOf('.') + 1);    // 文件扩展名
        var boardid = file2boardid[ext] || DEFAULT_UPLOAD_BOARDID;
        var url = 'http://www.cc98.org/saveannouce_upfile.asp?boardid=' + boardid;

        reader.onload = function(e) {
            var boundary = '----------------';
            boundary += parseInt(Math.random()*98989898+1, 10);
            boundary += parseInt(Math.random()*98989898+1, 10);

            var data = [boundary,'\r\n',
                'Content-Disposition: form-data; name="act"\r\n\r\nupload',
                '\r\n',boundary,'\r\n',
                'Content-Disposition: form-data; name="fname"\r\n\r\n',chaos.toUnicode(file.name),
                '\r\n',boundary,'\r\n',
                'Content-Disposition: form-data; name="file1"; filename="',chaos.toUnicode(file.name),'"\r\n',
                'Content-Type: ',file.type,'\r\n\r\n',
                e.target.result,
                '\r\n',boundary,'\r\n',
                'Content-Disposition: form-data; name="Submit"\r\n\r\n\xc9\xcf\xb4\xab',  // 上传
                '\r\n',boundary,'--\r\n'].join('');

            chaos.ajax({
                'type': 'POST',
                'url': url,
                'contentType': 'multipart/form-data; boundary='+boundary,
                'data': data,
                'success': callback
            });

        };

        reader.readAsBinaryString(file);
    };

    // 回帖内容如果要从html转成ubb的话太麻烦，但是没有执行js的rawhtml里有包含ubb代码
    // 所以为了方便起见，把获取帖子内容的功能独立出来，为它再开一个ajax请求
    // @param {string} url 网址
    // @param {Number} storey 楼层[1-9,0]
    // @param {function(postContent)) callback 回调函数
    that.getPostContent = function(url, index, callback) {
        chaos.ajax({
            'type': 'GET',
            'url': url,
            'success': function(rawhtml) {
                var result;

                POST_RE.lastIndex = 0;  // reinitialize the regexp
                for (var i = 0; i !== index; ++i) {
                    POST_RE.exec(rawhtml);
                }
                result = POST_RE.exec(rawhtml)[1] || '';
                result = result
                    .replace(REPLYVIEW_RE, '')
                    .replace(/<br>/ig, '\n');
                callback(chaos.unescapeHTML(result));
            }
        });
    };

    // 获取页面中的用户列表，回帖时间回帖ID
    // @return {Array}  每个数组元素都有username, annouceid, posttime三个属性
    that.parseTopicPage = function(htmlText) {
        if (!htmlText) { htmlText = document.body.innerHTML; }
        var postList = [];
        
        var nameArr = htmlText.match(NAME_RE);
        nameArr.forEach(function(name) {
            var post = {};
            post['username'] = name.replace(NAME_RE, '$1');
            postList.push(post);
        });

        var idArr = htmlText.match(ANNOUNCEID_RE);
        // 考虑到心灵没有announceid，所以idArr可能为空
        if (idArr) {
            idArr.forEach(function(id, index) {
                postList[index]['announceid'] = id.replace(ANNOUNCEID_RE, '$1');
            });
        }

        var timeArr = htmlText.match(POST_TIME_RE);
        if (timeArr) {
            timeArr.forEach(function(t, index) {
                postList[index]['posttime'] = t.replace(POST_TIME_RE, '$1');
            });
        }

        return postList;
    };

    that.postCount = function(htmlText) {
        if (!htmlText) { htmlText = document.body.innerHTML; }
        return parseInt(htmlText.match(POST_COUNT_RE)[0].replace(POST_COUNT_RE, '$1'), 10);
    };

    that.pageCount = function(htmlText) {
        return Math.ceil(_cc98.postCount(htmlText) / 10);
    };

    // 格式化网址，去除无用的参数并转为相对链接
    // @param {string}  url 要格式化的网址
    // @param {boolean} maxPageFix 是否修正url中star参数的值，使其不超过当前最后页的实际值
    that.formatURL = function(url, maxPageFix) {
        var urlObj = chaos.parseURL(url);

        // 不在www.cc98.org域名下
        if (urlObj['host'] !== 'www.cc98.org') {
            return url;
        }

        // http://www.cc98.org/
        if (!urlObj['path']) {
            return '/';
        }

        var params = chaos.parseQS(urlObj['query']);
        var hash = urlObj['hash'] ? ('#' + urlObj['hash']) : '';

        // 不是dispbbs.asp开头的链接，只去掉空的get参数，转为相对链接，不做其他处理
        if (urlObj['path'] === 'dispbbs,asp') {
            return '/' + urlObj['path'] + '?' + chaos.toQS(params) + hash;
        }

        // 如果不是在追踪页面，就去掉replyid
        if (!params['trace']) {
            params['replyid'] = '';
        }
        params['page'] = '';    // 去掉page

        // 
        if (params['star'] && maxPageFix && parseInt(params['star'], 10) > _cc98.pageCount()) {
            params['star'] = _cc98.pageCount();
        }

        params['star'] = (params['star'] && params['star'] !== '1') ? params['star'] : '';    // star=1时去掉
        if (params['searchdate'] === 'all') { params['searchdate'] = 'ALL' };
        return '/' + urlObj['path'] + '?' + chaos.toQS(params) + hash;
    };

    that.currentPage = function() {
        return parseInt(/<span title="跳转到第\s*(\d+)\s*页/ig.exec(document.body.innerHTML)[1], 10);
    };

    return that;
})();