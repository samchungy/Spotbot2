const gulp = require('gulp');
const merge = require('gulp-merge-json');
const rename = require('gulp-rename');
const glob = require('glob-promise');
const shell = require('shelljs');

const layersRegex = {
  0: /^src\/layers\/(.*?)\//,
  1: /^(.*?)\//,
};
const layerDestination = '/opt';

gulp.task('update-node-modules', async () => {
  const folders = await glob(`layers/**/nodejs/package.json`)
      .then((files) => {
        return files.map((file) => file.replace('/package.json', ''));
      })
      .catch((error) => {
        console.error(error);
        throw error;
      });
  const updatePromises = folders.map((folder) => {
    return new Promise((resolve, reject) => {
      shell.exec(`cd ${folder} && ncu -u -e 1 --packageFile package.json && npm i && npm audit fix`, function(code, stdout, stderr) {
        if (stderr === 0) {
          reject(new Error('ncu failed'));
        }
        resolve();
      });
    });
  });
  await Promise.all(updatePromises);
});

gulp.task('update-local-layers', async () => {
  gulp.src(`layers/**/nodejs/package.json`)
      .pipe(merge())
      .pipe(rename('package.json'))
      .pipe(gulp.dest('./layers/local-layers/nodejs'));
});

gulp.task('watch-copy-layers-to-opt', () => {
  const copyFile = (path) => {
    const base = path.match(layersRegex[0])[0]; // Matches layers/*/ to remove eg. layers/layers-core
    gulp.src(path, {base: base})
        .pipe(gulp.dest(layerDestination));
  };

  const copyAllFiles = () => {
    shell.exec('./copy-all-files.sh');
  };

  copyAllFiles();
  const layerWatcher = gulp.watch(`src/layers/*/**/*`);
  layerWatcher
      .on('add', (path, stats) => {
        copyFile(path);
      })
      .on('change', (path, stats) => {
        copyFile(path);
      })
      .on('unlink', () => copyAllFiles());
});

gulp.task('update', gulp.series('update-node-modules', 'update-local-layers'));

gulp.task('local', gulp.series('update-local-layers', 'watch-copy-layers-to-opt'));
