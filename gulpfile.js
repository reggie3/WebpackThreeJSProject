var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var gutil = require('gulp-util');   //provides various utilities like logging, file creation, etc
var concat = require('gulp-concat'); //concats files
var jshint = require('gulp-jshint'); // code analysis
var del = require('del');  //removes files and folders
var uglify = require('gulp-uglify');   //file minification
var plumber = require('gulp-plumber'); //used to pipe streams and prevent pipe breaking errors
var useref = require('gulp-useref');  //used to replace references to individual js files
var uglifycss = require('gulp-uglifycss');
var connect = require('gulp-connect'); //create local and remote servers
var scp = require('gulp-scp2');   //used for deployment to server
var jade = require('gulp-jade');    //compile jade files
var watch = require('gulp-watch');
var mainBowerFiles = require('main-bower-files');
var filter = require('gulp-filter');
var uglifycss = require('gulp-uglifycss');
var inject = require('gulp-inject');
var order = require("gulp-order");  //allows us to set the order of file concats
var bower = require('gulp-bower');   //used to run bower commands
var sass = require('gulp-sass');
var runSequence = require('gulp-run-sequence');
var stylish = require('jshint-stylish');
var scp = require('gulp-scp2');
var htmlmin = require('gulp-htmlmin');
var babel = require('gulp-babel');
var print = require('gulp-print');
var webpack = require('webpack-stream');
var typescript = require('gulp-typescript');
var named = require('vinyl-named');
var sourcemaps = require('gulp-sourcemaps');
var tslint = require('gulp-tslint');

var tsProject = typescript.createProject('./tsconfig.json');
var secrets = require('./secrets.json');
var myConfig = require('./myConfig.json');


// GLOBALS
// array of libraries to not concat
var noConcat = [''];//['three.js'];
var jsFilesSource = './source/scripts/vendor/';
//the strings created for those libraries
var noConcatStrings = [];
var copyPaths = [];
noConcat.forEach(function (file) {
    noConcatStrings.push('!' + jsFilesSource + file);
    copyPaths.push(jsFilesSource + file);
})

gulp.task('default', function () {
    // place code for your default task here
});


gulp.task('deploy', function(){
    return gulp.src('./dist/**/*')
    .pipe(plumber())
    .pipe(scp({
      //edit secrets.json file for the following params
      host: secrets.deploy.hostname,
      username: secrets.deploy.username,
      password: secrets.deploy.password,
      dest: secrets.deploy.destination
    }))
    .on('error', function (err) {
      console.log(err);
    });
});

gulp.task('minidist', function(){
    return gulp.src('dist/*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'));
});

gulp.task('builddist', function(){
    runSequence(
        'cleandist',   //delete everything in the dist directory
        'sass',         //compile scss files to css
        'jade',         //complie jade files to html
        'inject',       //inject js and css files into html files
        'useref',       //replace links to files in source directories to point to the correct place in the dist directories.  Also copies html files to dist directories    
        ['distvendorjs', 'distmyjs', 'distmycss', 'distassets']
    )
});

//delete everything from the dist directory
gulp.task('cleandist', function () {
    del("dist/*");
});

//uninstall all vendor js files and clean out the vendor js directory
gulp.task('cleanvendorjs', function(){
    del("source/scripts/vendor/*.js");
});

//copy vendor javascript files from source javascript vendor directory to scripts directory for distribution
gulp.task('distvendorjs', function () {

    var jsFiles = ['source/scripts/vendor/*.js'];
    var dest = ['dist/scripts'];

    gulp.src(jsFiles)
        .pipe(order([
            "jquery.js",    //jquery needs to be at the top
            "*.js"
        ]))
        .pipe(concat('vendor.js'))
        .pipe(uglify())
        .pipe(gulp.dest(dest + ""));
});

//copy the assets folder to distribution
gulp.task('distassets', function(){
    var assets = ['source/assets/**/*'];
    var dest = ['dist/assets'];
      gulp.src(assets)
        .pipe(gulp.dest(dest + ""));
});



// copy my custom css file and vendor css files from source to dist directory
gulp.task('distcss', function(){
    runSequence(
        ['distmycss', 'distvendorcss']
    );
})
//copy my custom css file from source css directory to the dist css directory 
gulp.task('distmycss', function () {

    var myCSSFile = ['source/css/mycss.css'];
    var dest = ['dist/css'];

    gulp.src(myCSSFile)
        .pipe(autoprefixer({
            browsers: ['> 5%'],
            cascade: false
        }))
        .pipe(uglifycss())
        .pipe(gulp.dest(dest + ""));
});

