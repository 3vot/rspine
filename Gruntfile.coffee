module.exports = (grunt) ->

  
  grunt.initConfig
    
    clean:
      source: ['./lib/*.js']
      
    coffee:
      sourceFiles:
        expand: true,
        flatten: true,
        cwd: './src',
        src: ['*.coffee'],
        dest: './lib/',
        ext: '.js'
  
      testFiles:
        expand: true,
        flatten: true,
        cwd: './test/specs/src',
        src: ['*.coffee'],
        dest: './test/specs/',
        ext: '.js'
  
    watch:
      source:
        files: ["src/*.coffee"]
        tasks: ['clean','coffee:sourceFiles',"jasmine:salesforceModel"]

      test_src:
        files: ["test/specs/src/*.coffee"]
        tasks: ['coffee:testFiles',"jasmine:salesforceModel"]
  
    jasmine: 
      rspine: 
        src: ["./lib/rspine.js","./lib/ajax.js"]
        options: 
          specs: ['./test/specs/class.js','./test/specs/controller.js','./test/specs/events.js','./test/specs/model.js','./test/specs/ajax.js']
          vendor: "./test/lib/jquery.js"
        
      salesforceModel:
        src: ["./lib/rspine.js"  ,"./lib/salesforceModel.js","./lib/salesforceAjax.js","./lib/offlineModel.js"]
        options: 
          specs: ['./test/specs/salesforceModel.js', './test/specs/salesforceAjax.js', './test/specs/offlineModel.js']
          vendor: "./test/lib/jquery.js"

         
        
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-jasmine');

  grunt.registerTask('test', ['clean','coffee','jasmine']);   

  grunt.registerTask('test_sf', ['clean','coffee','jasmine:salesforceModel']);   

  grunt.registerTask("server", ["watch"] )


  grunt.registerTask('testing', ["watch"]);   

  grunt.registerTask('default', ['clean','coffee']);   