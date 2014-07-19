// 有空改成 MVC 的
define('options', function(exports, module) {
    // 用户实际存下来的 options 数据
    var user_options = {};

    // 默认选项
    // 展示时先 sort_by_category 然后再按 category 分别显示
    var DEFAULT_OPTIONS = {
        /*
        "font-family": {
            "category": "界面",
            "description": "默认字体",
            "value": "Microsoft Yahei",
            "hint": "98 界面的默认字体，不同的字体用逗号分隔，排在前面的优先"
        },
        "font-size": {
            "category": "界面",
            "description": "字体大小",
            "value": "12px",
            "hint": "默认字体大小，预设是 12px"
        },
        "line-height": {
            "category": "界面",
            "description": "行间距",
            "value": "21px",
            "hint": "98 默认行间距为 1.1 倍，脚本预设为 21px 以提高可读性"
        },*/
        "ignored_users": {
            "category": "界面",
            "description": "屏蔽列表",
            "value": [],
            "hint": "被屏蔽用户发表的主题和回复将不会显示"
        }
        /*,
        "block_qmd": {
            "category": "界面",
            "description": "屏蔽用户签名档",
            "value": false
        }*/
    };

    // 上传设置，保存时默认即上传了，故不对外界暴露
    function upload() {
        var libcc98 = require('libcc98');
        return libcc98.getDraftID('[cc98 blacklist settings]')
            .then(libcc98.deleteDraft)
            .then(libcc98.deleteTrash)
            .always(function() {
                libcc98.saveDraft({
                    'recipient': libcc98.user_info.username,
                    'subject': '[cc98 blacklist settings]',
                    'message': JSON.stringify(user_options)
                });
            });
    }

    // 下载设置
    function download() {
        var libcc98 = require('libcc98');
        return libcc98.getDraft('[cc98 blacklist settings]')
            .then(function(pm) {
                user_options = JSON.parse(pm.message);
            }).reject(function() {
                load();
            });
    }

    // 保存并上传设置
    function save() {
        localStorage.setItem('cc98-blacklist-settings', JSON.stringify(user_options));
        upload();
    }

    // 从本地载入用户设置
    function load() {
        user_options = JSON.parse(localStorage.getItem('cc98-blacklist-settings')) || {};

        // 如果新增了默认配置项，则加入到原配置中
        for (var prop in DEFAULT_OPTIONS) {
            if (user_options[prop] === undefined) {
                user_options[prop] = DEFAULT_OPTIONS[prop];
            }
        }

        // 默认不保存，免得和云端的冲突，反正是默认配置，保不保存也没区别
    }

    function setValue(key, value) {
        user_options[key].value = value;
        save();
    }

    function getProperty(key, property) {
        return user_options[key][property];
    }


    function init() {
        load();
        // blahblah
    }

    // 点确认/取消隐藏界面
    var addButton = function() {
        var $ = require('jQuery');
        var chaos = require('chaos');

        // 先生成对应 DOM 结构，然后在鼠标点击时显示/隐藏该 div
        var div = $('<div id="blacklist-options"></div>');
        var dl = $('<dl></dl>');

        for (var key in user_options) {
            var dt = $('<dt>' + user_options[key].description + '</dt>');
            dt.data('key', key);

            var dd = $('<dd></dd>');
            // 如果是数组，则依次展现数组元素
            if (Array.isArray(getProperty(key, 'value'))) {
                for (var i = 0; i !== getProperty(key, 'value').length; ++i) {
                    var item = $('<span class="array-item">' + getProperty(key, 'value')[i] + '<a class="delete-item"></a></span>');
                    dd.append(item);
                }
                dd.append('<input type="text" class="new-item">').append('<a class="add-item"></a>');
            }
            dl.append(dt).append(dd);
            div.append(dl);
        }
        div.append(
            ['<br><div><button class="blacklist-btn" id="submit-options">确定</button>',
                '<button class="blacklist-btn" id="upload-options">上传设置</button>',
                '<button class="blacklist-btn" id="download-options">下载设置</button>',
                '</div>'
            ].join('\n'));
        $('body').append(div);

        div.hide();

        div.on('click', '.delete-item', function(e) {
            var item = $(this).parent();
            var key = item.parent().prev().data('key');
            var array = getProperty(key, 'value');
            var value = item.text();

            array.splice(array.indexOf(value), 1);
            setValue(key, array);

            item.remove();
        });
        $('.add-item').click(function(e) {
            var item = $(this).prev();
            var value = item.prop('value').trim();
            if (!value) {
                return;
            }

            var dd = item.parent();
            var key = dd.prev().data('key');
            var array = getProperty(key, 'value');

            if (array.indexOf(value) !== -1) {
                return;
            }
            array.push(value);
            setValue(key, array);

            item.prop('value', '');
            item.before('<span class="array-item">' + value + '<a class="delete-item"></a></span>');
        });
        $('.new-item').keyup(function(e) {
            if (e.keyCode === 13) {
                $(this).next().click();
            }
        });

        $('#submit-options').click(function(e) {
            div.hide();
        });

        $('#upload-options').click(function() {
            upload()
                .then(function() {
                    alert('上传成功');
                }, function() {
                    alert('上传失败');
                });
        });
        $('#download-options').click(function() {
            download()
                .then(function() {
                    alert('下载成功，刷新页面后生效');
                }, function() {
                    alert('下载失败');
                });
        });

        // 添加按钮
        $('<a id="show-blacklist-options" href="javascript:;">黑名单</a>')
            .appendTo($('.TopLighNav1').children().children().eq(0))
            .before('<img align="absmiddle" src="pic/navspacer.gif"> ')
            .on('click', function() {
                div.show();
            });

        chaos.addStyles([
            '#blacklist-options {',
            '    position: absolute;',
            '    top: 150px;',
            '    left: 15%;',
            '    width: 70%;',
            '    margin: 0 auto;',
            '    border: 1px solid #ccc;',
            '    border-radius: 5px;',
            '    box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);',
            '    padding: 20px;',
            '    background-color: #fff;',
            '}',
            '#blacklist-options dl { margin: 0; }',
            '#blacklist-options dt, #blacklist-options dd {',
            '    display: inline-block;',
            '    padding-top: 0;',
            '    color: #333;',
            '    font-size: 14px;',
            '}',
            '.array-item {',
            '    border: 0 none;',
            '    border-radius: 3px;',
            '    background-color: #ddd;',
            '    box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.25);',
            '    padding: 0 5px;',
            '    display: inline-block;',
            '    margin-left: 30px;',
            '}',
            '.add-item, .delete-item {',
            '    display: inline-block;',
            '    vertical-align: middle;',
            '    width: 16px;',
            '    height: 16px;',
            '    cursor: pointer;',
            '}',
            '.delete-item {',
            '    margin-left: 4px;',
            '    background-image: url(http://file.cc98.org/uploadfile/2013/12/2/2101869387.png);',
            '}',
            '.add-item {',
            '    margin-left: 30px;',
            '    background-image: url(http://file.cc98.org/uploadfile/2013/12/2/2101873264.png);',
            '}',
            '.new-item {',
            '    margin-left: 30px;',
            '    width: 80px;',
            '}',
        ].join('\n'));
    };

    init();

    var that = {};
    that.save = save;
    that.load = load;
    that.download = download;
    that.getProperty = getProperty;
    that.setValue = setValue;
    that.addButton = addButton;

    module.exports = that;
});
