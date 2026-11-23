import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import type http from 'http';
import type {
  Browser,
  CDPSession,
  Frame,
  Page,
} from 'puppeteer';
import { verifyMessage } from '@aeternity/aepp-sdk';
import { recover } from 'web3-eth-accounts';
import {
  AEPP_URL,
  DAPP_URL,
  OTHER_DAPP_URL,
  addAccount,
  createWallet,
  launchBrowser,
  startDappServers,
  switchToFirstAccount,
  waitForPopup,
  withoutPopup,
} from './harness';

const MESSAGE = 'Superhero Wallet e2e';
const UNKNOWN_CHAIN_ID = '0x7a69';
const SEPOLIA_CHAIN_ID = '0xaa36a7';
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const ROUTER = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD';

let servers: http.Server[];
let browser: Browser;
let extensionId: string;
let wallet: Page;
let dapp: Page;

function evm(page: Page | Frame, method: string, params?: unknown[]) {
  return page.evaluate(
    (m, p) => (window as any).evm.request(m, p),
    method,
    params as any,
  );
}

async function clickApproval(popup: Page, button: 'accept' | 'deny') {
  await popup.bringToFront();
  const selector = `[data-cy=${button}]:not([aria-disabled="true"])`;
  // The app's locked placeholder covers the approval while it fades out
  await popup.waitForFunction((sel) => {
    const element = document.querySelector(sel);
    const rect = element?.getBoundingClientRect();
    return !!rect && !!element?.contains(document.elementFromPoint(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
    ));
  }, { timeout: 30000 }, selector);
  await popup.locator(selector).setVisibility('visible').click();
}

async function answerPopup<T>(request: Promise<T>, button: 'accept' | 'deny') {
  await clickApproval(await waitForPopup(browser, extensionId), button);
  return request;
}

const sleep = (ms: number) => new Promise((resolve) => { setTimeout(resolve, ms); });

/** Keeps the page frozen as Chrome does with a tab in a collapsed group, for `ms` */
async function freeze(cdp: CDPSession, ms: number, whileFrozen?: () => Promise<unknown>) {
  await cdp.send('Page.setWebLifecycleState', { state: 'frozen' });
  try {
    await whileFrozen?.();
    await sleep(ms);
  } finally {
    await cdp.send('Page.setWebLifecycleState', { state: 'active' });
  }
}

beforeAll(async () => {
  servers = await startDappServers();
  ({ browser, extensionId } = await launchBrowser());
  wallet = await createWallet(browser, extensionId);
  await addAccount(wallet, 'aeternity');
  // A second one to switch to
  await addAccount(wallet, 'ethereum');
  dapp = await browser.newPage();
  await dapp.goto(DAPP_URL);
});

afterAll(async () => {
  await browser?.close();
  servers?.forEach((server) => server.close());
});

