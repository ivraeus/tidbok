var fs = require('fs');
var del = require('del');
var gulp = require('gulp');
var sass = require('gulp-sass');
var babel = require("gulp-babel");
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var sourcemaps = require("gulp-sourcemaps");
var jsonminify = require('gulp-jsonminify');
var autoprefixer = require('gulp-autoprefixer');

var reload = browserSync.reload;

gulp.task('clean', function (done) {
  del('dist/*').then(() => done());
});

gulp.task('script', function () {
  return gulp.src('src/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel())
      .on('error', error => {console.log('error')})
    .pipe(uglify())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest('dist'))
});

gulp.task('style', function () {
  return gulp.src('src/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'compressed'})
      .on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest('dist'))
});

gulp.task('html', function () {
  return gulp.src('src/*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'))
});

gulp.task('json', function () {
  return gulp.src('src/*.json')
    .pipe(jsonminify())
    .pipe(gulp.dest('dist'))
});

gulp.task('sync', function () {
  browserSync({
    server: "dist"
  });
});

gulp.task('watch', function () {
  gulp.watch('src/*.js', ['script', reload]);
  gulp.watch('src/*.scss', ['style', reload]);
  gulp.watch('src/*.html', ['html', reload]);
  gulp.watch('src/*.json', ['json', reload]);
});

gulp.task('build', function (done) {
  runSequence('clean', ['script', 'style', 'html', 'json'], done);
});

gulp.task('serve', function (done) {
  runSequence('build', ['sync', 'watch'], done);
});
