// ==UserScript==
// @id             cc98_shuilou_stat
// @name           cc98 shuilou stat
// @version        1.0
// @namespace      soda@cc98.org
// @author         soda <sodazju@gmail.com>
// @description    
// @include        http://www.cc98.org/dispbbs.asp*
// @run-at         document-end
// ==/UserScript==

(function () {
    var stat = {};

    function print(str) { console.log(str); }

    function $(id) { return document.getElementById(id); }

    function xpath(expr, contextNode) {
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

    // parse the url get parameters
    function qs(url) {
        url = url.toLowerCase().split("#")[0];
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

    function addStyles(css) {
        var head = document.getElementsByTagName("head")[0];
        var style = document.createElement("style");

        style.setAttribute("type", "text/css");
        style.innerHTML = css;
        head.appendChild(style);
    };

    function ajax(opts) {
        opts = {
            type: opts.type || "GET",
            url: opts.url || '',
            data: opts.data || null,
            contentType: opts.contentType || "application/x-www-form-urlencoded; charset=UTF-8",
            success: opts.success || function(){},
            async: opts.async || (opts.async === undefined)
        };
        var xhr = new XMLHttpRequest;
        xhr.open(opts.type, opts.url, opts.async);
        xhr.setRequestHeader("Content-type", opts.contentType);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                opts.success(xhr.responseText);
            }
        };
        xhr.send(opts.data);
    };


    function view() {
        var statBtn = document.createElement("a");
        statBtn.id = "do-stat";
        statBtn.href = "javascript: void(0)";
        var text = document.createTextNode("贴数统计");
        statBtn.appendChild(text);

        var tmp = xpath("//td/a[contains(@href, 'vote')]")[0].parentNode;
        tmp.appendChild(statBtn);

        addStyles("\n\
            #do-stat {\n\
                display: inline-block; \n\
                vertical-align: 4px;\n\
                text-align: center;\n\
                width: 71px;\n\
                height: 17px;\n\
                margin-left: 3px;\n\
                border: 1px solid black;\n\
                border-radius: 6px;\n\
                background-color: #99CCFF;\n\
                color: #065AAE;\n\
                font-size: 13px;\n\
                text-shadow: white 1px 1px;\n\
            }\n\
        ");
    }

    function doStatistic() {
        var reForNum = /<span id="topicPagesNavigation">本主题贴数\s*<b>(\d+)<\/b>/g;
        var num = parseInt((document.documentElement.innerHTML.match(reForNum))[0].replace(reForNum, "$1"));
        var totalPage = Math.ceil(num / 10);
        var urlParams = qs(window.location.href);
        for (i = 1; i <= totalPage; ++i) {
            ajax({
                type: "GET",
                url: "http://www.cc98.org/dispbbs.asp?boardid=" + urlParams["boardid"] + "&id=" + urlParams["id"] + "&star=" + i,
                success: function(text) {
                    parsePage(text);
                },
                async: (i === totalPage) ? false : true
            });
        }
        showStat();
    }

    function parsePage(text) {
        var reForName = /<span style=\"color:\s*\#\d{6}\s*;\"><b>([^<]+)<\/b><\/span>/g;
        var spanArr = text.match(reForName);
        spanArr.forEach(function(ele, index, arr) {
            var name = ele.replace(reForName, "$1");
            if (stat[name]) {
                stat[name] += 1;
            } else {
                stat[name] = 1;
            }
        });
    }

    function showStat() {
        var mask = document.createElement("div");
        mask.id = "stat-mask";

        var statDiv = document.createElement("div");
        statDiv.id = "stat-box";
        var ol = document.createElement("ol");
        ol.style.listStyle = "none";

        var sortedKey = Object.keys(stat).sort(function(a, b) { return stat[b] - stat[a]; });   // descending order
        sortedKey.forEach(function(ele, index, arr) {
            var li = document.createElement("li");
            li.innerHTML = ('[' + (index+1) + ']' + ele + ": " + stat[ele]);
            ol.appendChild(li);
        });

        statDiv.appendChild(ol);

        document.body.appendChild(mask);
        document.body.appendChild(statDiv);

        addStyles('\n\
            #stat-mask {\n\
                left: 0px;\n\
                top: 0px;\n\
                height: 100%;\n\
                width: 100%;\n\
                position:fixed;\n\
                z-index: 100;\n\
                opacity:0.75;\n\
                background-color: #222;\n\
                background-repeat: repeat;\n\
            }\n\
            #stat-box {\n\
                position: absolute;\n\
                top: 150px;\n\
                left: 30%;\n\
                width: 30%;\n\
                opacity: 0.9;\n\
                background-color: #F7F9FB;\n\
                border-radius: 3px;\n\
                z-index: 200;\n\
            }\n\
        ');

        mask.addEventListener("click", function() {
            document.body.removeChild(mask);
            document.body.removeChild(statDiv);
        })
    }

    view();
    $("do-stat").addEventListener("click", doStatistic);

})();