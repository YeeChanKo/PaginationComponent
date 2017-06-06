var gulp = require("gulp");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var gulpSequence = require("gulp-sequence");
var jscs = require("gulp-jscs");
var browserify = require("browserify");
var fs = require("fs");

var jsDir = "./js/*.js";

gulp.task("default", gulpSequence("lint", "bundle", "compress"));

gulp.task("lint", () => {
  return gulp.src(jsDir)
    .pipe(jscs())
    .pipe(jscs.reporter());
});

gulp.task("bundle", () => {
  return browserify("./js/app.js")
    .transform("babelify", {
      presets: ["es2015"]
    })
    .bundle()
    .pipe(fs.createWriteStream("./dist/all.js"));
});

gulp.task("compress", () => {
  return gulp.src("./dist/all.js")
    .pipe(uglify())
    .pipe(rename({
      suffix: ".uglify"
    }))
    .pipe(gulp.dest("dist"));
});
