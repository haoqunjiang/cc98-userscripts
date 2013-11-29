module.export = function(grunt) {
    grunt.initConfig({
        concat: {
            options: {},
            dist: {
                src: ['intro.js', '../chaos/chaos.js', 'modular.js', 'modular-shim.js', 'q-http', 'libcc98.js', 'options.js', 'utils.js', 'alias.js', 'emotions.js', 'editor.js', 'app.js', 'outro.js'],
                dest: 'cc98_enhancer.js',
            },
        },
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.registerTask('default', ['concat']);
};