// copy my javscript files and vendor javscript files from source to dist directory
gulp.task('distjs', function(){
    runSequence(
        ['distmyjs', 'distvendorjs']
    );
})

//copy custom javascript files from the source directory to scripts directory for distribution
gulp.task('distmyjs', function () {

    var jsFiles = ['source/scripts/myjs/*.js'];
    var dest = ['dist/scripts'];

    gulp.src(jsFiles)
        .pipe(filter('*.js'))
        //.pipe(concat('myjs.js'))
        .pipe(webpack())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(uglify())
        .pipe(gulp.dest(dest + ""));
});
//copy vendor css files from bower source directory to dist css directory for distribution
gulp.task('distvendorcss', function () {

    var cssFiles = ['source/scripts/vendor/*.css'];
    var dest = ['dist/css'];

    gulp.src(mainBowerFiles().concat(cssFiles))
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(filter('*.css'))
        .pipe(concat('vendor.css'))
        .pipe(autoprefixer({
            browsers: ['> 5%'],
            cascade: false
        }))
        .pipe(uglifycss())
        .pipe(gulp.dest(dest + ""));
});


//build the source
gulp.task('buildsource', function(){
    runSequence(
        ['jade', 'inject'],
        'typescript',
        'webpack'
    )
})


//copy vendor javascript files from  source directory to source scripts directory for devlopment
gulp.task('sourcevendorjs', function () {

    var jsFiles = ['source/scripts/vendor/*.js'];
    var dest = ['source/scripts/vendor'];

    gulp.src(mainBowerFiles().concat(jsFiles))
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(filter('*.js'))
        .pipe(uglify())
        .pipe(gulp.dest(dest + ""));
});

//compile my typescript files and then webpack the js files
gulp.task('compilejs', ['typescript', 'webpack']);

//webpack my js files
gulp.task('webpack', function () {
    var jsFiles = ['./source/scripts/myjs/**/*.js'];
    var dest = ['./source/scripts/'];

    return gulp.src(jsFiles)
        .pipe(print())
        .pipe(named())
        .pipe(webpack({
            devtool: 'source-map',
            output: {
                filename: 'bundle.js',
            }
        }))
        .pipe(gulp.dest(dest + ""));
});

/***********************************************
 * Typescript Stuff
 */
//compile typescript files
gulp.task('typescript', function () {

    var tsFiles = [myConfig.paths.tsIn];
    var dest = [myConfig.paths.myJSOut];
    //console.log(tsFiles);
    
    var tsResult = gulp.src(tsFiles)
        //.pipe(print())
        .pipe(sourcemaps.init())
        .pipe(typescript(tsProject));
        

    return tsResult.js
        .pipe(concat('bundle.js')) // You can use other plugins that also support gulp-sourcemaps 
        .pipe(sourcemaps.write()) // Now the sourcemaps are added to the .js file 
        .pipe(gulp.dest(dest + ""));
    //remove js files from ts directory
    del(myConfig.paths.tsInPath + "*.js");
});

gulp.task('tslint', function(){
    return gulp.src("./source/scripts/ts/**/*.ts").pipe(tslint()).pipe(tslint.report('prose'));
});

gulp.task('tsclean', function(){
     del(myConfig.paths.tsInPath + "*.js");
});
/***********************************************
 * End Typescript Stuff
 */


//copy vendor css files from bower source directory to source css directory for development
gulp.task('sourcevendorcss', function () {

    var cssFiles = ['source/scripts/vendor/**/*.css'];
    var dest = ['source/css'];

    gulp.src(mainBowerFiles())
        .pipe(filter('*.css'))
        .pipe(gulp.dest(dest + ""));
});

//copy vendor scss files from bower source directory to source font directory for development
gulp.task('sourcevendorscss', function () {

    var scssFiles = ['source/scripts/vendor/**/*.scss'];
    var dest = ['source/scss/vendor'];

    gulp.src(mainBowerFiles())
        .pipe(filter('*.scss'))
        .pipe(gulp.dest(dest + ""));
});
//copy bootstrap font files from bower source directory to source font directory for development
gulp.task('sourcevendorfonts', function () {

    var fonts = ['source/scripts/vendor/bootstrap/fonts/*.*'];
    var dest = ['source/fonts'];

    gulp.src(fonts)
        .pipe(gulp.dest(dest + ""));
});

