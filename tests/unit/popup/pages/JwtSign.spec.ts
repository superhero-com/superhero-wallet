import fc from 'fast-check';
import { Encoded, decode, unpackJwt } from '@aeternity/aepp-sdk';

import en from '@/popup/locales/en-US.json';
import {
  createAeAccount,
  createEthAccount,
  openDeepLinkPage,
  type IWalletAccount,
} from '../../helpers/deepLinkPage';

/**
 * `/sign-jwt` as docs/deep-link-schema.md specifies it: "The wallet adds a
 * `sub_jwk` claim with the signer's key and returns header.payload.signature.
 * Verify it with the SDK's `unpackJwt(jwt, expectedAddress)`", where
 * `expectedAddress` is the `{address}` the wallet returns with it. A dapp that
 * follows the docs accepts exactly what `unpackJwt` accepts, so the tests check
 * the returned token with it, and compare it with what the user approved.
 */

const CALLBACK = 'https://superhero.com/callback';
/** Each run opens the page anew */
const PROPERTY_TIMEOUT = 60_000;

function signJwtLink(payload?: string) {
  return {
    ...(payload === undefined ? {} : { payload }),
    'x-success': `${CALLBACK}?jwt={signed-payload}&address={address}`,
    'x-cancel': `${CALLBACK}?cancelled=true`,
  };
}

/** The key claim the docs promise for the account */
function subJwkOf(address: string) {
  return {
    kty: 'OKP',
    crv: 'Ed25519',
    x: Buffer.from(decode(address as Encoded.AccountAddress)).toString('base64url'),
  };
}

async function openSignJwt(
  payload: string | undefined,
  accounts: IWalletAccount[],
  activeGlobalIdx = 0,
) {
  return openDeepLinkPage({
    page: 'JwtSign', query: signJwtLink(payload), accounts, activeGlobalIdx,
  });
}

/** What the dapp gets once the user approves, as the docs tell it to check it */
async function approveAndVerify(app: Awaited<ReturnType<typeof openSignJwt>>) {
  await app.waitForModal();
  const shownClaims = JSON.parse(app.shownText('message'));
  await app.click('accept');
  const callback = await app.waitForCallback();
  const jwt = callback.searchParams.get('jwt')!;
  const address = callback.searchParams.get('address')!;
  return {
    shownClaims,
    address,
    // Throws when the token is not signed by `address` or names another key
    verify: () => unpackJwt(jwt, address as Encoded.AccountAddress),
  };
}

