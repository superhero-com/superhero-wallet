import en from '@/popup/locales/en-US.json';
import {
  NETWORK_ID,
  createAeAccount,
  createEthAccount,
  openDeepLinkPage,
  type IDeepLinkPageOptions,
} from '../../helpers/deepLinkPage';

/**
 * `/address` as docs/deep-link-schema.md specifies it: on approval the wallet
 * opens `x-success` with `{address}` and `{networkId}`, and on a decline or a
 * failure it opens `x-cancel`. The address is the æternity account the user
 * approved on the confirmation.
 */

const CALLBACK = 'https://superhero.com/callback';
const ADDRESS_LINK = {
  'x-success': `${CALLBACK}?address={address}&networkId={networkId}`,
  'x-cancel': `${CALLBACK}?cancelled=true`,
};

function openAddress(options: Omit<IDeepLinkPageOptions, 'page' | 'query'>) {
  return openDeepLinkPage({ page: 'Address', query: ADDRESS_LINK, ...options });
}

type App = Awaited<ReturnType<typeof openAddress>>;

async function approve(app: App) {
  await app.waitForModal();
  await app.click('accept');
  const callback = await app.waitForCallback();
  return {
    address: callback.searchParams.get('address'),
    networkId: callback.searchParams.get('networkId'),
  };
}

async function expectCancelled(app: App) {
  const callback = await app.waitForCallback();
  expect(callback.searchParams.get('cancelled')).toBe('true');
  expect(callback.searchParams.has('address')).toBe(false);
  expect(app.windowOpen).toHaveBeenCalledTimes(1);
}

describe('/address deep link', () => {
  describe('once the user approves', () => {
    it('returns the active æternity address and the network id', async () => {
      const account = createAeAccount(0);
      const app = await openAddress({ accounts: [account, createAeAccount(1)] });

      expect(await approve(app)).toEqual({ address: account.address, networkId: NETWORK_ID });
    });

    it('returns the account the user picks on the confirmation', async () => {
      const picked = createAeAccount(1);
      const app = await openAddress({ accounts: [createAeAccount(0), picked] });
      await app.waitForModal();

      await app.pickAccount(picked);

      expect((await approve(app)).address).toBe(picked.address);
    });

    it('returns an æternity account while an account of another chain is active', async () => {
      const aeAccount = createAeAccount(1);
      const app = await openAddress({
        accounts: [createEthAccount(0), aeAccount],
        activeGlobalIdx: 0,
      });

      expect((await approve(app)).address).toBe(aeAccount.address);
    });
  });

  describe('without the address for the dapp', () => {
    it('opens x-cancel when the user declines', async () => {
      const app = await openAddress({ accounts: [createAeAccount(0)] });
      await app.waitForModal();

      await app.click('deny');

      await expectCancelled(app);
      expect(app.loggerWrite).not.toHaveBeenCalled();
    });

    it('opens x-cancel, and tells the user, when the wallet cannot reach the network', async () => {
      const app = await openAddress({
        accounts: [createAeAccount(0)],
        nodeError: new Error('Node is unreachable'),
      });
      await app.waitForModal();

      await app.click('accept');

      await expectCancelled(app);
      expect(app.loggerWrite).toHaveBeenCalledWith(expect.objectContaining({
        title: en.pages.address.connectingFailedTitle,
        message: 'Node is unreachable',
      }));
    });
  });
});
