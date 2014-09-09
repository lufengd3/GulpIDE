var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var serverPort = 8081;
var defaultTask = ['connect', 'broswer'];

gulp.task('connect', function() {
  $.connect.server({
    root: 'app/',
    port: serverPort,
    livereload: true
  });

  gulp.watch(['app/*', 'app/css/*.css', 'app/js/*.js', 'app/img/**/'], ['pageReload']);
});

gulp.task('pageReload', function() {
  gulp.src('app/')
    .pipe($.connect.reload());
});

gulp.task("broswer", ['connect'], function(){
  gulp.src("app/index.html")
  .pipe($.open("", {url: "http://localhost:" + serverPort}));
});