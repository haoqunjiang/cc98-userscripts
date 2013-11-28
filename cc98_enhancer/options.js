define('Options', function(exports, module) {
    // 用户实际存下来的 Options 数据
    var options = {};
    // 默认选项
    var DEFAULT_OPTIONS = {
        /*
        "autoSaveInterval": 30,           // 自动保存间隔(秒)，必须是10的倍数

        "promptString": '>>查看原帖<<',   // 原帖链接的提示文字
        "promptColor": 'royalblue',       //「查看原帖」的颜色

        "replyTail": "",                  // 小尾巴
        "defaultReplyContent": '\n',      // 文本框为空时的默认回复内容

        "useRelativeURL": true,           // 使用相对链接
        "disableInXinlin": false,         // 在心灵禁用这些设置
        "showFastReplyButton": true,      // 显示快速回复按钮
        "alwaysShowEmotions": false,      // 始终显示表情菜单
        "modifierKey": "alt",             // 快速回复快捷键组合的modifier key
        "hotKeyCode": 82,                 // 快速回复快捷键组合中字母的keyCode
        */

        "blocked_users": ["竹林来客", "燕北飞", "cft", "cone", "Uglyzjuer"],
    };

    var Options = {};   // 用于操作 options 数据的对象

    Options.save = function(options) {
        localStorage.setItem('enhancer_options', JSON.stringify(options));
    }

    Options.restore = function() {
        var options = JSON.parse(localStorage.getItem('enhancer_options')) || {};

        // 如果新增了默认配置项，则加入到原配置中
        for (var prop in DEFAULT_OPTIONS) {
            if (options[prop] === undefined) {
                options[prop] = DEFAULT_Options[prop];
            }
        }
        Options.save(options);

        return options;
    }

    Options.get = function(key) {
        return options[key];
    }

    Options.set = function

    Options.show = function() {
        // 覆盖整个页面的遮罩层、绝对定位的选项卡（50%~80% width）
        // 点确认/取消隐藏界面
    }

    Options.init = function() {
        var options = Options.restore();

        (unsafeWindow ? unsafeWindow : window).manage2 += '<br><a id="enhancer-options" href="javascript:void(0)">cc98 enhancer 选项</a>';
        $('#menuDiv').on('click', '#enhancer-options', showOptionsManager);
    }

    module.exports = Options;
});