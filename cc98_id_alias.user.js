// ==UserScript==
// @id             cc98_id_alias
// @name           cc98 id alias
// @version        0.1
// @namespace      soda@cc98.org
// @author         soda <sodazju@gmail.com>
// @description    给98增加类新浪微博的ID备注功能
// @include        http://www.cc98.org/*
// @require        http://file.cc98.org/uploadfile/2013/7/7/1444331657.txt
// @run-at         document-end
// ==/UserScript==


$(function() {
    // 唯一的全局变量，因为多处用到，不分离出来太麻烦
    var savedRecords = JSON.parse(localStorage.getItem("savedRecords")) || [];

    // xpath function which returns an array of DOM elements
    function _x(expr, contextNode) {
        contextNode = contextNode || document;
        var xresult = document.evaluate(expr, contextNode, null,
                    XPathResult.ORDERED_NODE_ITERATOR_TYPE , null);
        var xnodes = [];
        var xres;
        while (xres = xresult.iterateNext()) {
            xnodes.push(xres);
        }

        return xnodes;
    }

    // wrapper of the above xpath function
    // returns a jQuery object
    var $x = function (expr, contextNode) {
        return $(_x(expr, contextNode));
    }

    // add the xpath functionality to all jQuery objects
    jQuery.fn.extend({
        xpath: function (expr) {
            var re = $();
            var nodes = this.get();
            for (var i = 0; i != nodes.length; ++i) {
                $.extend(re, $x(expr, nodes[i]));
            }
            return re;
        }
    });

    // parse the url get parameters
    function qs(url) {
        url = url.toLowerCase()
        var t = url.indexOf("?");
        var hash = {};
        if (t > 0) {
            params = url.substring(t+1).split("&");
            for (var i = 0; i < params.length; ++i) {
                var val = params[i].split("=");
                hash[decodeURIComponent(val[0])] = decodeURIComponent(val[1]);
            }
        }
        return hash;
    };


    // main function
    function idAlias() {
        // 在控制面板下增加「id备注管理」
        if ( unsafeWindow ) {
            unsafeWindow.manage2 += '<br><a class="mainjs" href="javascript:">id备注管理</a>';
        } else {
            manage2 += '<br><a id="id-alias-manage" class="mainjs" href="javascript:void(0);">id备注管理</a>';
        }

        // 在每一层楼的用户名边上加上[备注]或者[+]
        var userBlocks = $x("//img[@src='pic/reply.gif']").parent().parent()
                        .parent().parent().parent().parent().prev();
        userBlocks.each(function(index, ele) {
            this.id = "user-block-" + index;
            $(this).addClass("user-block");
        });

        var idNodes = userBlocks.find("b");
        idNodes.each(function(index, ele) {
            var idNode = $(this);
            if (qs(window.location.search)["boardid"] !== "182") {
                idNode = idNode.parent().parent();
            } else {
                idNode = idNode.parent();
            }
            var id = idNode.text();
            var alias = localStorage.getItem(id);

            // 插入备注文字
            if (alias) {
                idNode.after('<span class="alias id-alias" id="alias-num-' + index + '">['+ alias + ']</span>');
            } else {
                addAliasBtn = $();
                idNode.after('<span class="alias add-alias" id="alias-num-' + index + '">[+]</span>');
            }

            var aliasNode = idNode.next();

            // 设置鼠标悬停显示（对于没有备注的节点）
            if (aliasNode.hasClass("add-alias")) {
                $("#user-block-" + index).hover(
                    function() {
                        aliasNode.show();
                    },
                    function() {
                        aliasNode.hide();
                    });
            }

            // 点击更改备注
            aliasNode.click(function() {
                var curAlias = $(this).text().replace(/\[(.*)\]/g, "$1").replace(/^\+$/g, "");
                var newAlias = prompt("请输入备注名（更新备注后请刷新页面）", curAlias);

                if (newAlias) {
                    if (qs(window.location.search)["boardid"] === "182" && curAlias === "") {    // 心灵，新增备注

                        var newRecord = {};
                        var recordExist = false;

                        var theLink = window.location.href.split("#")[0] + "#" + (index+1) % 10;
                        var today = new Date();
                        var tommorow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

                        newRecord["link"] = theLink;
                        newRecord["id"] = id;
                        newRecord["expiryDate"] = tommorow;
                        for (var i = savedRecords.length - 1; i >= 0; i--) {
                            if (savedRecords[i]["link"] === theLink) {
                                savedRecords[i] = newRecord;
                                recordExist = true;
                                break;
                            }
                        };
                        if (!recordExist) {
                            savedRecords.push(newRecord);
                        }

                        localStorage.setItem("savedRecords", JSON.stringify(savedRecords));
                        localStorage.setItem(id, newAlias);

                    } else {
                        localStorage.setItem(id, newAlias);
                    }
                } else if (newAlias === "" && $(this).hasClass("id-alias")) {  // 删除已有备注

                    if (qs(window.location.search)["boardid"] === "182") {    // 心灵

                        // 把对应的更新地址删掉
                        for (var i = 0; i != savedRecords.length; ++i) {
                            if (savedRecords[i]["id"] === id) {
                                savedRecords.splice(i, 1);
                                break;
                            }
                        }
                        localStorage.setItem("savedRecords", JSON.stringify(savedRecords));
                        localStorage.removeItem(id);

                    } else {
                        localStorage.removeItem(id);
                    }

                }
            });
        });

        // 设置备注文字样式
        $(".alias").css({
            "color": "#333",
            "cursor": "pointer"
        });

        $(".id-alias").css({
            "font-size": "10px",
            "margin-left": "0px"
        });

        $(".add-alias").css({
            "margin-left": "4px"
        })

        // 默认不显示添加备注的按钮
        $(".add-alias").hide();
    }

    function updateGenerator(i, storey) {
        return function(html) {
            var today = new Date();
            var tommorow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
            var oldId = savedRecords[i]["id"];

            var index = storey - 1;
            if (index < 0) index = 9;

            var spanReg = /<span style="color: #000066;"><b>[^<]*<\/b><\/span>/g;
            var idReg = /<b>([^<]*)<\/b>/g;
            var newId = idReg.exec(html.match(spanReg)[index])[1];

            savedRecords[i]["id"] = newId;
            savedRecords[i]["expiryDate"] = tommorow;
            console.log(savedRecords[i]['link'])
            console.log(JSON.stringify(savedRecords))

            localStorage.setItem("savedRecords", JSON.stringify(savedRecords));
            localStorage.setItem(newId, localStorage.getItem(oldId));
            localStorage.removeItem(oldId);
        };
    }

    function updateXinlinNo() {
        var today = new Date();
        // 检查编号是否已过期
        for (var i = 0; i !== savedRecords.length; ++i) {
            if (today.getTime() > (new Date(savedRecords[i]["expiryDate"]))) {
                var storey = parseInt(savedRecords[i]["link"].split('#')[1]);
                $.ajax({
                    type: "GET",
                    url: savedRecords[i]["link"],
                    dataType: "text",
                    success: updateGenerator(i, storey)
                });
            }
        }
    }

    updateXinlinNo();
    idAlias();
})
