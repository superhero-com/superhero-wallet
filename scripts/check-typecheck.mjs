/* eslint-disable no-console */
// Fails when vue-tsc reports more errors than the known baseline, so new code adds none.
import { spawnSync } from 'child_process';

const BASELINE = 71;

const { stdout, stderr } = spawnSync('npx', ['vue-tsc', '--noEmit', '-p', 'tsconfig.json'], {
  encoding: 'utf8',
  shell: true,
});
const errors = `${stdout}${stderr}`.split('\n').filter((line) => /error TS\d+/.test(line));

console.log(`vue-tsc: ${errors.length} errors (baseline ${BASELINE})`);
if (errors.length > BASELINE) {
  console.log(errors.join('\n'));
  process.exit(1);
}
if (errors.length < BASELINE) {
  console.log(`Lower BASELINE in scripts/check-typecheck.mjs to ${errors.length}.`);
}