// create a dev server that updates when relavent source files change
gulp.task('browsersync', function () {
    browserSync.init({
        server:  "./source/",    //serve from the source directory
        browser: "google chrome",
        reloadDelay: 1000,
    });
    //watch for changes in the my javascript & vendor javascript, html, and css files & any asset changes
    gulp.watch([
        "./source/*.html",
        "./source/scripts/myjs/*.js",
        "./source/scripts/vendor/*.js",
        "./source/css/*.css",
        "./source/fonts/*.*"
    ])
    .on('change', browserSync.reload);  
});

//compile, concat, and autoprefix sass files and copy them to the source css direcotry
gulp.task('sass', function(){
    gulp.src('source/scss/**/*.scss')
    .pipe(plumber({
        errorHandler: onError
    }))
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('main.css'))
    .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
    .pipe(gulp.dest('source/css/'))
});

//replace useref calls in html files.  This puts links to the correct javascript files in the the dist directory. 
// typically run it after running the jade command
gulp.task('useref', function(){
    return gulp.src(['./source/**/*.html'])
        .pipe(useref())
        .pipe(gulp.dest('dist'));
});


//run jade compilation then injection in order
gulp.task('jadeinject', ['jade', 'inject'])

//compile the jade files into html files
gulp.task('jade', function (callback) {
    var YOUR_LOCALS = {};
    
    //get all the jade files in the jade directory and its subdirectory, but don't get jade includes
    var stream = gulp.src(['./source/jade/**/*.jade', '!./source/jade/jadeIncludes/**/*'])
        .pipe(plumber({
        errorHandler: onError
        }))
        .pipe(jade({
            pretty: true,
            locals: YOUR_LOCALS
        }))
        .pipe(gulp.dest('./source/'));
        
    return stream;
});

// inject links to javascript and css files into the jade header file
gulp.task('inject', ['jade'], function(){
    
    var myjsSources = gulp.src('source/scripts/bundle.js', { read: false });
    // don't put the js libraries that we're not going to concat inside a build section
    //  that will be replaced by useref later
    var vendorSources =  
        gulp.src(['source/scripts/vendor/jquery.js', 'source/scripts/vendor/*.js'].concat(noConcatStrings), 
            { read: false }
        );
    var mycssSources = gulp.src('source/css/mycss.css', { read: false });
    var vendorcssSources = gulp.src(['source/css/*.css', '!source/css/mycss.css'], { read: false });
    
    var stream = gulp.src('source/*.html')
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(inject(vendorSources, {relative: true, name: "vendor"}))
        .pipe(inject(myjsSources, {relative: true, name: "bundle"}))
        .pipe(inject(mycssSources, {relative: true, name: "mycss"}))
        .pipe(inject(vendorcssSources, {relative: true, name: "vendor"}))
        //copyPaths holds the path of each js library that will be copied directly, and not concated or replaced by an useref injection later
        .pipe(inject(gulp.src(copyPaths), {relative: true, name: "noMoleste"}))
        .pipe(gulp.dest('./source/'));
        
    return stream;
});

// Watch Files For Changes
gulp.task('watch', function () {
    watch(['./source/jade/*.jade', './source/jade/jadeIncludes/*.jade'], 
        { usePolling: true }, function () {
            gulp.start('jadeinject');
    })
    
    //watch the source scripts vendor directory for changes and copy main javascript files to it root for use during development
    watch(['./source/scripts/vendor/**/*.js'], { usePolling: true }, function () {
        gutil.log('vendor js files changed', gutil.colors.magenta('123'));
        gulp.start('sourcevendorjs');
    });
    
    //watch scss files and compile them when the change
    watch(['./source/scss/**/*.scss'], { usePolling: true }, function () {
        gulp.start('sass');
    });
    
    //wathc and compile typescript files
    watch(["./source/scripts/ts/*.ts"], function(){
        gulp.start('compilejs'); //, 'webpack']);
    });
});

/****************************************
 * Utilities
 */

//open dev files in server
gulp.task('connectDev', function () {
    connect.server({
        root: ['source'],
        port: 8000,
        livereload: true
    });
});
 
//open dist files in server 
gulp.task('connectDist', function () {
    connect.server({
        root: 'dist',
        port: 8001,
        livereload: true
    });
});

//lint my js files
gulp.task('lint', function() {
  return gulp.src('./source/scripts/myjs/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

//Erro funciton that emits a beep sound and logs an error
var onError = function (err) {  
  gutil.beep();
  console.log(err);
};