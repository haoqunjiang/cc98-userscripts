// ==UserScript==
// @id             cc98_fami
// @name           cc98 fami
// @version        1.1
// @namespace      soda@cc98.org
// @author         soda <sodazju@gmail.com>
// @description    cc98 发米/扣米机
// @include        http://www.cc98.org/dispbbs.asp*
// @require        http://file.cc98.org/uploadfile/2013/7/7/1444331657.txt
// @require        http://file.cc98.org/uploadfile/2013/7/25/3585128322.txt
// @run-at         document-end
// ==/UserScript==

$(function() {
    // 添加CSS
    function addStyles(css) {
        var head = document.getElementsByTagName("head")[0];
        var style = document.createElement("style");

        style.setAttribute("type", "text/css");
        style.innerHTML = css;
        head.appendChild(style);
    };

    // 在发米选项界面里显示提示信息
    function famiPrompt(msg) {
        $('#fami-prompt').text(msg);
    }

    function view() {
        var adminOptions = $('#previewfrm').prev().children().children().children();
        adminOptions.append('<a href="javascript:;" title="使用发米机" id="fami-btn">发米</a>');
        adminOptions.append(" | ");
        $('#fami-btn').click(showOptions);
    }

    function showOptions() {
        // 遮罩层
        $('body').append('<div id="mask"></div>');
        $('#mask').css({
            "position": "fixed",
            "left": "0",
            "top": "0",
            "width": "100%",
            "height": "100%",
            "z-index": "100%",
            "opacity": "0.75",
            "background-color": "#222",
            "background-repeat": "repeat"
        });
        // 选项界面
        $('body').append(
            '<div id="fami-opts">\n\
              <table>\n\
                <thead>\n\
                  <tr><th colspan="3">选项</th></tr>\n\
                </thead>\n\
                <tbody>\n\
                  <tr>\n\
                    <td><label for="reason">理由</label></td>\n\
                    <td><input type="text" name="reason" id="reason" placeholder="请输入发米/扣米理由"></td>\n\
                    <td><input type="checkbox" name="ismsg" id="ismsg" value="ismsg" checked="true"><label for="ismsg">站短</label></td>\n\
                  </tr>\n\
                  <tr>\n\
                    <td><label for="amount">金钱</label></td>\n\
                    <td><input type="number" name="amount" id="amount" min="0" max="1000" value="1000"></td>\n\
                    <td><input type="checkbox" name="amount" id="random-amount" value="random"><label for="random-amount">随机</label></td>\n\
                  </tr>\n\
                  <tr>\n\
                    <td><label for="times">次数</label></td>\n\
                    <td><input type="number" name="times" id="times" min="1" value="1">次</td>\n\
                    <td><input type="checkbox" name="times" id="nolimit-times" value="nolimit-times"><label for="nolimit-times">不限</label></td>\n\
                  </tr>\n\
                  <tr>\n\
                    <td><label>开始</label></td>\n\
                    <td>\n\
                      <input type="number" name="begin-page" id="begin-page" min="1" max="32767" value="1">页\n\
                      第<input type="number" name="begin-storey" id="begin-storey" min="1" max="10" value="1">楼\n\
                    </td>\n\
                  </tr>\n\
                  <tr>\n\
                    <td><label>结束</label></td>\n\
                    <td>\n\
                      <input type="number" name="end-page" id="end-page" min="1" max="32767" value="32767">页\n\
                      第<input type="number" name="end-storey" id="end-storey" min="1" max="10" value="10">楼\n\
                    </td>\n\
                  </tr>\n\
                  <tr>\n\
                    <td colspan="2">\n\
                      <input type="radio" name="awardtype" id="award" value="award" checked="true"><label for="award">发米</label>\n\
                      <input type="radio" name="awardtype" id="punish" value="punish"><label for="punish">扣米</label>\n\
                    </td>\n\
                  </tr>\n\
                  <tr>\n\
                    <td colspan="3"><span id="fami-prompt" style="color: red"></span></td>\n\
                  </tr>\n\
                  <tr>\n\
                    <td colspan="3"><input type="button" id="start-fami" value="开始"></td>\n\
                  </tr>\n\
                </tbody>\n\
              </table>\n\
            </div>)'
        );
        addStyles(
            '#fami-opts {\n\
              position: fixed;\n\
              left: 35%;\n\
              top: 20%;\n\
              z-index: 9999;\n\
              background: white;\n\
              opacity: 0.8;\n\
              border-radius: 5px;\n\
              padding: 5px;\n\
            }\n\
            #fami-opts th {\n\
                background: #6595D6;\n\
                font-size: 14px;\n\
            }\n\
            #fami-opts label {\n\
              padding-right: 5px;\n\
            }\n\
            #fami-opts td, #fami-opts input {\n\
              max-width: 200px;\n\
            }\n\
            #begin-page, #end-page {\n\
              width: 75px;\n\
            }\n\
            #begin-storey, #end-storey, #times {\n\
              width: 40px;\n\
            }\n\
            #start-fami {\n\
              float: right;\n\
            }'
        );

        // 把默认的开始页数改为本页
        $('#begin-page').val(helper.parseQS(window.location.search)['star']);

        // 居中显示选项界面
        $(window).resize(function(){
            $('#fami-opts').css({
                "left": (document.body.clientWidth - document.getElementById('fami-opts').clientWidth) / 2,
                "top": (document.body.clientHeight - document.getElementById('fami-opts').clientHeight) / 2
            });
        });
        $(window).resize();

        // 点击页面空白区域关闭选项界面
        $('#mask').click(function() {
            // 首先检查是否正在发米，如果是的话就不作任何处理
            if (sessionStorage.getItem('fami')) {
                return;
            }
            // 否则清除遮罩层和选项界面
            $('#mask').remove();
            $('#fami-opts').remove();
        });

        // 复选框被勾上时，对应的输入框禁用
        $('#random-amount').click(function() {
            $('#amount').prop('disabled', this.checked);
        });
        $('#nolimit-times').click(function() {
            $('#times').prop('disabled', this.checked);
        });

        // 开始发米
        $('#start-fami').click(checkOptions);
    }

    // check and store the options into sessionStorage
    function checkOptions() {
        var reason, ismsg, amount, times, begin, end, isaward;

        // 清空上次留下来的提示
        famiPrompt('');

        isaward = $('input[name="awardtype"]:checked').val();
        if (isaward === "award") {
            isaward = true;
        } else {
            isaward = false;
        }

        var type = isaward ? '发米' : '扣米';
        
        reason = $('#reason').val();
        if (!reason) {
            famiPrompt(type + '理由不能为空');
            return;
        }

        ismsg = $('#ismsg').prop('checked');

        if ($('#random-amount').prop('checked')) {
            amount = 'random';
        } else if ($('#amount').val().match(/^(1000|\d{1,3})$/g)) {
            amount = parseInt($('#amount').val());
        } else {
            famiPrompt(type + '数量必须为0-1000之间的整数');
            return;
        }

        if ($('#nolimit-times').prop('checked')) {
            times = 'nolimit';
        } else if ($('#times').val().match(/^\d+$/g)) {
            times = parseInt($('#times').val());
        } else {
            famiPrompt(type + '次数必须为正整数');
            return;
        }

        if ($('#begin-page').val().match(/^\d+$/g)) {
            begin = (parseInt($('#begin-page').val()) - 1) * 10;
        } else {
            famiPrompt('页数必须为正整数');
            return;
        }
        if ($('#begin-storey').val().match(/^(10|[0-9])$/g)) {
            begin += parseInt($('#begin-storey').val());
        } else {
            famiPrompt('楼层必须为1-10之间的整数');
            return;
        }

        if ($('#end-page').val().match(/^\d+$/g)) {
            end = (parseInt($('#end-page').val()) - 1) * 10;
        } else {
            famiPrompt('页数必须为正整数');
            return;
        }
        if ($('#end-storey').val().match(/^(10|[0-9])$/g)) {
            end += parseInt($('#end-storey').val());
        } else {
            famiPrompt('楼层必须为1-10之间的整数');
            return;
        }

        if (begin > end) {
            famiPrompt('结束楼层必须大于等于开始楼层');
            return;
        }

        doFami(reason, ismsg, amount, times, begin, end, isaward);
    }

    // use sync ajax post
    function doFami(reason, ismsg, amount, times, begin, end, isaward) {
        var startPage = Math.ceil(begin / 10);
        var startStorey = begin % 10 || 10;
        var lastPage = Math.ceil(end / 10);
        var lastStorey = end % 10 || 10;
        var famiRecord = {};
        //sessionStorage.setItem('famiRecord', JSON.stringify(famiRecord));

        var type = isaward ? '发米' : '扣米';

        var urlParams = helper.parseQS(window.location.search);

        // 全部写成异步的避免出问题
        function _doFami(curPage) {
            urlParams['star'] = curPage;
            var famiURL = 'http://www.cc98.org/dispbbs.asp?' + helper.toQS(urlParams);
            $.ajax({
                "url": famiURL,
                "success": function(htmlText) {
                    famiPrompt('正在'+ type + '…… 进度：第' + curPage + '页');
                    var users = $cc98.parseTopicPage(htmlText); // 当页用户列表
                    var curStorey = (curPage === startPage) ? startStorey : 1;  // 当页开始楼层
                    var endStorey = (curPage === lastPage && lastStorey <= users.length) ? lastStorey : users.length; // 当页结束楼层

                    // 发米
                    function famiByPage(first, last) {
                        if (first >= last) {
                            return pageDone();
                        }

                        var user = users[first-1];  // 当前用户
                        famiRecord[user.username] = famiRecord[user.username] || 0; // 更新famiRecord

                        // 发到指定次数，则跳过
                        if (times !== 'nolimit' && famiRecord[user.username] >= times ) {
                            return famiByPage(++first, last);
                        }

                        $cc98.fami({
                            "url": famiURL,
                            "announceid": user.announceid,
                            "amount": (amount === 'random') ? Math.ceil(Math.random() * 1000) : amount,
                            "reason": reason,
                            "ismsg": ismsg,
                            "awardtype": isaward,
                            "callback": function(text) {
                                if (!text.match('论坛错误信息')) {
                                    famiRecord[user.username] += 1;
                                }

                                if (first < last) {   // 继续发下一层楼
                                    return famiByPage(++first, last);
                                } else {    // 本页已发完
                                    return pageDone();
                                }
                            }
                        });
                    }

                    // 结束本页发米
                    function pageDone(){
                        // 更新当前页和总页数
                        // 之所以放在最后，是因为可能从最后发帖时间点进来时curPage是32767，所以至少要保证运行一次
                        var totalPage = 19;
                        ++curPage;

                        // 完成
                        if (curPage > totalPage || curPage > lastPage) {
                            famiPrompt('发米结束，正在跳转……');
                            window.location.reload();
                        }

                        // 下一页
                        _doFami(curPage);
                    }

                    famiByPage(curStorey, endStorey);
                }
            });
        };

        _doFami(startPage);

    }

    view();
});