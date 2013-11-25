// a collection of simple browser-side JavaScript snippets
window.chaos = {

    // parse the url get parameters
    parseQS: function (url) {
        url = url.toLowerCase().split('#')[0]; // remove the hash part
        var t = url.indexOf('?');
        var hash = {};
        if (t >= 0) {
            var params = url.substring(t + 1).split('&');
        } else { // plain query string without '?' (e.g. in cookies)
            var params = url.split('&');
        }
        for (var i = 0; i < params.length; ++i) {
            var val = params[i].split('=');
            hash[decodeURIComponent(val[0])] = decodeURIComponent(val[1]);
        }
        return hash;
    },

    toQS: function (obj) {
        var ret = [];
        for (var key in obj) {
            if ('' === key) continue;
            if ('' === obj[key]) continue;
            ret.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
        }
        return ret.join('&');
    },

    parseURL: function (url) {
        // from JavaScript: The Good Parts
        var parse_url = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/
        var arr = parse_url.exec(url);
        var result = {};
        result['url'] = arr[0];
        result['scheme'] = arr[1];
        result['slash'] = arr[2];
        result['host'] = arr[3];
        result['port'] = arr[4];
        result['path'] = arr[5];
        result['query'] = arr[6];
        result['hash'] = arr[7];
        return result;
    },

    parseCookies: function (theCookie) {
        var cookies = {}; // The object we will return
        var all = theCookie; // Get all cookies in one big string
        if (all === '') // If the property is the empty string
            return cookies; // return an empty object
        var list = all.split('; '); // Split into individual name=value pairs
        for (var i = 0; i < list.length; i++) { // For each cookie
            var cookie = list[i];
            var p = cookie.indexOf('='); // Find the first = sign
            var name = cookie.substring(0, p); // Get cookie name
            var value = cookie.substring(p + 1); // Get cookie value
            value = decodeURIComponent(value); // Decode the value
            cookies[name] = value; // Store name and value in object
        }
        return cookies;
    },

    // 将部分常见的转义后的html转回来
    unescapeHTML: function (input) {
        var e = document.createElement('div');
        e.innerHTML = input;
        return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue;
    },

    ajax: function (opts) {
        opts = {
            type: opts.type || 'GET',
            url: opts.url || '',
            data: opts.data || null,
            contentType: opts.contentType || 'application/x-www-form-urlencoded; charset=UTF-8',
            success: opts.success || function () {},
            async: opts.async || (opts.async === undefined)
        };

        var xhr = new XMLHttpRequest;
        xhr.open(opts.type, opts.url, opts.async);
        xhr.setRequestHeader('Content-type', opts.contentType);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                opts.success(xhr.responseText);
            }
        };
        if (opts.contentType === 'application/x-www-form-urlencoded; charset=UTF-8') {
            xhr.send(chaos.toQS(opts.data));
        } else {
            xhr.sendAsBinary(opts.data)
        }
    },

    // xpath query
    //@return {Array}   返回由符合条件的DOMElement组成的数组
    xpath: function (expr, contextNode) {
        contextNode = contextNode || document;
        var xresult = document.evaluate(expr, contextNode, null,
            XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        var xnodes = [];
        var xres;
        while (xres = xresult.iterateNext()) {
            xnodes.push(xres);
        }

        return xnodes;
    },

    // 添加CSS
    addStyles: function (css) {
        var head = document.getElementsByTagName('head')[0];
        var style = document.createElement('style');

        style.setAttribute('type', 'text/css');
        style.innerHTML = css;
        head.appendChild(style);
    },

    // 计算字符串字节数
    // from http://imatlas.com/posts/js-count-string-bytes/
    sizeof: function (str, charset) {
        charset = charset || 'utf-8';
        charset = charset.toLowerCase();

        var total = 0;

        if (charset === 'utf-16' || charset === 'utf16') {
            for (var i = 0; i != str.length; ++i) {
                if (str.charCodeAt(i) <= 0xffff) {
                    total += 2;
                } else {
                    total += 4;
                }
            }
        } else {
            for (var i = 0; i != str.length; ++i) {
                var code = str.charCodeAt(i)
                if (code <= 0x007f) {
                    total += 1;
                } else if (code <= 0x07ff) {
                    total += 2;
                } else if (code <= 0xffff) {
                    total += 3;
                } else {
                    total += 4;
                }
            }
        }
        return total;
    }
};