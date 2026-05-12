/**
 * Test-only account fixture.
 *
 * SECURITY: this mnemonic and password are intentionally kept
 * here — outside of `src/` — because they are ONLY consumed by the e2e and
 * unit test suites under `tests/`. The production bundle (built from `src/`)
 * must never import from this file. Previously this material lived in
 * `src/constants/stubs.ts` and was bundled into every production build,
 * effectively publishing a real BIP-39 seed + its hardcoded encryption
 * password to anyone with read access to the repository.
 *
 * Any wallet ever seeded from this phrase should be considered compromised —
 * rotate its funds before relying on this fixture.
 */
export const TEST_ACCOUNT = {
  mnemonic: 'media view gym mystery all fault truck target envelope kit drop fade',
  password: 'testPassword123',
  addressAeternity: 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5',
  addressBitcoinTestnet: 'tb1qqhzkgwgjcyr5a7h3r5ayxxs3n6e620plpx58wv',
  addressEthereum: '0x909C407d6FD235DE14db97e2234fCB71E99d6E1c',
};
