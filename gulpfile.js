const gulp = require(`gulp`);
const plumber = require(`gulp-plumber`);
const sourcemap = require(`gulp-sourcemaps`);
const sass = require(`gulp-sass`);
const postcss = require(`gulp-postcss`);
const autoprefixer = require(`autoprefixer`);
const server = require(`browser-sync`).create();
const csso = require(`gulp-csso`);
const rename = require(`gulp-rename`);
const imagemin = require(`gulp-imagemin`);
const webp = require(`gulp-webp`);
const svgstore = require(`gulp-svgstore`);
const del = require(`del`);
// const webpackStream = require(`webpack-stream`);
// const webpackConfig = require(`./webpack.config.js`);
const fileinclude = require(`gulp-file-include`);

const html = () => {
  return gulp.src([`source/*.html`])
    .pipe(fileinclude({
      prefix: `@@`,
      basepath: `@root`,
      context: { // глобальные переменные для include
        test: `text`
      }
    }))
    .pipe(gulp.dest(`build`));
};

const css = () => {
  return gulp.src('source/sass/style.scss')
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([autoprefixer({
      grid: true,
    })]))
    .pipe(gulp.dest('build/css'))
    .pipe(csso())
    .pipe(rename('style.min.css'))
    .pipe(sourcemap.write('.'))
    .pipe(gulp.dest('build/css'))
    .pipe(server.stream());
};

const js = () => {
  return gulp.src(['source/js/**/*.js'])
    // .pipe(webpackStream(webpackConfig))
    .pipe(gulp.dest('build/js'))
};

const svgo = () => {
  return gulp.src('source/img/**/*.{svg}')
    .pipe(imagemin([
      imagemin.svgo({
        plugins: [
          {removeViewBox: false},
          {removeRasterImages: true},
          {removeUselessStrokeAndFill: false},
        ]
      }),
    ]))
    .pipe(gulp.dest('source/img'));
};

const sprite = () => {
  return gulp.src('source/img/sprite/*.svg')
    .pipe(svgstore({inlineSvg: true}))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('build/img'));
};

const copySvg = () => {
  return gulp.src('source/img/**/*.svg', {base: 'source'})
    .pipe(gulp.dest('build'));
};

const copyImages = () => {
  return gulp.src('source/img/**/*.{png,jpg,webp}', {base: 'source'})
    .pipe(gulp.dest('build'));
};

const optimizeImages = () => {
  return gulp.src('build/img/**/*.{png,jpg}')
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.mozjpeg({quality: 85, progressive: true}),
    ]))
    .pipe(gulp.dest('build/img'));
};

const copy = () => {
  return gulp.src([
      'source/fonts/**',
      'source/img/**',
      'source/files/**',
      'source/favicon/**',
    ], {
      base: 'source',
    })
    .pipe(gulp.dest('build'));
};

const createWebp = () => {
  const root = '';
  return gulp.src(`source/img/${root}**/*.{png,jpg}`)
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest(`source/img/${root}`));
};

const clean = () => {
  return del('build');
};

const syncServer = () => {
  server.init({
    server: 'build/',
    notify: false,
    open: true,
    cors: true,
    ui: false,
  });

  gulp.watch('source/*.html', gulp.series(html, refresh));
  gulp.watch('source/sass/**/*.{scss,sass}', gulp.series(css, refresh));
  gulp.watch('source/js/**/*.{js,json}', gulp.series(js, refresh));
  gulp.watch('source/files/**/*.{js,json}', gulp.series(copy, refresh));
  gulp.watch('source/img/**/*.svg', gulp.series(copySvg, sprite, html, refresh));
  gulp.watch('source/img/**/*.{png,jpg,webp}', gulp.series(copyImages, html, refresh));
  gulp.watch('source/favicon/**', gulp.series(copy, refresh));
};

const refresh = (done) => {
  server.reload();
  done();
};

const start = gulp.series(clean, svgo, copy, css, sprite, js, html, syncServer);

const build = gulp.series(clean, svgo, copy, css, sprite, js, html, optimizeImages);

exports.imagemin = optimizeImages;
exports.webp = createWebp;
exports.start = start;
exports.build = build;
