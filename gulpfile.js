'use strict';

require('babel-runtime/regenerator');
require("babel-polyfill");
require('babel-core/register');

var gulp        = require('gulp')
  , babel       = require('gulp-babel')
  , uglify 	    = require('gulp-uglify')
  , del         = require('del')
  , watch 	    = require('gulp-watch')
  , batch       = require('gulp-batch')
  , browserify	= require('browserify')
  , concat 	    = require('gulp-concat')
  , source 	    = require('vinyl-source-stream')
  , buffer 	    = require('vinyl-buffer')
  , mergeStream = require('merge-stream');

gulp.task('build:es6-commonjs', function() {
  return gulp.src('src/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('dist/core/temp'))
});

gulp.task('build:js', [ 'build:es6-commonjs' ], function() {
  return mergeStream(
    gulp.src([
      //'./node_modules/pixi.js/dist/pixi.min.js',
      //'./node_modules/phaser/build/phaser.min.js',
      './node_modules/regenerator-runtime/runtime.js'
    ]),//.pipe(uglify()),
    browserify('./dist/core/temp/main.js')
      .bundle()
      .pipe(source('space.min.js'))
      .pipe(buffer())
      //.pipe(uglify())
  )
    .pipe(concat('space.min.js'))
    .pipe(gulp.dest('./dist/core'));
});

gulp.task('clean', function() {
  return del([ 'dist/core' ]);
});

gulp.task('build', [ 'build:js' ], function () {
  return del([ 'dist/core/temp' ]);
});

gulp.task('watch', ['build'], function () {
  watch('src/**/*.js', batch(function (events, done) {
    gulp.start('build', done);
  }));
});

gulp.task('default', [ 'build' ]);
