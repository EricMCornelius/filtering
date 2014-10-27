var gulp = require('gulp');
var istanbul = require('gulp-istanbul');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var livereload = require('gulp-livereload');

var dest = 'public';

function server(cb) {
  var koa = require('koa');
  var serve = require('koa-static');
  var app = koa();
  app.use(serve(dest));
  app.listen(3000, cb);
}

function test(cb) {
  process.env.NODE_ENV = 'test';

  gulp.src(['lib/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(istanbul())
    .on('finish', function () {
      gulp.src(['test/*.js'])
        .pipe(mocha({reporter: 'spec'}))
        .pipe(istanbul.writeReports())
        .on('end', cb);
    });
};

gulp.task('test', test);
gulp.task('server', server);
gulp.task('default', ['server'], function() {
  var server = livereload();
  gulp.watch(dest + '/**').on('change', function(file) {
    server.changed(file.path);
  });
});