describe('EVM dapp', () => {
  let account: string;

  it('gets no accounts before the user connects it', async () => {
    expect(await evm(dapp, 'eth_accounts')).toEqual({ result: [] });
  });

  it('lets another site connect after closing an approval before its page loads', async () => {
    // Puppeteer resumes every new target, so CDP can't hold the page. Close it on creation.
    await wallet.evaluate(() => {
      (window as any).closedApproval = new Promise((resolve) => {
        const onCreated = async ({ id, type }: { id?: number; type?: string }) => {
          if (type !== 'popup') return;
          window.browser.windows.onCreated.removeListener(onCreated);
          const [tab] = await window.browser.tabs.query({ windowId: id });
          await window.browser.windows.remove(id!);
          resolve(tab);
        };
        window.browser.windows.onCreated.addListener(onCreated);
      });
    });
    const first = evm(dapp, 'eth_requestAccounts');
    const closedTab = await wallet.evaluate(() => (window as any).closedApproval);
    // Its navigation has not committed yet
    const approval = `chrome-extension://${extensionId}/index.html?id=`;
    expect(closedTab.pendingUrl?.startsWith(approval)).toBe(true);
    expect(closedTab.url?.startsWith(approval)).toBeFalsy();
    expect((await first).error.code).toBe(4001);

    const host = await browser.newPage();
    let frame: Frame | undefined;
    let popup: Page | undefined;
    try {
      await host.goto(DAPP_URL);
      await host.evaluate((url) => (window as any).addFrame(url), OTHER_DAPP_URL);
      frame = host.frames().find((candidate) => candidate.url() === OTHER_DAPP_URL)!;
      const connecting = evm(frame, 'eth_requestAccounts');
      popup = await waitForPopup(browser, extensionId);
      const site = await popup.waitForSelector('[data-cy=aepp]');
      expect(await site!.evaluate((el) => el.textContent))
        .toContain(new URL(OTHER_DAPP_URL).hostname);
      await clickApproval(popup, 'accept');

      const { result } = await connecting;
      expect(result).toEqual([expect.stringMatching(/^0x[\da-fA-F]{40}$/)]);
      expect(await evm(frame, 'eth_accounts')).toEqual({ result });
      expect(await evm(host, 'eth_accounts')).toEqual({ result: [] });
    } finally {
      if (popup && !popup.isClosed()) await popup.close();
      if (frame) await evm(frame, 'wallet_revokePermissions', [{ eth_accounts: {} }]);
      await host.close();
    }
  });

  it('connects from an approval at the top right of the foreground dapp window', async () => {
    // Headless Chrome supports a controlled display free of desktop placement policies.
    const screen = process.env.HEADFUL ? undefined : await browser.addScreen({
      left: -1440, top: 0, width: 1440, height: 1000, devicePixelRatio: 1,
    });
    const parentBounds = {
      left: -1320, top: 55, width: 1000, height: 800,
    };
    let source = dapp;
    let popup: Page | undefined;
    try {
      if (screen) {
        source = await browser.newPage({ type: 'window', windowBounds: parentBounds });
        await source.goto(DAPP_URL);
      }
      await source.bringToFront();
      const request = evm(source, 'eth_requestAccounts');
      popup = await waitForPopup(browser, extensionId);
      if (screen) {
        const parent = await browser.getWindowBounds(await source.windowId());
        const {
          left, top, width, height,
        } = await browser.getWindowBounds(await popup.windowId());
        const right = left! + width!;
        expect(parent.windowState).toBe('normal');
        expect(parent.width).toBeGreaterThan(width!);
        expect(parent.height).toBeGreaterThanOrEqual(height!);
        expect(Math.abs(top! - parent.top!)).toBeLessThanOrEqual(1);
        expect(Math.abs(right - (parent.left! + parent.width!))).toBeLessThanOrEqual(1);
        expect(width).toBeGreaterThan(0);
        expect(height).toBeGreaterThan(0);
        expect(left).toBeGreaterThanOrEqual(screen.availLeft);
        expect(top).toBeGreaterThanOrEqual(screen.availTop);
        expect(right).toBeLessThanOrEqual(screen.availLeft + screen.availWidth);
        expect(top! + height!).toBeLessThanOrEqual(screen.availTop + screen.availHeight);
      }
      await clickApproval(popup, 'accept');
      const { result } = await request;
      expect(result).toEqual([expect.stringMatching(/^0x[\da-fA-F]{40}$/)]);
      [account] = result;
      expect(await evm(dapp, 'eth_accounts')).toEqual({ result: [account] });
      await expect.poll(() => popup!.isClosed(), { timeout: 30000 }).toBe(true);
    } finally {
      if (popup && !popup.isClosed()) await popup.close();
      if (source !== dapp) await source.close();
      if (screen) await browser.removeScreen(screen.id);
    }
  });

  it('gets a personal signature of the account once the user approves it', async () => {
    const { result } = await answerPopup(evm(dapp, 'personal_sign', [MESSAGE, account]), 'accept');

    expect(recover(MESSAGE, result)).toBe(account);
  });

  it('gets 4001 when the user rejects', async () => {
    const { error } = await answerPopup(evm(dapp, 'personal_sign', [MESSAGE, account]), 'deny');

    expect(error.code).toBe(4001);
  });

  it('warns of an unlimited Permit2 allowance before the user signs it', async () => {
    const { result: chainId } = await evm(dapp, 'eth_chainId');
    const request = evm(dapp, 'eth_signTypedData_v4', [account, JSON.stringify({
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        PermitSingle: [
          { name: 'details', type: 'PermitDetails' },
          { name: 'spender', type: 'address' },
          { name: 'sigDeadline', type: 'uint256' },
        ],
        PermitDetails: [
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint160' },
          { name: 'expiration', type: 'uint48' },
          { name: 'nonce', type: 'uint48' },
        ],
      },
      primaryType: 'PermitSingle',
      domain: { name: 'Permit2', chainId, verifyingContract: PERMIT2 },
      message: {
        details: {
          token: USDC, amount: (2n ** 160n - 1n).toString(), expiration: '1795000000', nonce: '0',
        },
        spender: ROUTER,
        sigDeadline: '1795000000',
      },
    })]);
    const popup = await waitForPopup(browser, extensionId);
    // Shown before the node tells the token's details
    const warning = await popup.waitForSelector('[data-cy=evm-sign-warning]', { timeout: 30000 });

    // The symbol may still be the token's address
    expect(await warning!.evaluate((el) => el.textContent)).toContain('until the approval expires');
    await clickApproval(popup, 'deny');
    expect((await request).error.code).toBe(4001);
  });

  it('gets -32602 for a chain that is not on the active network', async () => {
    const { error } = await withoutPopup(browser, extensionId, () => evm(dapp, 'eth_sendTransaction', [{
      from: account,
      to: account,
      value: '0x0',
      chainId: UNKNOWN_CHAIN_ID,
    }]));

    expect(error.code).toBe(-32602);
  });

  describe('a second site', () => {
    let otherDapp: Page;

    beforeAll(async () => {
      otherDapp = await browser.newPage();
      await otherDapp.goto(OTHER_DAPP_URL);
    });

    afterAll(() => otherDapp.close());

    it('gets 4100 for a signature, without the user being asked', async () => {
      const { error } = await withoutPopup(
        browser,
        extensionId,
        () => evm(otherDapp, 'personal_sign', [MESSAGE, account]),
      );

      expect(error.code).toBe(4100);
    });

    it('gets 4100 for a network switch, and the network stays', async () => {
      const chainId = await evm(dapp, 'eth_chainId');

      const { error } = await withoutPopup(
        browser,
        extensionId,
        () => evm(otherDapp, 'wallet_switchEthereumChain', [{ chainId: SEPOLIA_CHAIN_ID }]),
      );

      expect(error.code).toBe(4100);
      expect(await evm(dapp, 'eth_chainId')).toEqual(chainId);
    });

    it('settles pending signature requests from two sites independently', async () => {
      await answerPopup(evm(otherDapp, 'eth_requestAccounts'), 'accept');
      try {
        await dapp.bringToFront();
        const signing = evm(dapp, 'personal_sign', [MESSAGE, account]);
        const firstPopup = await waitForPopup(browser, extensionId);

        await otherDapp.bringToFront();
        const cancelled = evm(otherDapp, 'personal_sign', ['Another message', account]);
        const secondPopup = await waitForPopup(browser, extensionId);
        await secondPopup.waitForSelector('[data-cy=deny]');
        await secondPopup.close();
        expect((await cancelled).error.code).toBe(4001);

        await clickApproval(firstPopup, 'accept');
        expect(recover(MESSAGE, (await signing).result)).toBe(account);
      } finally {
        await evm(otherDapp, 'wallet_revokePermissions', [{ eth_accounts: {} }]);
      }
    });
  });

  it('tells only the connected site that the account changed', async () => {
    // A site that only read the chain, framed in the connected one
    await dapp.evaluate((url) => (window as any).addFrame(url), OTHER_DAPP_URL);
    const frame = dapp.frames().find((f) => f.url() === OTHER_DAPP_URL)!;
    await evm(frame, 'eth_chainId');
    await frame.evaluate(() => (window as any).evm.listenAccountsChanged());
    await dapp.evaluate(() => (window as any).evm.listenAccountsChanged());
    // The wallet tells the active tab
    await dapp.bringToFront();

    await switchToFirstAccount(wallet, extensionId);

    const events = await dapp.waitForFunction(
      () => (window as any).accountsChangedEvents.length && (window as any).accountsChangedEvents,
      { timeout: 30000 },
    );
    const [[newAccount]] = await events.jsonValue();
    expect(newAccount).toMatch(/^0x[\da-fA-F]{40}$/);
    expect(newAccount).not.toBe(account);
    // Both content scripts got the same broadcast
    await new Promise((resolve) => { setTimeout(resolve, 1000); });
    expect(await frame.evaluate(() => (window as any).accountsChangedEvents)).toEqual([]);
  });
});

