/* eslint-disable no-console */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts }).trim();
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function main() {
  // 1) Capture commit SHA (if repo present) and lockfile snapshot
  let commit = 'unknown';
  try {
    commit = run('git rev-parse HEAD');
  } catch (e) { commit = 'unknown'; }

  const pkgLockPath = path.resolve(process.cwd(), 'package-lock.json');
  const hasPkgLock = fs.existsSync(pkgLockPath);

  const provenanceDir = path.resolve(process.cwd(), 'artifacts', 'review');
  fs.mkdirSync(provenanceDir, { recursive: true });
  fs.writeFileSync(path.join(provenanceDir, 'COMMIT_SHA.txt'), `${commit}\n`);
  if (hasPkgLock) {
    fs.copyFileSync(pkgLockPath, path.join(provenanceDir, 'package-lock.json'));
  }

  // 2) Ensure deterministic chunk/asset names (already enforced in vue.config.js for extension)
  //    For review builds, we also disable any runtime salt if present via env flag.
  process.env.NODE_ENV = 'production';
  process.env.REVIEW_BUILD = 'true';
  process.env.PLATFORM = process.env.PLATFORM || 'extension';
  process.env.IS_FIREFOX_EXT = process.env.IS_FIREFOX_EXT || 'true';

  // 3) Generate webpack stats.json
  console.log('Generating build and webpack stats...');
  // vue-cli-service supports --stats-json and --report (html+json)
  run('npx vue-cli-service build --stats-json --report');

  // 4) Move stats to artifacts and copy dist output manifest-like listing
  const statsJson = path.resolve(process.cwd(), 'dist', 'stats.json');
  const reportHtmlCandidates = [
    path.resolve(process.cwd(), 'dist', 'report.html'),
    path.resolve(process.cwd(), 'dist', 'extension', 'firefox', 'report.html'),
  ];
  const reportJsonCandidates = [
    path.resolve(process.cwd(), 'dist', 'report.json'),
    path.resolve(process.cwd(), 'dist', 'extension', 'firefox', 'report.json'),
  ];

  const statsDest = path.join(provenanceDir, 'webpack.stats.json');
  const reportHtmlDest = path.join(provenanceDir, 'webpack.report.html');
  const reportJsonDest = path.join(provenanceDir, 'webpack.report.json');

  if (fs.existsSync(statsJson)) fs.copyFileSync(statsJson, statsDest);

  function copyFirstExisting(candidates, dest) {
    const removeIfUnderExtension = (srcPath) => {
      const extensionDir = path.resolve(process.cwd(), 'dist', 'extension');
      if (srcPath.startsWith(extensionDir)) {
        try { fs.unlinkSync(srcPath); } catch (err) { console.warn('Could not remove analyzer file:', srcPath); }
      }
    };

    let found = false;
    candidates.some((src) => {
      if (!fs.existsSync(src)) return false;
      fs.copyFileSync(src, dest);
      removeIfUnderExtension(src);
      found = true;
      return true;
    });
    return found;
  }

  copyFirstExisting(reportHtmlCandidates, reportHtmlDest);
  copyFirstExisting(reportJsonCandidates, reportJsonDest);
  // Save a simple file list
  const distDir = path.resolve(process.cwd(), 'dist', 'extension', 'firefox');
  const list = [];
  function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      const rel = path.relative(distDir, full).replace(/\\/g, '/');
      if (entry.isDirectory()) walk(full);
      else list.push(rel);
    });
  }
  if (fs.existsSync(distDir)) walk(distDir);
  fs.writeFileSync(path.join(provenanceDir, 'dist-file-list.txt'), list.sort().join('\n'));

  // 5) SBOM / dependency list via npm ls --json
  console.log('Collecting dependency tree (npm ls)...');
  let depTree = {};
  try {
    depTree = JSON.parse(run('npm ls --all --json'));
  } catch (e) {
    depTree = { error: e.message };
  }
  writeJson(path.join(provenanceDir, 'dependencies.json'), depTree);

  console.log('Review build artifacts written to artifacts/review');
}

main();
