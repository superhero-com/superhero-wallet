import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';

const readFileSyncMock = vi.fn((filePath: string) => {
  if (filePath.toString().endsWith('package.json') && !filePath.toString().includes('aepp-sdk')) {
    return JSON.stringify({ version: '2.10.2' });
  }
  if (filePath.toString().includes('aepp-sdk')) {
    return JSON.stringify({ version: '14.1.1' });
  }
  throw new Error(`unexpected readFileSync path: ${filePath}`);
});

const execSyncMock = vi.fn(() => Buffer.from('abc1234\n'));

vi.mock('fs', () => {
  const readFileSync = (...args: unknown[]) => readFileSyncMock(...(args as [string]));
  return { readFileSync, default: { readFileSync } };
});

vi.mock('child_process', () => {
  const execSync = (...args: unknown[]) => execSyncMock(...(args as [string]));
  return { execSync, default: { execSync } };
});

describe('getDefine', () => {
  beforeEach(() => {
    readFileSyncMock.mockClear();
    execSyncMock.mockClear();
  });

  it('blanks API keys and network URLs for review builds regardless of env', async () => {
    const { getDefine } = await import('../../../build/env');
    const define = getDefine({
      env: {
        ALCHEMY_API_KEY: 'super-secret-alchemy-key',
        ETHERSCAN_API_KEY: 'super-secret-etherscan-key',
        ETHPLORER_API_KEY: 'super-secret-ethplorer-key',
        WALLET_CONNECT_PROJECT_ID: 'super-secret-wc-id',
        NETWORK: 'Mainnet',
      },
      mode: 'production',
      platform: 'extension',
      reviewBuild: true,
    });

    expect(define['process.env.ALCHEMY_API_KEY']).toBe(JSON.stringify(''));
    expect(define['process.env.ETHERSCAN_API_KEY']).toBe(JSON.stringify(''));
    expect(define['process.env.ETHPLORER_API_KEY']).toBe(JSON.stringify(''));
    expect(define['process.env.WALLET_CONNECT_PROJECT_ID']).toBe(JSON.stringify(''));
    expect(define['process.env.NETWORK']).toBe(JSON.stringify(''));
    expect(define['process.env.COMMIT_HASH']).toBe(JSON.stringify('review'));
    // A review build must never shell out for the real commit hash either.
    expect(execSyncMock).not.toHaveBeenCalled();
  });

  it('passes through real env values and the git commit hash for non-review builds', async () => {
    const { getDefine } = await import('../../../build/env');
    const define = getDefine({
      env: { ALCHEMY_API_KEY: 'real-key', NETWORK: 'Mainnet' },
      mode: 'production',
      platform: 'web',
      reviewBuild: false,
    });

    expect(define['process.env.ALCHEMY_API_KEY']).toBe(JSON.stringify('real-key'));
    expect(define['process.env.NETWORK']).toBe(JSON.stringify('Mainnet'));
    expect(define['process.env.COMMIT_HASH']).toBe(JSON.stringify('abc1234'));
  });

  it('marks IS_EXTENSION only for the extension platform outside of tests', async () => {
    const { getDefine } = await import('../../../build/env');

    const extensionDefine = getDefine({
      env: {}, mode: 'production', platform: 'extension', reviewBuild: false,
    });
    expect(extensionDefine['process.env.IS_EXTENSION']).toBe(JSON.stringify(true));

    const webDefine = getDefine({
      env: {}, mode: 'production', platform: 'web', reviewBuild: false,
    });
    expect(webDefine['process.env.IS_EXTENSION']).toBe(JSON.stringify(false));

    const testsDefine = getDefine({
      env: { RUNNING_IN_TESTS: 'true' }, mode: 'production', platform: 'extension', reviewBuild: false,
    });
    expect(testsDefine['process.env.IS_EXTENSION']).toBe(JSON.stringify(false));
  });

  it('maps development mode to NODE_ENV development and everything else to production', async () => {
    const { getDefine } = await import('../../../build/env');

    const devDefine = getDefine({
      env: {}, mode: 'development', platform: 'web', reviewBuild: false,
    });
    expect(devDefine['process.env.NODE_ENV']).toBe(JSON.stringify('development'));

    const prodDefine = getDefine({
      env: {}, mode: 'test', platform: 'web', reviewBuild: false,
    });
    expect(prodDefine['process.env.NODE_ENV']).toBe(JSON.stringify('production'));
  });

  it('falls back to package.json version when npm_package_version is not set', async () => {
    const { getDefine } = await import('../../../build/env');

    const define = getDefine({
      env: {}, mode: 'production', platform: 'web', reviewBuild: false,
    });
    expect(define['process.env.npm_package_version']).toBe(JSON.stringify('2.10.2'));

    const withEnvVersion = getDefine({
      env: { npm_package_version: '9.9.9' }, mode: 'production', platform: 'web', reviewBuild: false,
    });
    expect(withEnvVersion['process.env.npm_package_version']).toBe(JSON.stringify('9.9.9'));
  });
});
