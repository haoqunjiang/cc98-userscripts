#!/usr/bin/env node

// todo: migrate to grunt

var exec = require('child_process').exec;
var qiniu = require('node-qiniu');

qiniu.config({
    access_key: 'rGopS2dATsPufRPCzbT4eRtejgro-3US63PcoUzw',
    secret_key: 'zCMXEB6D-PIcCVYBcdymWqFxAJcoL47d2XRDZaGx'
});
var mybucket = qiniu.bucket('soda-test-space');

var dependencies = ['../chaos/chaos.js', 'libCC98.js', 'block.js', 'alias.js', 'emotions.js', 'options.js'];
var done = 0;

// todo:
// 1. add timestamp for upload key
// 2. add js-beautify
// 3. add comparison in order to avoid redundancy
// 4. add a function to modify cc98_enhancer.user.js

for (var i in dependencies) {
    var path = dependencies[i];
    var filename = path.split('/').pop();

    mybucket.putFile(filename, path)
        .then(function(reply) {
            console.dir(reply);
            done += 1;
            if (done === dependencies.length) {
                console.log('done!');
            }
        }, function(err) {
            console.err(err);
            done += 1;
            if (done === dependencies.length) {
                console.log('done!');
            }
        });
}

/*
var dependencies = ['../chaos/chaos.js', 'libCC98.js', 'block.js', 'alias.js', 'emotions.js', 'options.js'];
for (var i in dependencies) {
    var path = dependencies[i];
    var filename = path.split('/').pop();

    var child = exec('js-beautify -r ' + path, function() {});
}
*/