describe('/sign-jwt deep link', () => {
  describe('once the user approves', () => {
    it('returns a token that unpackJwt verifies for the returned address', async () => {
      const account = createAeAccount(0);
      const app = await openSignJwt('{"challenge":"n0nce","exp":1767225600}', [account]);

      const { address, verify } = await approveAndVerify(app);

      expect(address).toBe(account.address);
      expect(verify().payload).toEqual({
        challenge: 'n0nce',
        exp: 1767225600,
        sub_jwk: subJwkOf(account.address),
      });
    });

    it('signs the claims the user was shown, with the key they were shown', async () => {
      const app = await openSignJwt('{"b":2,"a":"ä ✓"}', [createAeAccount(0)]);

      const { shownClaims, verify } = await approveAndVerify(app);

      expect(verify().payload).toEqual(shownClaims);
    });

    it('signs with the æternity account while an account of another chain is active', async () => {
      const aeAccount = createAeAccount(1);
      const app = await openSignJwt('{"challenge":"n0nce"}', [createEthAccount(0), aeAccount], 0);

      const { address, verify } = await approveAndVerify(app);

      expect(address).toBe(aeAccount.address);
      expect(verify().signer).toBe(aeAccount.address);
    });

    it('holds for any claims the dapp sends', async () => {
      // Keys other than `sub_jwk`, which the next tests are about
      const claims = fc.dictionary(
        fc.string().filter((key) => key !== 'sub_jwk'),
        fc.jsonValue(),
        { maxKeys: 4 },
      );
      await fc.assert(
        fc.asyncProperty(claims, async (payload) => {
          const app = await openSignJwt(JSON.stringify(payload), [createAeAccount(0)]);

          const { shownClaims, verify } = await approveAndVerify(app);

          expect(verify().payload).toEqual(shownClaims);
        }),
        { numRuns: 12 },
      );
    }, PROPERTY_TIMEOUT);

    /**
     * `signJwt` keeps a `sub_jwk` the payload already has, so the wallet has to
     * replace it with the key the user is shown, not sign the dapp's payload.
     */
    it.each([
      ['another key', subJwkOf(createAeAccount(9).address)],
      ['null', null],
    ])('signs the key the user was shown when the dapp sends a sub_jwk of %s', async (_, subJwk) => {
      const account = createAeAccount(0);
      const app = await openSignJwt(JSON.stringify({ challenge: 'n0nce', sub_jwk: subJwk }), [account]);

      const { shownClaims, verify } = await approveAndVerify(app);

      expect(shownClaims.sub_jwk).toEqual(subJwkOf(account.address));
      expect(verify().payload).toEqual(shownClaims);
    });

    it('signs with the account the user picks on the confirmation, shows its key, and returns it', async () => {
      const first = createAeAccount(0);
      const picked = createAeAccount(1);
      const app = await openSignJwt('{"challenge":"n0nce"}', [first, picked]);
      await app.waitForModal();

      await app.pickAccount(picked);
      const { shownClaims, address, verify } = await approveAndVerify(app);

      expect(shownClaims.sub_jwk).toEqual(subJwkOf(picked.address));
      expect(address).toBe(picked.address);
      expect(verify().signer).toBe(picked.address);
      expect(verify().payload).toEqual(shownClaims);
    });
  });

  describe('without a token for the dapp', () => {
    async function expectCancelled(app: Awaited<ReturnType<typeof openSignJwt>>) {
      const callback = await app.waitForCallback();
      expect(callback.searchParams.get('cancelled')).toBe('true');
      expect(callback.searchParams.has('jwt')).toBe(false);
      expect(app.windowOpen).toHaveBeenCalledTimes(1);
    }

    it('opens x-cancel when the user declines', async () => {
      const app = await openSignJwt('{"challenge":"n0nce"}', [createAeAccount(0)]);
      await app.waitForModal();

      await app.clickButton(en.common.cancel);

      await expectCancelled(app);
      expect(app.loggerWrite).not.toHaveBeenCalled();
    });

    it('opens x-cancel, and tells the user, when the link has no payload', async () => {
      const app = await openSignJwt(undefined, [createAeAccount(0)]);

      await expectCancelled(app);
      expect(app.findModal().exists()).toBe(false);
      expect(app.loggerWrite).toHaveBeenCalledWith(
        expect.objectContaining({ message: en.pages.jwtSign.noPayload }),
      );
    });

    // JWT claims are a JSON object
    it.each(['not json', '{"unterminated":', '5', 'null', '"text"', '[1,2]', '[]'])(
      'opens x-cancel, and tells the user, without asking them to sign the payload %s',
      async (payload) => {
        const app = await openSignJwt(payload, [createAeAccount(0)]);

        await expectCancelled(app);
        expect(app.findModal().exists()).toBe(false);
        expect(app.loggerWrite).toHaveBeenCalledExactlyOnceWith(
          expect.objectContaining({ message: en.pages.jwtSign.invalidPayload }),
        );
      },
    );

    it('opens x-cancel, and tells the user, when the wallet has no æternity account', async () => {
      const app = await openSignJwt('{"challenge":"n0nce"}', [createEthAccount(0)]);

      await expectCancelled(app);
      expect(app.findModal().exists()).toBe(false);
      expect(app.loggerWrite).toHaveBeenCalledWith(
        expect.objectContaining({ message: en.pages.jwtSign.wrongProtocol }),
      );
    });
  });
});
