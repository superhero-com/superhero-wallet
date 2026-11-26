/* eslint-disable no-console */
import { spawn } from 'node:child_process';
import {
  cp, mkdir, mkdtemp, readFile, rm,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = fileURLToPath(new URL('..', import.meta.url));
const { values } = parseArgs({
  options: {
    destination: { type: 'string' },
    baseline: { type: 'boolean', default: false },
  },
});

function run(command, args, cwd, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    });
    let output = '';
    child.stdout?.on('data', (chunk) => { output += chunk; });
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code !== 0) {
        reject(new Error(`${command} ${args[0]} failed (${signal || code})`));
        return;
      }
      resolve(output);
    });
  });
}

async function simulatorDestination() {
  const output = await run('xcrun', ['simctl', 'list', 'devices', 'available', '--json'], root, true);
  const { devices } = JSON.parse(output);
  const available = Object.entries(devices)
    .filter(([runtime]) => runtime.includes('.iOS-'))
    .flatMap(([, entries]) => entries)
    .filter((device) => device.isAvailable && /^(iPhone|iPad)\b/.test(device.name));
  const device = available.find((entry) => entry.state === 'Booted') || available[0];
  if (!device) throw new Error('No available iOS simulator. Install an iOS runtime in Xcode.');
  console.log(`Using ${device.name} (${device.udid})`);
  return `platform=iOS Simulator,id=${device.udid}`;
}

let scratch;
try {
  if (process.platform !== 'darwin') {
    throw new Error('Native splash tests require macOS, Xcode and an iOS simulator; no native tests ran.');
  }

  const destination = values.destination || await simulatorDestination();
  const installed = path.join(root, 'node_modules/@capacitor/splash-screen');
  const { version } = JSON.parse(await readFile(path.join(installed, 'package.json'), 'utf8'));
  scratch = await mkdtemp(path.join(os.tmpdir(), 'wallet-ios-splash-'));
  const staged = path.join(scratch, 'node_modules/@capacitor/splash-screen');
  await mkdir(staged, { recursive: true });
  await Promise.all([
    cp(path.join(installed, 'Package.swift'), path.join(staged, 'Package.swift')),
    cp(path.join(installed, 'ios'), path.join(staged, 'ios'), { recursive: true }),
  ]);

  if (values.baseline) {
    const patch = path.join(root, `patches/@capacitor+splash-screen+${version}.patch`);
    await run('git', ['apply', '--reverse', '--check', patch], scratch);
    await run('git', ['apply', '--reverse', patch], scratch);
    console.log('Testing unpatched source; geometry assertions should fail.');
  }

  await cp(
    path.join(root, 'tests/ios/splash-screen/SplashScreenGeometryTests.swift'),
    path.join(staged, 'ios/Tests/SplashScreenPluginTests/SplashScreenGeometryTests.swift'),
  );

  const results = path.join(root, 'artifacts', `ios-splash-${Date.now()}.xcresult`);
  await mkdir(path.dirname(results), { recursive: true });
  console.log(`Testing installed splash-screen ${version}; results: ${results}`);
  const argumentsForXcode = [
    'test',
    '-scheme', 'CapacitorSplashScreen',
    '-configuration', 'Debug',
    '-destination', destination,
    '-derivedDataPath', path.join(scratch, 'DerivedData'),
    '-resultBundlePath', results,
    '-parallel-testing-enabled', 'NO',
    'ENABLE_TESTABILITY=YES',
    'CODE_SIGNING_ALLOWED=NO',
  ];
  if (values.baseline) {
    argumentsForXcode.push('-only-testing:SplashScreenPluginTests/SplashScreenGeometryTests/testStatusBarOffsetsKeepSplashInWindowCoordinates');
  }
  await run('xcodebuild', argumentsForXcode, staged);
  console.log('Native splash tests passed.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (scratch) await rm(scratch, { recursive: true, force: true });
}
