var fs = require('fs');
var del = require('del');
var gulp = require('gulp');
var sass = require('gulp-sass');
var babel = require("gulp-babel");
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var browserSync = require('browser-sync');
var jsonminify = require('gulp-jsonminify');
var autoprefixer = require('gulp-autoprefixer');

var reload = browserSync.reload;

gulp.task('clean', function (done) {
  del(['dist/*']).then(() => done());
});

gulp.task('scripts', function() {
  return gulp.src(['src/components/**/*.js', 'src/js/*.js'])
    .pipe(concat('index.js'))
    .pipe(babel())
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

gulp.task('styles', function() {
  return gulp.src(['src/components/**/*.scss', 'src/css/*.scss'])
    .pipe(concat('index.scss'))
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(sass({outputStyle: 'compressed'})
      .on('error', sass.logError))
    .pipe(gulp.dest('dist'));
});

gulp.task('html', function() {
  return gulp.src('src/*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'));
});

gulp.task('json', function () {
  return gulp.src(['src/*.json'])
    .pipe(jsonminify())
    .pipe(gulp.dest('dist'));
});

gulp.task('sync', function() {
  browserSync({
    notify: false,
    port: 8000,
    server: "dist",
    open: false
  });
});