describe('aeternity aepp', () => {
  let aepp: Page;
  let address: string;

  beforeAll(async () => {
    aepp = await browser.newPage();
    await aepp.goto(AEPP_URL);
  });

  it('gets the address once the user approves the connection', async () => {
    await aepp.evaluate(() => (window as any).ae.connect());
    const { result } = await answerPopup(aepp.evaluate(() => (window as any).ae.subscribe()), 'accept');

    expect(result).toMatch(/^ak_/);
    address = result;
  });

  it('gets a signature of the message once the user approves it', async () => {
    const { result } = await answerPopup(
      aepp.evaluate((message) => (window as any).ae.signMessage(message), MESSAGE),
      'accept',
    );

    expect(verifyMessage(MESSAGE, Buffer.from(result, 'hex'), address as any)).toBe(true);
  });

  it('is refused a signature it did not subscribe for, without the user being asked', async () => {
    const otherDapp = await browser.newPage();
    try {
      await otherDapp.goto(OTHER_DAPP_URL);
      await otherDapp.evaluate(() => (window as any).ae.connect());

      const { error } = await withoutPopup(browser, extensionId, () => otherDapp.evaluate(
        (account, message) => (window as any).ae.signMessageAs(account, message),
        address,
        MESSAGE,
      ));

      expect(error.name).toBe('RpcNotAuthorizeError');
    } finally {
      await otherDapp.close();
    }
  });

  it('finds the wallet after its page was frozen, without a backlog of announcements', async () => {
    const page = await browser.newPage();
    try {
      await page.goto(AEPP_URL);
      await page.waitForFunction(() => (window as any).announcements.length, { timeout: 10000 });
      const countBefore = await page.evaluate(() => (window as any).announcements.length);

      // Chrome would queue an announcement every 3 s for the frozen page, all delivered on resume
      await freeze(await page.createCDPSession(), 15000);
      await sleep(1000);

      const count = await page.evaluate(
        (n) => (window as any).announcements.length - n,
        countBefore,
      );
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(2);
      await page.evaluate(() => (window as any).ae.connect());
      const { result } = await withoutPopup(
        browser,
        extensionId,
        () => page.evaluate(() => (window as any).ae.subscribe()),
      );
      expect(result).toBe(address);
    } finally {
      await page.close();
    }
  });

  it('keeps its session across a freeze, also for a signature approved while frozen', async () => {
    const cdp = await aepp.createCDPSession();
    const verify = (signature: string) => verifyMessage(
      MESSAGE,
      Buffer.from(signature, 'hex'),
      address as any,
    );
    try {
      await freeze(cdp, 5000);
      const { result } = await answerPopup(
        aepp.evaluate((message) => (window as any).ae.signMessage(message), MESSAGE),
        'accept',
      );
      expect(verify(result)).toBe(true);

      const signing = aepp.evaluate((message) => (window as any).ae.signMessage(message), MESSAGE);
      const popup = await waitForPopup(browser, extensionId);
      await popup.waitForSelector('[data-cy=accept]', { timeout: 30000 });
      await freeze(cdp, 3000, () => clickApproval(popup, 'accept'));

      expect(verify((await signing).result)).toBe(true);
      expect(await aepp.evaluate(() => (window as any).aeDisconnects)).toEqual([]);
    } finally {
      await cdp.detach();
    }
  });

  it('can connect again after the page comes back from the back/forward cache', async () => {
    await aepp.evaluate(() => { (window as any).isCached = true; });
    await aepp.goto(DAPP_URL);
    await aepp.goBack();
    // Else the page was loaded again, which is not the case of this test
    expect(await aepp.evaluate(() => (window as any).isCached)).toBe(true);

    // Chrome closed the port, so the wallet dropped the session
    await aepp.waitForFunction(() => (window as any).aeDisconnects.length, { timeout: 10000 });
    expect(await aepp.evaluate(() => (window as any).aeDisconnects)).toEqual([{ reason: 'bye' }]);
    await aepp.evaluate(() => (window as any).ae.connect());
    const { result } = await withoutPopup(
      browser,
      extensionId,
      () => aepp.evaluate(() => (window as any).ae.subscribe()),
    );

    expect(result).toBe(address);
  });

  it('finds the wallet after its page comes back from the cache without having used it', async () => {
    const page = await browser.newPage();
    try {
      await page.goto(AEPP_URL);
      await page.waitForFunction(() => (window as any).announcements.length, { timeout: 10000 });
      await page.evaluate(() => { (window as any).isCached = true; });
      await page.goto(DAPP_URL);
      await page.goBack();
      expect(await page.evaluate(() => (window as any).isCached)).toBe(true);
      const countBefore = await page.evaluate(() => (window as any).announcements.length);

      await page.waitForFunction(
        (n) => (window as any).announcements.length > n,
        { timeout: 10000 },
        countBefore,
      );
      await page.evaluate(() => (window as any).ae.connect());
      const { result } = await withoutPopup(
        browser,
        extensionId,
        () => page.evaluate(() => (window as any).ae.subscribe()),
      );
      expect(result).toBe(address);
      // It had no session to end
      expect(await page.evaluate(() => (window as any).aeDisconnects)).toEqual([]);
    } finally {
      await page.close();
    }
  });
});
