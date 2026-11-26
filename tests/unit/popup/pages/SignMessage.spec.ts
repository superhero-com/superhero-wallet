import fc from 'fast-check';
import { Encoded, verifyMessageSignature } from '@aeternity/aepp-sdk';

import en from '@/popup/locales/en-US.json';
import {
  createAeAccount,
  createEthAccount,
  openDeepLinkPage,
  PROPERTY_RUNS,
  PROPERTY_TIMEOUT,
  type IWalletAccount,
} from '../../helpers/deepLinkPage';

/**
 * `/sign-message` as docs/deep-link-schema.md specifies it: `{signature}` is the
 * hex signature and `{address}` the signer's address, and a dapp verifies the
 * signature before it trusts the address. So the tests check the returned
 * signature with the SDK's `verifyMessageSignature`, over the message the user
 * was shown.
 */

const CALLBACK = 'https://superhero.com/callback';

function signMessageLink(message: string | undefined, encoding?: string) {
  return {
    ...(message === undefined ? {} : { message }),
    ...(encoding ? { encoding } : {}),
    'x-success': `${CALLBACK}?signature={signature}&address={address}`,
    'x-cancel': `${CALLBACK}?cancelled=true`,
  };
}

async function openSignMessage(
  query: Record<string, string>,
  accounts: IWalletAccount[],
  activeGlobalIdx = 0,
) {
  return openDeepLinkPage({
    page: 'SignMessage', query, accounts, activeGlobalIdx,
  });
}

type App = Awaited<ReturnType<typeof openSignMessage>>;

async function approve(app: App) {
  await app.waitForModal();
  const shownMessage = app.shownText('message');
  await app.click('accept');
  const callback = await app.waitForCallback();
  return {
    shownMessage,
    address: callback.searchParams.get('address')!,
    signature: Buffer.from(callback.searchParams.get('signature')!, 'hex'),
  };
}

const verify = (message: string | Buffer, signature: Buffer, address: string) => (
  verifyMessageSignature(message as string, signature, address as Encoded.AccountAddress)
);

describe('/sign-message deep link', () => {
  describe('once the user approves', () => {
    it('returns a signature of the message that verifies for the returned address', async () => {
      const account = createAeAccount(0);
      const app = await openSignMessage(signMessageLink('Log in to example.com: n0nce'), [account]);

      const { shownMessage, address, signature } = await approve(app);

      expect(shownMessage).toBe('Log in to example.com: n0nce');
      expect(address).toBe(account.address);
      expect(verify('Log in to example.com: n0nce', signature, address)).toBe(true);
    });

    it('signs the bytes of a hex-encoded message, and shows them as text', async () => {
      const bytes = Buffer.from('Grüße & {signature}', 'utf8');
      const app = await openSignMessage(
        signMessageLink(bytes.toString('hex'), 'hex'),
        [createAeAccount(0)],
      );

      const { shownMessage, address, signature } = await approve(app);

      expect(shownMessage).toBe('Grüße & {signature}');
      expect(verify(bytes, signature, address)).toBe(true);
    });

    it('signs any text the user is shown, sent as is or hex-encoded', async () => {
      // `trim`: the DOM text of the row is read without its outer whitespace
      const message = fc.string({ unit: 'grapheme', minLength: 1 }).map((text) => text.trim())
        .filter(Boolean);
      await fc.assert(
        fc.asyncProperty(message, fc.boolean(), async (text, isHex) => {
          const app = await openSignMessage(
            isHex
              ? signMessageLink(Buffer.from(text).toString('hex'), 'hex')
              : signMessageLink(text),
            [createAeAccount(0)],
          );

          const { shownMessage, address, signature } = await approve(app);

          expect(shownMessage).toBe(text);
          expect(verify(text, signature, address)).toBe(true);
        }),
        { numRuns: PROPERTY_RUNS },
      );
    }, PROPERTY_TIMEOUT);

    it('signs with the account the user picks on the confirmation, and returns it', async () => {
      const first = createAeAccount(0);
      const picked = createAeAccount(1);
      const app = await openSignMessage(signMessageLink('n0nce'), [first, picked]);
      await app.waitForModal();

      await app.pickAccount(picked);
      const { address, signature } = await approve(app);

      expect(address).toBe(picked.address);
      expect(verify('n0nce', signature, picked.address)).toBe(true);
    });

    it('signs with the æternity account while an account of another chain is active', async () => {
      const aeAccount = createAeAccount(1);
      const app = await openSignMessage(
        signMessageLink('n0nce'),
        [createEthAccount(0), aeAccount],
        0,
      );

      const { address, signature } = await approve(app);

      expect(address).toBe(aeAccount.address);
      expect(verify('n0nce', signature, aeAccount.address)).toBe(true);
    });
  });

  describe('without a signature for the dapp', () => {
    async function expectCancelled(app: App) {
      const callback = await app.waitForCallback();
      expect(callback.searchParams.get('cancelled')).toBe('true');
      expect(callback.searchParams.has('signature')).toBe(false);
      expect(app.windowOpen).toHaveBeenCalledTimes(1);
    }

    it('opens x-cancel when the user declines', async () => {
      const app = await openSignMessage(signMessageLink('n0nce'), [createAeAccount(0)]);
      await app.waitForModal();

      await app.click('deny');

      await expectCancelled(app);
      expect(app.loggerWrite).not.toHaveBeenCalled();
    });

    it.each([
      ['no message', undefined, undefined],
      ['an empty message', '', undefined],
      ['an empty hex message', '', 'hex'],
      ['a hex message of no bytes', 'zz', 'hex'],
    ])('opens x-cancel, and tells the user, without asking them to sign %s', async (_, message, encoding) => {
      const app = await openSignMessage(signMessageLink(message, encoding), [createAeAccount(0)]);

      await expectCancelled(app);
      expect(app.findModal().exists()).toBe(false);
      expect(app.loggerWrite).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ message: en.pages.signMessage.noMessage }),
      );
    });

    it('opens x-cancel, and tells the user, when the account cannot sign messages', async () => {
      // Messages are not signed on an AirGap device
      const airGapAccount = { ...createAeAccount(0), type: 'airgap', secretKey: undefined };
      const app = await openSignMessage(signMessageLink('n0nce'), [airGapAccount]);
      await app.waitForModal();

      await app.click('accept');

      await expectCancelled(app);
      expect(app.loggerWrite).toHaveBeenCalledWith(
        expect.objectContaining({ title: en.pages.signMessage.signingFailedTitle }),
      );
    });
  });
});
