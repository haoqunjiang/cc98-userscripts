define('options', function(exports, module) {
    // 用户实际存下来的 options 数据
    var options = {};
    // 默认选项
    var DEFAULT_OPTIONS = {
        "ignored_users": {
            "description": "屏蔽用户名单",
            "value": []
        }
    };

    var save = function(the_options) {
        localStorage.setItem('enhancer_options', JSON.stringify(the_options || options));
    };

    var restore = function(the_options) {
        options = the_options || JSON.parse(localStorage.getItem('enhancer_options')) || {};

        // 如果新增了默认配置项，则加入到原配置中
        for (var prop in DEFAULT_OPTIONS) {
            if (options[prop] === undefined) {
                options[prop] = DEFAULT_OPTIONS[prop];
            }
        }

        // 屏蔽名单字段名从 blocked_users 改成了 ignored_users
        // 为了保持兼容……（虽然上一个版本可能只有丁丁姐在用）
        if (options['blocked_users']) {
            options['ignored_users'] = options['ignored_users'];
            delete options['blocked_users'];
        }
        save();
    };

    var get = function(key) {
        return options[key].value;
    };

    var set = function(key, value) {
        options[key].value = value;
        save();
    };

    var remove = function(key) {
        delete options[key].value;
        save();
    };

    var upload = function() {
        var libcc98 = require('libcc98');
        return libcc98.getDraftID('[enhancer选项]')
            .then(libcc98.deleteDraft)
            .then(libcc98.deleteTrash)
            .always(function() {
                libcc98.saveDraft({
                    'recipient': libcc98.user_info.username,
                    'subject': '[enhancer选项]',
                    'message': JSON.stringify(options)
                });
            });
    };

    var download = function() {
        var libcc98 = require('libcc98');
        return libcc98.getDraft('[enhancer选项]')
            .then(function(pm) {
                restore(JSON.parse(pm.message));
            });
    };

    // 覆盖整个页面的遮罩层、绝对定位的选项卡（50%~80% width）
    // 点确认/取消隐藏界面
    var addButton = function() {
        console.log('options.addButton');
        var $ = require('jQuery');
        var chaos = require('chaos');

        // 先生成对应 DOM 结构，然后在鼠标点击时显示/隐藏该 div
        var div = $('<div id="enhancer-options"></div>');
        var dl = $('<dl></dl>');

        for (var key in options) {
            var dt = $('<dt>' + options[key]['description'] + '</dt>');
            dt.data('key', key);

            var dd = $('<dd></dd>');
            // 如果是数组，则依次展现数组元素
            if (Array.isArray(get(key))) {
                for (var i = 0; i !== get(key).length; ++i) {
                    var item = $('<span class="array-item">' + get(key)[i] + '<a class="delete-item"></a></span>');
                    dd.append(item);
                }
                dd.append('<input type="text" class="new-item">').append('<a class="add-item"></a>');
            }
            dl.append(dt).append(dd);
            div.append(dl);
        }
        div.append(
            ['<div><button class="enhancer-btn" id="submit-options">确定</button>',
                '<button class="enhancer-btn" id="upload-options">上传设置</button>',
                '<button class="enhancer-btn" id="download-options">下载设置</button>',
                '</div>'
            ].join('\n'));
        $('body').append(div);

        div.hide();

        div.on('click', '.delete-item', function(e) {
            var item = $(this).parent();
            var key = item.parent().prev().data('key');
            var array = get(key);
            var value = item.text();

            array.splice(array.indexOf(value), 1);
            set(key, array);

            item.remove();
        });
        $('.add-item').click(function(e) {
            var item = $(this).prev()
            var value = item.prop('value').trim();
            if (!value) {
                return;
            }

            var dd = item.parent();
            var key = dd.prev().data('key');
            var array = get(key);

            if (array.indexOf(value) !== -1) {
                return;
            }
            array.push(value);
            set(key, array);

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
        $('<a id="show-enhancer-options" href="javascript:;">enhancer选项</a>')
            .appendTo($('.TopLighNav1').children().children().eq(0))
            .before('<img align="absmiddle" src="pic/navspacer.gif"> ')
            .on('click', function() {
                div.show();
            });

        chaos.addStyles([
            '#enhancer-options {',
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
            '#enhancer-options dl { margin: 0; }',
            '#enhancer-options dt, #enhancer-options dd {',
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
    }

    init = function() {
        restore();
    }

    init();
    var that = {};
    that.save = save;
    that.restore = restore;
    that.get = get;
    that.set = set;
    that.remove = remove;
    that.addButton = addButton;
    that.init = init;
    module.exports = that;
});
