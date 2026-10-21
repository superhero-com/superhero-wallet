import { AccountLedger, AccountLedgerFactory, Encoded } from '@aeternity/aepp-sdk';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';

import { useAeSdk, useModals } from '@/composables';
import {
  IS_OFFSCREEN_TAB,
  IS_WEB,
  MODAL_LEDGER_SIGN,
  POPUP_METHODS,
} from '@/constants';

type Transport = Awaited<ReturnType<typeof TransportWebUSB.create>>;

/**
 * Runs `action` on a new transport and always closes it, or the device stays claimed.
 * A failed close (e.g. of an unplugged device) doesn't hide the error of `action`.
 */
async function withTransport<T>(action: (transport: Transport) => Promise<T>): Promise<T> {
  const transport = await TransportWebUSB.create();
  try {
    return await action(transport);
  } finally {
    await transport.close().catch(() => {});
  }
}

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
    return withTransport(
      (transport) => new AccountLedgerFactory(transport).initialize(accountIndex),
    );
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
    return withTransport(async (transport) => (
      // TODO: remove `as` after fixing https://github.com/aeternity/aepp-sdk-js/issues/2046
      (await new AccountLedgerFactory(transport).discover(aeSdk.api)) as AccountLedger[]
    ));
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

    return withTransport(
      (transport) => new AccountLedger(transport, accountIndex, address).signMessage(message),
    );
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

    return withTransport(
      (transport) => new AccountLedger(transport, accountIndex, address)
        .signTransaction(transaction, { networkId: nodeNetworkId.value }),
    );
  }

  return {
    deriveAccount,
    discoverAccounts,
    signMessage,
    signTransaction,
  };
}
