define('options', function(exports, module) {
    // 用户实际存下来的 options 数据
    var options = {};
    // 默认选项
    var DEFAULT_OPTIONS = {
        "blocked_users": {
            "description": "屏蔽列表",
            "value": []
        }
    };

    var Options = {}; // 用于操作 options 数据的对象

    Options.save = function() {
        localStorage.setItem('enhancer_options', JSON.stringify(options));
    }

    Options.restore = function() {
        var options = JSON.parse(localStorage.getItem('enhancer_options')) || {};

        // 如果新增了默认配置项，则加入到原配置中
        for (var prop in DEFAULT_OPTIONS) {
            if (options[prop] === undefined) {
                options[prop] = DEFAULT_OPTIONS[prop];
            }
        }
        Options.save(options);

        return options;
    }

    Options.get = function(key) {
        return options[key].value;
    }

    Options.set = function(key, value) {
        options[key].value = value;
        Options.save();
    }

    Options.delete = function(key) {
        delete options[key].value;
        Options.save();
    }

    // 覆盖整个页面的遮罩层、绝对定位的选项卡（50%~80% width）
    // 点确认/取消隐藏界面
    Options.show = function() {
        console.log('options.show');
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
            if (Array.isArray(Options.get(key))) {
                for (var i = 0; i !== Options.get(key).length; ++i) {
                    var item = $('<span class="array-item">' + Options.get(key)[i] + '<a class="delete-item"></a></span>');
                    dd.append(item);
                }
                dd.append('<input type="text" class="new-item">').append('<a class="add-item"></a>');
            }
            dl.append(dt).append(dd);
            div.append(dl);
        }
        div.append('<div><button class="enhancer-btn" id="submit-options">确定</button></div>');
        $('body').append(div);

        div.hide();

        div.on('click', '.delete-item', function(e) {
            var item = $(this).parent();
            var key = item.parent().prev().data('key');
            var array = Options.get(key);
            var value = item.text();

            array.splice(array.indexOf(value), 1);
            Options.set(key, array);

            item.remove();
        });
        $('.add-item').click(function(e) {
            var item = $(this).prev()
            var value = item.prop('value');
            if (!value) {
                return;
            }

            var dd = item.parent();
            var key = dd.prev().data('key');
            var array = Options.get(key);

            if (array.indexOf(value) !== -1) {
                return;
            }
            array.push(value);
            Options.set(key, array);

            item.prop('value', '');
            item.before('<span class="array-item">' + value + '<a class="delete-item"></a></span>');
        });

        $('#submit-options').click(function(e) {
            div.hide();
        });

        (unsafeWindow ? unsafeWindow : window).manage2 += '<br><a id="show-enhancer-options" href="javascript:;">cc98 enhancer 选项</a>';
        $('#menuDiv').on('click', '#show-enhancer-options', function() {
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
            '    border-radius: 10px;',
            '    box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);',
            '    padding: 10px 20px;',
            '    background-color: #fff;',
            '}',
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

    Options.init = function() {
        options = Options.restore();
    }

    Options.init();
    module.exports = Options;
});
