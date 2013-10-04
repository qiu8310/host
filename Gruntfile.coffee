'use strict';

module.exports = (grunt) ->
	fs = require('fs')
	path = require('path')

	grunt.initConfig
		pkg: grunt.file.readJSON('package.json'),

		params:
			banner: '/*! <%= pkg.name %>  <%= pkg.version %> ( <%= grunt.template.today("yyyy-mm-dd") %> ) | <%= pkg.license %> */'


		# http://www.jshint.com/docs/
		jshint:
			options: 
				strict: true 		# 采用 ECMAScript 5's strict mode   https://developer.mozilla.org/en/JavaScript/Strict_mode
				bitwise: true  		# 禁用二进制操作
				camelcase: true 	# 变量写法：camelCase or UPPER_CASE
				newcap: true		# 当需要用 new 来创建的函数，需要首字母大写
				noarg: true 		# 禁用 arguments.caller and arguments.callee，它们影响优化，并且在以后的JS版本中将会废弃
				browser: true
				curly: false 		# 循环或条件块中必须加上 { }
				devel: true
				indent: true 		# enforces specific tab width
				#forin: true 		# for (key in obj) 必须加上  if (obj.hasOwnProperty(key)) {}
				eqeqeq: true		# 必须使用 === 而不是 ==
				noempty: true 		# 不允许 { } 中没有任何语句
				nonew: true 		# 不允许直接使用 new MyConstructor()， 而不给其赋值
				plusplus: false 	# 不允许使用 ++ 或 --，影响代码质量， Python中就没有
				quotmark: 'single' 	# true=>不限制使用引号， single=>只能使用单引号，double=>只能使用双引号
				undef: true 		# 不允许使用没有定义的变量
				#unused: true 		# 不允许定义了变量但又没有使用
				trailing: true 		# 不允许行末尾有多余的空格
				
				# Relaxing options
				asi: false 			# 不允许语句最后不加 ";"
				boss: true  		# 压制本来应该提供真假值，而提供了赋值语句的错误： for (var i = 0, person; person = people[i]; i++) {}
				sub: true
				eqnull: true
				expr: true
				evil: true
				immed: false
				laxcomma: true
				smarttabs: true

				globals: 
					module: true
					exports: true
					require: true
					process: true
					Buffer: true
			dev: ['*.js', 'bin/*']

		watch:
			jslint:
				files: '<%= jshint.dev %>' 
				tasks: 'jshint:dev'
			options:
				interrupt: true		# 多次修改时，终止上次的 task 子进程，重新产生一个新的 task 子进程
				debounceDelay: 1000


	# Load dependencies packages
	require('matchdep').filter('grunt-*').forEach(grunt.loadNpmTasks)

	# Load devDependencies, may or may not be installed
	require('matchdep').filterDev('grunt-*').forEach (contrib) ->
		module.paths.forEach (dir) ->
			grunt.loadNpmTasks(contrib) if fs.existsSync(path.join(dir, contrib))

	return 

