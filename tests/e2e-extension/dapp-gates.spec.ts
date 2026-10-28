import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import type http from 'http';
import type { Browser, Frame, Page } from 'puppeteer';
import { verifyMessage } from '@aeternity/aepp-sdk';
import { recover } from 'web3-eth-accounts';
import {
  AEPP_URL,
  DAPP_URL,
  OTHER_DAPP_URL,
  addAccount,
  click,
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

/** Answers the confirmation window the request opens. */
async function answerPopup<T>(request: Promise<T>, button: 'accept' | 'deny') {
  await click(await waitForPopup(browser, extensionId), `[data-cy=${button}]`);
  return request;
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

  it('gets the account once the user approves the connection', async () => {
    const { result } = await answerPopup(evm(dapp, 'eth_requestAccounts'), 'accept');

    expect(result).toEqual([expect.stringMatching(/^0x[\da-fA-F]{40}$/)]);
    [account] = result;
    expect(await evm(dapp, 'eth_accounts')).toEqual({ result: [account] });
  });

  it('gets a personal signature of the account once the user approves it', async () => {
    const { result } = await answerPopup(evm(dapp, 'personal_sign', [MESSAGE, account]), 'accept');

    expect(recover(MESSAGE, result)).toBe(account);
  });

  it('gets 4001 when the user rejects', async () => {
    const { error } = await answerPopup(evm(dapp, 'personal_sign', [MESSAGE, account]), 'deny');

    expect(error.code).toBe(4001);
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

  describe('a site the user did not connect', () => {
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
});
