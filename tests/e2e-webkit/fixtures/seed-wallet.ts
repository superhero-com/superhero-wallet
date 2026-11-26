import type { Page } from 'playwright-core';
import type { IAddressBookEntry } from '../../../src/types';
import { TEST_ACCOUNT } from '../../fixtures/account';

const SEED_WALLET = `async ({ mnemonic, password, addressBook }) => {
  const {
    encodeBase64,
    encrypt,
    generateEncryptionKey,
    generateSalt,
    prepareStorageKey,
  } = await import('/src/utils/index.ts');
  const { NETWORK_NAME_TESTNET, PROTOCOLS, STORAGE_KEYS } = await import('/src/constants/index.ts');
  const salt = generateSalt();
  const encryptionKey = await generateEncryptionKey(password, salt);
  const stored = {
    [STORAGE_KEYS.activeNetworkName]: NETWORK_NAME_TESTNET,
    [STORAGE_KEYS.mnemonic]: await encrypt(encryptionKey, mnemonic),
    [STORAGE_KEYS.encryptionSalt]: encodeBase64(salt),
    [STORAGE_KEYS.accountsRaw]: [{
      idx: 0,
      protocol: PROTOCOLS.aeternity,
      isRestored: true,
      type: 'hd-wallet',
    }],
    [STORAGE_KEYS.activeAccountGlobalIdx]: 0,
    [STORAGE_KEYS.otherSettings]: { isSeedBackedUp: true },
    ...(addressBook && { [STORAGE_KEYS.addressBook]: addressBook }),
  };
  localStorage.clear();
  Object.entries(stored).forEach(([key, value]) => {
    localStorage.setItem(prepareStorageKey([key]), JSON.stringify(value));
  });
}`;

/**
 * Stores `TEST_ACCOUNT`'s wallet the way the app does, with the app's own helpers.
 * The page has to be on the app's dev server.
 */
export async function seedWallet(
  page: Page,
  { addressBook }: { addressBook?: IAddressBookEntry[] } = {},
) {
  // A string, so Vitest leaves the dev server imports alone
  await page.evaluate(`(${SEED_WALLET})(${JSON.stringify({ ...TEST_ACCOUNT, addressBook })})`);
}
