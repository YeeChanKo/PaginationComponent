var gulp = require("gulp");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var gulpSequence = require("gulp-sequence");
var eslint = require("gulp-eslint");
var fs = require("fs");

var jsDir = "./js/*.js";

gulp.task("default", gulpSequence("lint", "concat", "compress"));

gulp.task("lint", function () {
  return gulp.src(jsDir)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task("concat", function () {
  return gulp.src(jsDir)
    .pipe(concat("all.js"))
    .pipe(gulp.dest("./dist/"));
});

gulp.task("compress", function () {
  return gulp.src("./dist/all.js")
    .pipe(uglify({
      mangle: true // uglify params and vars
    }))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(gulp.dest("dist"));
});
