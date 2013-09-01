// ==UserScript==
// @id             cc98_id_alias
// @name           cc98 id alias
// @version        0.2
// @namespace      soda@cc98.org
// @author         soda <sodazju@gmail.com>
// @description    给98增加类新浪微博的ID备注功能
// @include        http://www.cc98.org/dispbbs.asp*
// @require        http://file.cc98.org/uploadfile/2013/7/7/1444331657.txt
// @run-at         document-end
// ==/UserScript==

$(function() {
    var Aliases = function() {
        var that = {};
        var dict = JSON.parse(localStorage.getItem('aliases')) || {};

        var flush = function() {
            localStorage.setItem('aliases', JSON.stringify(dict));
        };
        that.flush = flush;

        that.get = function(name) {
            return dict[name];
        };

        that.set = function(name, alias) {
            dict[name] = alias;
            flush();
        };

        that.remove = function(name) {
            delete dict[name];
            flush();
        };

        return that;
    };
    var aliases = Aliases();

    function today() {
        var d = new Date();
        return (d.getFullYear()) +  ('0' + d.getMonth()).slice(-2) + ('0' + d.getDate()).slice(-2);
    }

    var XinlinRecords = function() {
        var that = {};
        var records = JSON.parse(localStorage.getItem('xinlin-records')) || [];

        var flush = function() {
            localStorage.setItem('xinlin-records', JSON.stringify(records))
        };
        that.flush = flush;

        var add = function(url, index, name, alias) {
            records.push({
                'url': url,
                'index': index,
                'name': name,
                'last-update': today()
            });
            aliases.set(name, alias);
            flush();
        };
        that.add = add;

        var remove = function(name) {
            for (var i = 0; i !== records.length; ++i) {
                if (records[i]['name'] === name) {
                    records.splice(i, 1);
                    break;
                }
            }
            aliases.remove(name);
            flush();
        };
        that.remove = remove;

        var modify = function(url, index, name, alias) {
            remove(name);
            if (!alias) {
                return;
            }
            add(url, index, name, alias);
            flush();
        };
        that.modify = modify;

        var traverse = function(callback) {
            for (var i = 0; i !=== records.length; ++i) {
                callback.apply(records[i]);
                flush();
            }
        };
    }
    var xinlin = XinlinRecords();

    function checkForUpdates() {
        xinlin.traverse(function() {
            if (this['last-update'] === today) {
                return;
            }
        });
    }
});
