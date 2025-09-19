#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

const DEST_DIR = [
  {
    name: 'extension',
    dir: path.join(__dirname, '../dist/extension'),
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

const buildCompositeZip = (entries, dist, zipFilename) => {
  console.info(`Building ${zipFilename}...`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(path.join(dist, zipFilename));

  return new Promise((resolve, reject) => {
    archive.on('error', (err) => reject(err)).pipe(stream);

    entries.forEach((entry) => {
      if (!fs.existsSync(entry.src)) return;
      if (entry.type === 'dir') {
        archive.directory(entry.src, entry.dest || false);
      } else if (entry.type === 'file') {
        archive.file(entry.src, { name: entry.dest || path.basename(entry.src) });
      }
    });

    stream.on('close', () => resolve());
    archive.finalize();
  });
};

const runReviewBuildIfNeeded = () => {
  try {
    const reviewDir = path.join(__dirname, '../artifacts/review');
    const hasDeps = fs.existsSync(path.join(reviewDir, 'dependencies.json'));
    const hasCommit = fs.existsSync(path.join(reviewDir, 'COMMIT_SHA.txt'));
    if (hasDeps && hasCommit) return; // already present
  } catch (_) {}
  console.info('Generating review artifacts...');
  execSync('npm run build:review:ff --silent', { stdio: 'inherit' });
};

const main = () => {
  DEST_DIR.forEach((build) => {
    const { name, version } = extractExtensionData();
    const zipFilename = `${name}-${build.name}-v${version}.zip`;

    makeDestZipDirIfNotExists();

    buildZip(build.dir, DEST_ZIP_DIR, zipFilename)
      .then(() => console.info('OK'))
      .catch(console.err);
  });

  // Build source + provenance bundle for review/release
  const { name, version } = extractExtensionData();
  runReviewBuildIfNeeded();

  const sourceEntries = [
    // Code and config
    { type: 'dir', src: path.join(__dirname, '../src'), dest: 'src' },
    { type: 'dir', src: path.join(__dirname, '../public'), dest: 'public' },
    { type: 'dir', src: path.join(__dirname, '../config'), dest: 'config' },
    { type: 'dir', src: path.join(__dirname, '../scripts'), dest: 'scripts' },
    { type: 'dir', src: path.join(__dirname, '../plugins'), dest: 'plugins' },
    { type: 'dir', src: path.join(__dirname, '../docs'), dest: 'docs' },
    { type: 'dir', src: path.join(__dirname, '../tests'), dest: 'tests' },
    { type: 'file', src: path.join(__dirname, '../package.json'), dest: 'package.json' },
    { type: 'file', src: path.join(__dirname, '../package-lock.json'), dest: 'package-lock.json' },
    { type: 'file', src: path.join(__dirname, '../vue.config.js'), dest: 'vue.config.js' },
    { type: 'file', src: path.join(__dirname, '../babel.config.js'), dest: 'babel.config.js' },
    { type: 'file', src: path.join(__dirname, '../tsconfig.json'), dest: 'tsconfig.json' },
    { type: 'file', src: path.join(__dirname, '../jest.config.js'), dest: 'jest.config.js' },
    { type: 'file', src: path.join(__dirname, '../cypress.config.js'), dest: 'cypress.config.js' },
    { type: 'file', src: path.join(__dirname, '../capacitor.config.ts'), dest: 'capacitor.config.ts' },
    { type: 'file', src: path.join(__dirname, '../ionic.config.json'), dest: 'ionic.config.json' },
    { type: 'file', src: path.join(__dirname, '../README.md'), dest: 'README.md' },
    { type: 'file', src: path.join(__dirname, '../.env.production'), dest: '.env.production' },
    // Provenance artifacts
    { type: 'dir', src: path.join(__dirname, '../artifacts/review'), dest: 'artifacts/review' },
  ];

  const sourceZip = `${name}-source-with-provenance-v${version}.zip`;
  makeDestZipDirIfNotExists();
  buildCompositeZip(sourceEntries, DEST_ZIP_DIR, sourceZip)
    .then(() => console.info('OK'))
    .catch(console.err);
};

main();
