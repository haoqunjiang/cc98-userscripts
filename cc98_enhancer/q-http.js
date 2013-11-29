// a browser-side http library using Q libray to implement promise
define('q-http', {
    ajax: function(opts) {
        opts = {
            type: opts.type || 'GET',
            url: opts.url || '',
            data: opts.data || null,
            contentType: opts.contentType || 'application/x-www-form-urlencoded; charset=UTF-8',
            success: opts.success || function() {},
            error: opts.error || function() {},
            async: opts.async || (opts.async === undefined)
        };

        var chaos = require('chaos');
        var Q = require('Q');

        var deferred = Q.defer();

        // Chrome 没有sendAsBinary函数，这里是一个实现
        if (!XMLHttpRequest.prototype.sendAsBinary) {
            XMLHttpRequest.prototype.sendAsBinary = function(datastr) {
                function byteValue(x) {
                    return x.charCodeAt(0) & 0xff;
                }
                var ords = Array.prototype.map.call(datastr, byteValue);
                var ui8a = new Uint8Array(ords);
                this.send(ui8a);
            };
        }

        var xhr = new XMLHttpRequest();

        if (opts.type === 'GET') {
            opts.url += opts.data ? ('?' + chaos.toQS(opts.data)) : '';
        }

        xhr.open(opts.type, opts.url, opts.async);

        if (opts.contentType) {
            xhr.setRequestHeader('Content-type', opts.contentType);
        }

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    deferred.resolve(xhr.responseText);
                } else {
                    deferred.reject('HTTP ' + xhr.status + 'for ' + opts.url);
                }
            }
        };

        if (opts.type === 'GET') {
            xhr.send();
        } else if (opts.contentType === 'application/x-www-form-urlencoded; charset=UTF-8') {
            xhr.send(chaos.toQS(opts.data));
        } else {
            xhr.sendAsBinary(opts.data);
        }

        return deferred.promise.then(opts.success, opts.error);
    },

    get: function(url, data, success, error) {
        if (typeof data === 'function') {
            callback = data;
            data = null;
        }
        return this.ajax({
            type: 'GET',
            url: url,
            data: data,
            success: success,
            error: error
        });
    },

    post: function(url, data, callback) {
        if (typeof data === 'function') {
            callback = data;
            data = null;
        }
        return this.ajax({
            type: 'POST',
            url: url,
            data: data,
            success: success,
            error: error
        });
    }
});