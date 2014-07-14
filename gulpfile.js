var gulp = require('gulp');
var concat = require('gulp-concat');
var csso = require('gulp-csso');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var docco = require("gulp-docco");

var paths = {
    scripts: ['src/**/*.js'],
    css: 'src/**/*.css'
};

gulp.task('min-js', function () {

    gulp.src([
        './src/_intro.js',
        './src/brandseye.js',
        './src/modules/colours.js',
        './src/modules/utils.js',
        './src/modules/graph/_intro.js',
        './src/modules/graph/commonMethods.js',
        './src/modules/graph/graph.js',
        './src/modules/graph/histogramChart.js',
        './src/modules/graph/barChart.js',
        './src/modules/graph/columnChart.js',
        './src/modules/graph/pieChart.js',
        './src/modules/graph/lineChart.js',
        './src/modules/graph/wordCloudChart.js',
        './src/modules/graph/sparklines.js',
        './src/modules/graph/area.js',
        './src/modules/graph/dataAPI.js',
        './src/modules/graph/appendix.js',
        './src/modules/graph/_outro.js',
        './src/_outro.js'
    ])
        .pipe(concat('brandseye.js'), {newLine: '\n\n'})
        .pipe(gulp.dest('./dist/'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/'))
});
gulp.task('min-css', function () {

    gulp.src([
        paths.css
    ])
        .pipe(csso())
        .pipe(gulp.dest('./dist/'))
});
gulp.task('docco', function () {
    gulp.src("./dist/brandseye.js")
        .pipe(docco())
        .pipe(gulp.dest('./docs'));
});


// Rerun the task when a file changes
gulp.task('watch', function () {
    gulp.watch(paths.scripts, ['min-js']);
    gulp.watch(paths.css, ['min-css']);
    gulp.watch('./dist/brandseye.js', ['docco']);
});

gulp.task('default', ['min-js', 'min-css', 'docco']);

// This task is useful when developing - whenever a file is changed we automatically re-build.
gulp.task('dev', ['watch', 'min-js', 'min-css', 'docco']);
