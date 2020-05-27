#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const DEST_DIR = [
  {
    name: 'chrome',
    dir: path.join(__dirname, '../dist/chrome'),
  },
  {
    name: 'firefox',
    dir: path.join(__dirname, '../dist/firefox'),
  },
  {
    name: 'web',
    dir: path.join(__dirname, '../dist/web'),
  },
];
const DEST_ZIP_DIR = path.join(__dirname, '../dist-zip');

const extractExtensionData = () => {
  const extPackageJson = require('../package.json');

  return {
    name: extPackageJson.name,
    version: extPackageJson.version,
  };
};

const makeDestZipDirIfNotExists = () => {
  if (!fs.existsSync(DEST_ZIP_DIR)) {
    fs.mkdirSync(DEST_ZIP_DIR);
  }
};

const buildZip = (src, dist, zipFilename) => {
  console.info(`Building ${zipFilename}...`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(path.join(dist, zipFilename));

  return new Promise((resolve, reject) => {
    archive
      .directory(src, false)
      .on('error', err => reject(err))
      .pipe(stream);

    stream.on('close', () => resolve());
    archive.finalize();
  });
};

const main = () => {
  DEST_DIR.forEach((build, index) => {
    const { name, version } = extractExtensionData();
    const zipFilename = `${name}-${build.name}-v${version}.zip`;

    makeDestZipDirIfNotExists();

    buildZip(build.dir, DEST_ZIP_DIR, zipFilename)
      .then(() => console.info('OK'))
      .catch(console.err);
  });
};

main();
