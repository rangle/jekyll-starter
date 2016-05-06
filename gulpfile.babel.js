import {src, dest, watch, parallel, series} from 'gulp';
import atimport from 'postcss-import';
import babel from 'gulp-babel';
import browserSync from 'browser-sync';
import cssnext from 'postcss-cssnext';
import del from 'del';
import discardcomments from 'postcss-discard-comments';
import gulpif from 'gulp-if';
import gutil from 'gulp-util';
import htmlmin from 'gulp-htmlmin';
import nano from 'gulp-cssnano';
import nested from 'postcss-nested';
import postcss from 'gulp-postcss';
import rename from 'gulp-rename';
import sourcemaps from 'gulp-sourcemaps';
import cp from 'child_process';
import yargs from 'yargs';

// Build Directories
// ----------------------------------------
const dirs = {
  dest: 'dist',
  jekyll: '_site',
  root: './',
  src: 'src',
};

// File Sources
// ----------------------------------------
const sources = {
  content: `${dirs.root}/**/*.{md,html}`,
  jekyll: [
    `${dirs.jekyll}/*.{md,markdown,html.liquid,html,png,jpg,svg,gif}`,
    '_config.yml',
  ],
  scripts: `${dirs.src}/scripts/index.js`,
  styles: `${dirs.src}/styles/index.css`,
};

// Recognise `--production` argument
const argv = yargs.argv;
const production = !!argv.production;

// Main Tasks
// ----------------------------------------

// Styles
const processors = [
  atimport,
  cssnext(),
  discardcomments,
  nested,
];

export const buildStyles = () => src(sources.styles)
  .pipe(postcss(processors))
  .pipe(gulpif(production, nano()))
  .pipe(rename({ basename: 'main' }))
  .pipe(dest(dirs.dest));

// Scripts
export const buildScripts = () => src(sources.scripts)
  .pipe(sourcemaps.init())
  .pipe(babel({ 'presets': ['es2015'] }))
  .pipe(rename({ basename: 'main' }))
  .pipe(sourcemaps.write('.'))
  .pipe(dest(dirs.dest));

export const buildJekyll = () => {
  const jekyll = cp.spawn(
    'bundle', ['exec', 'jekyll', 'build', '--watch', '--drafts', '--quiet']
  );

  const jekyllLogger = (buffer) => {
    buffer.toString()
      .split(/\n/)
      .forEach((message) => gutil.log(`Jekyll: ${message}`));
  };

  jekyll.stdout.on('data', jekyllLogger);
  jekyll.stderr.on('data', jekyllLogger);
};

// Post-Jekyll
export const postJekyll = () => src(sources.jekyll)
  .pipe(htmlmin({ collapseWhitespace: true }))
  .pipe(dest('_site'));

// Clean
export const clean = () => del(dirs.dest);

// Serve Task
export const serve = () => {
  browserSync.init({
    files: [`${dirs.jekyll}/**`],
    port: 3000,
    server: {
      baseDir: dirs.jekyll,
    },
  });

  watch(sources.styles, buildStyles);
  watch(sources.scripts, buildScripts);
  watch(sources.jekyll, buildJekyll);
};

// Development Task
export const dev = (
  series(
    clean,
    parallel(
      buildStyles,
      buildScripts,
      buildJekyll,
      serve
    )
  )
);

// Serve Task
export const build = (
  series(
    clean,
    parallel(
      buildStyles,
      buildScripts,
      buildJekyll
    ),
    postJekyll
  )
);

// Default task
export default dev;
