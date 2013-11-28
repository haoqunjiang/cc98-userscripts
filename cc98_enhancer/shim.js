;(function(global){
    var mapping = {}, cached = {};
    global.define = function(id, func){
        mapping[id] = func;
    };
    global.require = function(id){
        if(cached[id])
            return cached[id];
        else
            return cached[id] = mapping[id]({});
    };
})(this);