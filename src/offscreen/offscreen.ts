import '@/lib/initPolyfills';
import '@/protocols/registerAdapters';
import { watch } from 'vue';

import type { IBackgroundMessageData } from '@/types';
import type { EthRpcSupportedMethods } from '@/protocols/ethereum/types';

import {
  IS_FIREFOX,
  POPUP_METHODS,
  PROTOCOLS,
  EVM_PROTOCOLS,
} from '@/constants';
import {
  useWalletConnect,
  useNetworks,
  useLedger,
  useAccounts,
} from '@/composables';
import { handleEvmRpcMethod } from '@/protocols/evm/libs/EvmRpcMethodsHandler';
import { ETH_RPC_WALLET_EVENTS } from '@/protocols/ethereum/config';
import * as wallet from './wallet';
import { registerInPageContentScript, updateDynamicRules } from '../background/utils';

const { activeNetworkName, networks } = useNetworks();
const { activeAccount } = useAccounts();

watch(activeNetworkName, async (newNetworkName, oldNetworkName) => {
  if (oldNetworkName && newNetworkName !== oldNetworkName) {
    const protocol = EVM_PROTOCOLS.includes(activeAccount.value.protocol)
      ? activeAccount.value.protocol
      : PROTOCOLS.ethereum;
    const chainIdDec = networks.value[newNetworkName].protocols[protocol].chainId;
    const chainIdHex = `0x${BigInt(chainIdDec).toString(16)}`;
    if (IS_FIREFOX) {
      const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab.id) {
        browser.tabs.sendMessage(tab.id, {
          superheroWalletApproved: true,
          method: ETH_RPC_WALLET_EVENTS.chainChanged,
          result: chainIdHex,
          type: 'result',
        });
      }
    } else {
      browser.runtime.sendMessage<IBackgroundMessageData>({
        target: 'background',
        method: ETH_RPC_WALLET_EVENTS.chainChanged,
        params: {
          rpcMethodParams: {
            result: chainIdHex,
          },
        },
      });
    }
  }
});

// If browser is FF, load the redirectRule script because background is not loaded from the manifest
// in FF we have to use the offscreen.html as background page
if (IS_FIREFOX) {
  browser.runtime.onInstalled.addListener(updateDynamicRules);
  registerInPageContentScript();
}

browser.runtime.onMessage.addListener(
  async ({
    method,
    payload,
    params: { aepp, rpcMethodParams = {} } = {},
  }: IBackgroundMessageData) => {
    if (method === POPUP_METHODS.reload) {
      wallet.disconnect();
      window.location.reload();
      return null;
    }

    if (method === POPUP_METHODS.ledgerDeriveAccount) {
      const { deriveAccount } = useLedger();
      return deriveAccount(payload.accountIndex);
    }

    if (method === POPUP_METHODS.ledgerDiscoverAccounts) {
      const { discoverAccounts } = useLedger();
      return discoverAccounts();
    }
    if (method === POPUP_METHODS.ledgerSignTransaction) {
      const { signTransaction } = useLedger();
      return signTransaction(payload.address, payload.accountIndex, payload.transaction);
    }

    if (method === POPUP_METHODS.ledgerSignMessage) {
      const { signMessage } = useLedger();
      return signMessage(payload.address, payload.accountIndex, payload.message);
    }

    if (typeof aepp === 'string' && method) {
      return handleEvmRpcMethod(aepp, method as EthRpcSupportedMethods, rpcMethodParams);
    }

    return true;
  },
);

wallet.init();

// Initialize the WalletConnect state monitoring to allow opening the confirmation popup windows.
useWalletConnect({ offscreen: true });
