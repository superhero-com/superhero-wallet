/* eslint-disable no-console */
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

export type Platform = 'web' | 'extension' | 'ionic';

const parseBool = (val?: string): boolean => (val ? JSON.parse(val) : false);

function readJson(relPath: string): any {
  return JSON.parse(readFileSync(path.resolve(process.cwd(), relPath), 'utf-8'));
}

/**
 * Build the `define` map that replaces `process.env.*` tokens at build time,
 * porting the webpack DefinePlugin block from the old `vue.config.js`.
 *
 * Source code keeps reading `process.env.X` literally; Vite performs a static
 * text replacement so no source changes are required. Any `process.env.Y` not
 * listed here falls through to the polyfilled `process.env` ({}), matching the
 * previous webpack behaviour.
 */
export function getDefine(opts: {
  env: Record<string, string>;
  mode: string;
  platform: Platform;
  reviewBuild: boolean;
}): Record<string, string> {
  const { env, mode, platform, reviewBuild } = opts;

  const RUNNING_IN_TESTS = parseBool(env.RUNNING_IN_TESTS);
  const UNFINISHED_FEATURES = parseBool(env.UNFINISHED_FEATURES);

  const pkg = readJson('package.json');
  const { version: sdkVersion } = readJson('node_modules/@aeternity/aepp-sdk/package.json');

  // Stabilize env-driven values for review builds to be identical with/without .env
  const stable = (val?: string): string => (reviewBuild ? '' : (val ?? ''));
  const commitHash = reviewBuild
    ? 'review'
    : execSync('git rev-parse HEAD || echo dev').toString().trim();
  const nodeEnv = mode === 'development' ? 'development' : 'production';

  return {
    // Vue / vue-i18n feature flags
    __VUE_I18N_FULL_INSTALL__: JSON.stringify(true),
    __INTLIFY_PROD_DEVTOOLS__: JSON.stringify(false),
    __VUE_I18N_LEGACY_API__: JSON.stringify(false),
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),

    'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    'process.env.PLATFORM': JSON.stringify(platform),
    'process.env.IS_EXTENSION': JSON.stringify(platform === 'extension' && !RUNNING_IN_TESTS),
    'process.env.RUNNING_IN_TESTS': JSON.stringify(RUNNING_IN_TESTS),
    'process.env.UNFINISHED_FEATURES': JSON.stringify(UNFINISHED_FEATURES),
    'process.env.COMMIT_HASH': JSON.stringify(commitHash),
    'process.env.SDK_VERSION': JSON.stringify(sdkVersion),
    'process.env.NETWORK': JSON.stringify(stable(env.NETWORK)),
    'process.env.npm_package_version': JSON.stringify(env.npm_package_version ?? pkg.version),
    'process.env.ALCHEMY_API_KEY': JSON.stringify(stable(env.ALCHEMY_API_KEY)),
    'process.env.ETHERSCAN_API_KEY': JSON.stringify(stable(env.ETHERSCAN_API_KEY)),
    'process.env.ETHPLORER_API_KEY': JSON.stringify(stable(env.ETHPLORER_API_KEY)),
    'process.env.WALLET_CONNECT_PROJECT_ID': JSON.stringify(stable(env.WALLET_CONNECT_PROJECT_ID)),
    'process.env.TOKEN_SALES_URL_TESTNET': JSON.stringify(stable(env.TOKEN_SALES_URL_TESTNET)),
    'process.env.TOKEN_SALES_URL_MAINNET': JSON.stringify(stable(env.TOKEN_SALES_URL_MAINNET)),
  };
}
