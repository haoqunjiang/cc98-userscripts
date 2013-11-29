define('CC98URLMap', function(exports, module) {
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

    var that = {};

    // 发米
    that.famiURL = function() {
        return 'http://www.cc98.org/master_users.asp?action=award';
    }

    // 上传
    that.uploadURL = function(filename) {
        var ext = file.name.substring(file.name.lastIndexOf('.') + 1);
        var boardid = file2boardid[ext] || DEFAULT_UPLOAD_BOARDID;
        return 'http://www.cc98.org/saveannouce_upfile.asp?boardid=' + boardid;
    }

    // postURL 发新帖

    // 回复
    that.replyURL = function(boardid) {
        return 'http://www.cc98.org/SaveReAnnounce.asp?method=Topic&boardid=' + boardid;
    }

    // 编辑
    that.editURL = function(boardid, id, replyid) {
        return 'http://www.cc98.org/SaveditAnnounce.asp?boardid=' + boardid + '&id=' + id + '&replyid=' + replyid;
    }

    // 站短
    that.pmURL = function() {
        return 'http://www.cc98.org/messanger.asp?action=send';
    }

    // 登录
    that.loginURL = function() {
        return 'http://www.cc98.org/login.asp';
    }

    module.exports = that;

});