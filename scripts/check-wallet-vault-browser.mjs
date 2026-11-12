/* eslint-disable import/no-extraneous-dependencies, no-console, no-await-in-loop,
   no-restricted-syntax -- Standalone browser verification needs sequential scenarios. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformWithEsbuild } from 'vite';
import puppeteer from 'puppeteer';

// Exercise the actual storage service in independent browser renderers. Only
// platform detection is fixed; crypto, hashing, Buffer and IndexedDB are real.
const root = fileURLToPath(new URL('..', import.meta.url));
const modules = new Map();
for (const [url, file] of [
  ['/vault.js', 'src/lib/WalletVault.ts'],
  ['/crypto.js', 'src/utils/crypto.ts'],
  ['/common.js', 'src/constants/common.ts'],
]) {
  const source = await readFile(path.join(root, file), 'utf8');
  const compiled = await transformWithEsbuild(source, file, {
    loader: 'ts', format: 'esm', target: 'es2022', tsconfigRaw: {},
  });
  modules.set(url, compiled.code
    .replaceAll('"@/constants"', '"/constants.js"')
    .replaceAll('"@/utils/crypto"', '"/crypto.js"')
    .replaceAll('"@noble/hashes/sha2"', '"/hashes/sha2.js"'));
}
modules.set('/constants.js', 'export * from "/common.js"; export const IS_MOBILE_APP = false; export const IS_EXTENSION = false;');
const bufferDependencies = [];
for (const dependency of ['base64-js', 'ieee754', 'buffer']) {
  const source = await readFile(path.join(root, `node_modules/${dependency}/index.js`), 'utf8');
  bufferDependencies.push(`packages[${JSON.stringify(dependency)}] = {}; ((exports, require) => {\n${source}\n})(packages[${JSON.stringify(dependency)}], name => packages[name]);`);
}
modules.set('/buffer.js', `const packages = {};\n${bufferDependencies.join('\n')}\nglobalThis.Buffer = packages.buffer.Buffer;`);
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost').pathname;
    if (url === '/') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<!doctype html><title>Vault storage verification</title>');
      return;
    }
    let source = modules.get(url);
    if (url.startsWith('/hashes/') && !url.includes('..')) {
      source = await readFile(path.join(root, 'node_modules/@noble/hashes/esm', url.slice('/hashes/'.length)), 'utf8');
      source = source.replaceAll('"@noble/hashes/crypto"', '"/hashes/crypto.js"');
      source = source.replaceAll("'@noble/hashes/crypto'", '"/hashes/crypto.js"');
    }
    if (!source) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'content-type': 'application/javascript' });
    res.end(source);
  } catch (error) {
    // In the log, not in the response.
    console.error(error);
    res.writeHead(500);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.createBrowserContext();
  const pages = await Promise.all([context.newPage(), context.newPage()]);
  for (const page of pages) {
    await page.goto(origin);
    await page.evaluate(async () => {
      await import(new URL('/buffer.js', window.location.href).href);
      window.vault = await import(new URL('/vault.js', window.location.href).href);
      await window.vault.ensureVaultReady();
    });
  }
  // A copy an older version stored: it goes only once the first commit is on the disk.
  const legacyKey = 'sh-wallet_mnemonic';
  await pages[0].evaluate((key) => {
    localStorage.setItem(key, JSON.stringify('legacy-mnemonic'));
    window.durabilities = [];
    const { transaction } = IDBDatabase.prototype;
    IDBDatabase.prototype.transaction = function recordDurability(...args) {
      const result = transaction.apply(this, args);
      if (args[1] === 'readwrite') window.durabilities.push(result.durability);
      return result;
    };
  }, legacyKey);
  for (let iteration = 0; iteration < 20; iteration += 1) {
    await pages[0].evaluate(() => window.vault.refreshVault());
    const expected = await pages[0].evaluate(() => window.vault.readVault());
    if (iteration === 0) assert.equal(expected.values.mnemonic, 'legacy-mnemonic');
    await Promise.all(pages.map((page) => page.evaluate((snapshot) => {
      window.expected = snapshot;
    }, expected)));
    const results = await Promise.all(pages.map((page, index) => page.evaluate(async (label) => {
      const next = {
        ...window.expected.values,
        mnemonic: `mnemonic-${label}`,
        'encryption-salt': `salt-${label}`,
        'accounts-private-keys': `imports-${label}`,
      };
      try {
        const snapshot = await window.vault.commitVault(window.expected, next);
        return { ok: true, snapshot, label };
      } catch (error) {
        return { ok: false, message: error.message, label };
      }
    }, `${iteration}-${index}`)));
    assert.equal(results.filter(({ ok }) => ok).length, 1, JSON.stringify(results));
    const losers = results.filter(({ ok }) => !ok);
    assert.equal(losers.length, 1);
    assert.match(losers[0].message, /The wallet changed while saving/, 'Only a conflict may stop a commit');
    const winner = results.find(({ ok }) => ok);
    const actual = await pages[0].evaluate(async () => {
      await window.vault.refreshVault();
      return window.vault.readVault();
    });
    assert.deepEqual(actual, winner.snapshot);
    assert.equal(actual.values.mnemonic, `mnemonic-${winner.label}`);
    assert.equal(actual.values['encryption-salt'], `salt-${winner.label}`);
    assert.equal(actual.values['accounts-private-keys'], `imports-${winner.label}`);
  }
  const durabilities = await pages[0].evaluate(() => window.durabilities);
  assert.ok(durabilities.length > 0);
  assert.deepEqual(new Set(durabilities), new Set(['strict']), 'Vault commits must be flushed to the disk');
  assert.equal(
    await pages[0].evaluate((key) => localStorage.getItem(key), legacyKey),
    null,
    'The older copy goes once the vault holding it was flushed',
  );
  const after = await context.newPage();
  await after.goto(origin);
  const reopened = await after.evaluate(async () => {
    await import(new URL('/buffer.js', window.location.href).href);
    const vault = await import(new URL('/vault.js', window.location.href).href);
    await vault.ensureVaultReady();
    return vault.readVault();
  });
  const latest = await pages[0].evaluate(() => window.vault.readVault());
  assert.deepEqual(reopened, latest);
  // Another window learns of a commit from its notification alone, without a refresh of its own.
  await pages[1].evaluate(() => {
    window.received = [];
    window.vault.subscribeVault(({ revision }) => window.received.push(revision));
  });
  const notified = await pages[0].evaluate(async () => {
    const current = window.vault.readVault();
    return (await window.vault.commitVault(current, { ...current.values, mnemonic: 'notified' }))
      .revision;
  });
  await pages[1].waitForFunction(
    (revision) => window.received.includes(revision),
    { timeout: 5000 },
    notified,
  );
  assert.equal(await pages[0].evaluate(async () => {
    const previous = window.vault.readVault();
    const { put } = IDBObjectStore.prototype;
    IDBObjectStore.prototype.put = () => { throw new DOMException('Injected storage failure', 'QuotaExceededError'); };
    let rejected = false;
    try {
      await window.vault.commitVault(previous, { ...previous.values, mnemonic: 'must-not-be-stored' });
    } catch {
      rejected = true;
    } finally {
      IDBObjectStore.prototype.put = put;
    }
    await window.vault.refreshVault();
    return rejected && JSON.stringify(previous) === JSON.stringify(window.vault.readVault());
  }), true, 'A failed transaction must leave the prior generation intact');
  await pages[0].evaluate(() => window.vault.clearVault());
  await after.reload();
  const resetValues = await after.evaluate(async () => {
    await import(new URL('/buffer.js', window.location.href).href);
    const vault = await import(new URL('/vault.js', window.location.href).href);
    await vault.ensureVaultReady();
    return vault.readVault().values;
  });
  assert.equal(Object.values(resetValues).every((value) => value === null), true);
  console.log('Strict durability, legacy cleanup, 20 competing-window races, restart, notification, transaction failure, and reset passed');
  await context.close();
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
