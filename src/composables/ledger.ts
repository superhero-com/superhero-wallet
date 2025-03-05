import { AccountLedger, AccountLedgerFactory, Encoded } from '@aeternity/aepp-sdk';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';

import { useAeSdk, useModals } from '@/composables';
import {
  IS_OFFSCREEN_TAB,
  IS_WEB,
  MODAL_LEDGER_SIGN,
  POPUP_METHODS,
} from '@/constants';

export function useLedger() {
  async function deriveAccount(accountIndex: number): Promise<AccountLedger> {
    if (!IS_OFFSCREEN_TAB && !IS_WEB) {
      return browser.runtime.sendMessage({
        method: POPUP_METHODS.ledgerDeriveAccount,
        payload: {
          accountIndex,
        },
        target: 'offscreen',
      });
    }
    const transport = await TransportWebUSB.create();
    const accountFactory = new AccountLedgerFactory(transport);
    const ledgerAccount = await accountFactory.initialize(accountIndex);
    await transport.close();
    return ledgerAccount;
  }

  async function discoverAccounts(): Promise<AccountLedger[]> {
    if (!IS_OFFSCREEN_TAB && !IS_WEB) {
      return browser.runtime.sendMessage({
        method: POPUP_METHODS.ledgerDiscoverAccounts,
        target: 'offscreen',
      });
    }
    const { getAeSdk } = useAeSdk();
    const aeSdk = await getAeSdk();
    const transport = await TransportWebUSB.create();
    const accountFactory = new AccountLedgerFactory(transport);
    // TODO: remove `as` after fixing https://github.com/aeternity/aepp-sdk-js/issues/2046
    const ledgerAccounts = (await accountFactory.discover(aeSdk.api)) as AccountLedger[];
    await transport.close();
    return ledgerAccounts;
  }

  async function signMessage(
    address: Encoded.AccountAddress,
    accountIndex: number,
    message: string,
  ): Promise<Uint8Array> {
    const { openModal } = useModals();
    openModal(MODAL_LEDGER_SIGN, undefined);

    if (!IS_OFFSCREEN_TAB && !IS_WEB) {
      return browser.runtime.sendMessage({
        method: POPUP_METHODS.ledgerSignMessage,
        payload: {
          address,
          accountIndex,
          message,
        },
        target: 'offscreen',
      });
    }

    const transport = await TransportWebUSB.create();
    const restoredAccount = new AccountLedger(transport, accountIndex, address);

    return restoredAccount.signMessage(message);
  }

  async function signTransaction(
    address: Encoded.AccountAddress,
    accountIndex: number,
    transaction: Encoded.Transaction,
  ): Promise<Encoded.Transaction> {
    const { openModal } = useModals();
    openModal(MODAL_LEDGER_SIGN, undefined);

    if (!IS_OFFSCREEN_TAB && !IS_WEB) {
      return browser.runtime.sendMessage({
        method: POPUP_METHODS.ledgerSignTransaction,
        payload: {
          address,
          accountIndex,
          transaction,
        },
        target: 'offscreen',
      });
    }

    const { nodeNetworkId } = useAeSdk();

    const transport = await TransportWebUSB.create();
    const restoredAccount = new AccountLedger(transport, accountIndex, address);

    return restoredAccount
      .signTransaction(transaction, { networkId: nodeNetworkId.value });
  }

  return {
    deriveAccount,
    discoverAccounts,
    signMessage,
    signTransaction,
  };
}
