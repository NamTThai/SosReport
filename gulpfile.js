var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var merge = require('merge-stream');
var path = require('path');
var fs = require('fs');
var glob = require('glob');

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

gulp.task('styles', function () {
  return gulp.src('public/stylesheets/*.scss')
    .pipe($.sourcemaps.init())
    .pipe($.changed('stylesheets', {extension: '.scss'}))
    .pipe($.sass())
    .pipe($.groupConcat({
      "styles.css": "**/*.css"
    }))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe($.cssmin())
    .pipe(gulp.dest('build/stylesheets'));
});

gulp.task('styles-debug', function() {
  return gulp.src('public/stylesheets/*.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass())
    .pipe($.groupConcat({
      "styles.css": "**/*.css"
    }))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe($.cssmin())
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('build/stylesheets'));
});

gulp.task('scripts', function() {
  return gulp.src('public/javascripts/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.changed('javascripts', {extension: '.js'}))
    .pipe($.concat('scripts.js'))
    .pipe($.uglify())
    .pipe(gulp.dest('build/javascripts'));
});

gulp.task('scripts-debug', function() {
  return gulp.src('public/javascripts/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.concat('scripts.js'))
    .pipe($.uglify())
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('build/javascripts'));
});

gulp.task('images', function () {
  return gulp.src('public/images/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('build/images'))
    .pipe($.size({title: 'images'}));
});

gulp.task('copy', function () {
  var root = gulp.src(['public/*', '!public/precache.json'], {
    dot: true
  }).pipe(gulp.dest('build'));

  var components = gulp.src(['public/components/*', '!public/components/components.html'])
    .pipe(gulp.dest('build/components'));

  return merge(root, components);
});

gulp.task('vulcanize', function () {
  var DEST_DIR = 'build/components';

  return gulp.src('public/components/components.html')
    .pipe($.rename('/components.vulcanized.html'))
    .pipe(gulp.dest('build/components'))
    .pipe($.vulcanize({
      dest: DEST_DIR,
      strip: true,
      inlineCss: true,
      inlineScripts: true
    }))
    .pipe(gulp.dest(DEST_DIR));
});

// Placeholder for precache service worker
gulp.task('precache', function (callback) {
  glob('{components,javascripts,stylesheets}/**/*.*', {cwd: 'build'}, function(error, files) {
    if (error) {
      callback(error);
    } else {
      files.push('./', 'bower_components/webcomponentsjs/webcomponents-lite.min.js');
      fs.writeFile('build/precache.json', JSON.stringify(files), callback);
    }
  });
});

// Clean Output Directory
gulp.task('clean', del.bind(null, ['build/**', '!build', '!build/bower_components/**']));
gulp.task('clean-deep', del.bind(null, ['build', 'logs', 'node_modules']));

gulp.task('build', ['default'], function (){
  gulp.watch(['public/components/*', '!public/components/components.html'], ['copy']);
  gulp.watch(['public/stylesheets/*.scss'], ['styles']);
  gulp.watch(['public/javascripts/*.js'], ['scripts']);
  gulp.watch(['public/images/*'], ['images']);
  gulp.watch(['public/components/components.html'], ['vulcanize']);

  return $.nodemon({
    script: 'bin/www',
    ext: 'js ejs json',
    ignore: ['public', 'build']
  });
});

gulp.task('serve', ['default-debug'], function (){
  gulp.watch(['public/components/*', '!public/components/components.html'], ['copy']);
  gulp.watch(['public/stylesheets/*.scss'], ['styles-debug']);
  gulp.watch(['public/javascripts/*.js'], ['scripts-debug']);
  gulp.watch(['public/images/*'], ['images']);
  gulp.watch(['public/components/components.html'], ['vulcanize']);

  return $.nodemon({
    script: 'bin/www',
    ext: 'js ejs json',
    ignore: ['public', 'build']
  });
});

// Build Production Files, the Default Task
gulp.task('default', ['clean'], function (callback) {
  runSequence(
    ['copy', 'styles', 'scripts'],
    'images', 'vulcanize', 'precache',
    callback);
});

gulp.task('default-debug', ['clean'], function (callback) {
  runSequence(
    ['copy', 'styles-debug', 'scripts-debug'],
    'images', 'vulcanize', 'precache',
    callback);
});
