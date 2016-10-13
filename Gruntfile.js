module.exports = function(grunt) {

    var tasks = require('./grunt_tasks.js')();

    grunt.initConfig(tasks);

    require('load-grunt-tasks')(grunt);
    grunt.registerTask('build', ['concat']);
    grunt.registerTask('default', ['watch']);
};

