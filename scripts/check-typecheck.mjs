/* eslint-disable no-console */
// Fails when vue-tsc reports more errors than the known baseline, so new code adds none.
import { spawnSync } from 'child_process';

const BASELINE = 71;

const {
  stdout,
  stderr,
  status,
  error,
} = spawnSync('npx', ['vue-tsc', '--noEmit', '-p', 'tsconfig.json'], {
  encoding: 'utf8',
  shell: true,
});

function fail(reason) {
  console.log(`vue-tsc: ${reason}`);
  if (stdout) console.log(stdout);
  if (stderr) console.log(stderr);
  process.exit(1);
}

// A tool that did not run must not pass as "no new errors".
if (error) fail(`could not run (${error.message})`);
if (status === null) fail('was terminated before finishing');

const output = `${stdout}${stderr}`;
const errors = output.split('\n').filter((line) => /error TS\d+/.test(line));

if (status !== 0 && !errors.length) fail(`exited with ${status} without reporting type errors`);
// A tsconfig error leaves the types unchecked, its single error would pass under the baseline.
// Some of these codes are reported for source files too, e.g. TS5076. TS6053 is a missing file.
const configErrors = errors.filter((line) => /error TS(5\d{3}|6053|18003):/.test(line));
if (configErrors.length) {
  fail(`reported an error that can mean tsconfig.json was not applied:\n${configErrors.join('\n')}`);
}

console.log(`vue-tsc: ${errors.length} errors (baseline ${BASELINE})`);
if (errors.length > BASELINE) {
  console.log(errors.join('\n'));
  process.exit(1);
}
if (errors.length < BASELINE) {
  console.log(`Lower BASELINE in scripts/check-typecheck.mjs to ${errors.length}.`);
}
