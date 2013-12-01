define('options', function(exports, module) {
    // 用户实际存下来的 options 数据
    var options = {};
    // 默认选项
    var DEFAULT_OPTIONS = {
        "blocked_users": {
            "description": "屏蔽列表",
            "value": ["竹林来客", "燕北飞", "cft", "cone", "Uglyzjuer", "波塞冬"]
        }
    };

    var Options = {}; // 用于操作 options 数据的对象

    Options.save = function(options) {
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

        (unsafeWindow ? unsafeWindow : window).manage2 += '<br><a id="enhancer-options" href="javascript:void(0)">cc98 enhancer 选项</a>';
        $('#menuDiv').on('click', '#enhancer-options', function() {});

    }

    Options.init = function() {
        options = Options.restore();
    }

    Options.init();
    module.exports = Options;
});
