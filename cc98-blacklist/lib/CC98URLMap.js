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

    var base_url = 'http://www.cc98.org/';

    var that = {};

    // 发米
    that.fami_url = function() {
        return base_url + 'master_users.asp?action=award';
    };

    // 上传
    that.upload_url = function(filename) {
        var ext = file.name.substring(file.name.lastIndexOf('.') + 1);
        var boardid = file2boardid[ext] || DEFAULT_UPLOAD_BOARDID;
        return base_url + 'saveannouce_upfile.asp?boardid=' + boardid;
    };

    // postURL 发新帖

    // 回复
    that.reply_url = function(boardid) {
        return base_url + 'SaveReAnnounce.asp?method=Topic&boardid=' + boardid;
    };

    // 编辑
    that.edit_url = function(boardid, id, replyid) {
        return base_url + 'SaveditAnnounce.asp?boardid=' + boardid + '&id=' + id + '&replyid=' + replyid;
    };

    // 站短
    that.send_message_url = function() {
        return base_url + 'messanger.asp?action=send';
    };

    // 登录
    that.login_url = function() {
        return base_url + 'login.asp';
    };

    // 草稿箱
    that.drafts_url = function(page_num) {
        return base_url + 'usersms.asp?action=outbox&page=' + page_num;
    };

    // 收件箱
    that.inbox_url = function(page_num) {
        return base_url + 'usersms.asp?action=inbox&page=' + page_num;
    };

    // 已发送
    that.sent_url = function(page_num) {
        return base_url + 'usersms.asp?action=issend&page=' + page_num;
    };

    // 删除站短
    that.delete_message_url = function() {
        return base_url + 'messanger.asp';
    };

    var chaos = require('chaos');

    // 各种判断用的函数
    that.isTopicList = function(url) {
        return chaos.parseURL(url).path === 'list.asp';
    };

    that.isPostList = function(url) {
        return chaos.parseURL(url).path === 'dispbbs.asp';
    };

    that.isXinlin = function(url) {
        return chaos.parseQS(url).boardid === '182';
    };

    module.exports = that;
});
