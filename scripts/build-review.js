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

  // 2) Deterministic chunk/asset names are enforced in vite.config.mts for the
  //    extension (un-hashed). REVIEW_BUILD also stabilizes env-driven values.
  process.env.NODE_ENV = 'production';
  process.env.REVIEW_BUILD = 'true';
  process.env.IS_FIREFOX_EXT = process.env.IS_FIREFOX_EXT || 'true';

  // 3) Run the Vite extension build (Firefox). The `html` pass emits a bundle
  //    treemap + raw stats into artifacts/review via rollup-plugin-visualizer.
  console.log('Generating build and bundle stats...');
  run('node scripts/build-extension.mjs firefox');

  // 4) The bundle treemap is written directly by the visualizer plugin to
  //    artifacts/review/bundle-stats.html. Save a simple file list next.
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
