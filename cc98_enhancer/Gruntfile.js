module.exports = function(grunt) {
    grunt.initConfig({
        jsbeautifier: {
            files: ['lib/*.js']
        },
        concat: {
            options: {
                separator: '\n\n',
            },
            dist: {
                src: ['lib/intro.js', '../chaos/chaos.js', 'lib/modular.js', 'lib/modular-shim.js', 'lib/q-http',
                    'lib/libcc98.js', 'lib/options.js', 'lib/utils.js', 'lib/alias.js', 'lib/emotions.js', 'lib/editor.js', 'lib/app.js', 'lib/outro.js'],
                dest: 'cc98_enhancer.js',
            },
        },
    });
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.registerTask('default', ['jsbeautifier', 'concat']);
};