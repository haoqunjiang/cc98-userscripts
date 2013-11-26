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

function saveOptions(options) {
    localStorage.setItem('enhancer_options', JSON.stringify(options));
}

function restoreOptions() {
    var options = JSON.parse(localStorage.getItem('enhancer_options')) || {};

    for (var prop in DEFAULT_OPTIONS) {
        if (options[prop] === undefined) {
            options[prop] = DEFAULT_OPTIONS[prop];
        }
    }
    storeOptions(options);

    return options;
}

// 显示选项管理界面
function showOptionsManager() {
}
