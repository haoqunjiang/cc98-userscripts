module.exports = function(grunt) {
    grunt.initConfig({
        watch: {
            files: ['lib/*.js', '../chaos/chaos.js'],
            tasks: ['jsbeautifier', 'concat']
        },
        jsbeautifier: {
            files: ['lib/*.js', '../chaos/chaos.js']
        },
        concat: {
            options: {
                separator: '\n\n',
            },
            dist: {
                src: ['lib/intro.js', '../chaos/chaos.js', 'lib/modular.js', 'lib/modular-shim.js', 'lib/CC98URLMap.js', 'lib/libcc98.js',
                    'lib/options.js', 'lib/ignore.js', 'lib/app.js', 'lib/outro.js'],
                dest: 'cc98-blacklist.user.js',
            },
        },
    });
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.registerTask('default', ['jsbeautifier', 'concat', 'watch']);
    grunt.registerTask('release', ['jsbeautifier', 'concat']);
};
