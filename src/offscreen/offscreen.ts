import '@/lib/initPolyfills';
import '@/protocols/registerAdapters';
import { watch } from 'vue';
import type { IBackgroundMessageData } from '@/types';
import type { EthRpcSupportedMethods } from '@/protocols/ethereum/types';

import { IS_FIREFOX, POPUP_METHODS, PROTOCOLS } from '@/constants';
import { useWalletConnect, useNetworks } from '@/composables';
import { handleEthereumRpcMethod } from '@/protocols/ethereum/libs/EthereumRpcMethodsHandler';
import { ETH_RPC_WALLET_EVENTS } from '@/protocols/ethereum/config';
import * as wallet from './wallet';
import { registerInPageContentScript, updateDynamicRules } from '../background/utils';

const { activeNetworkName, networks } = useNetworks();

watch(activeNetworkName, async (newNetworkName, oldNetworkName) => {
  if (oldNetworkName && newNetworkName !== oldNetworkName) {
    if (IS_FIREFOX) {
      const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab.id) {
        browser.tabs.sendMessage(tab.id, {
          superheroWalletApproved: true,
          method: ETH_RPC_WALLET_EVENTS.chainChanged,
          result: `0x${BigInt(networks.value[newNetworkName].protocols[PROTOCOLS.ethereum].chainId).toString(16)}`,
          type: 'result',
        });
      }
    } else {
      browser.runtime.sendMessage<IBackgroundMessageData>({
        target: 'background',
        method: ETH_RPC_WALLET_EVENTS.chainChanged,
        params: {
          rpcMethodParams: {
            result: `0x${BigInt(networks.value[newNetworkName].protocols[PROTOCOLS.ethereum].chainId).toString(16)}`,
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
  async ({ method, params: { aepp, rpcMethodParams = {} } = {} }: IBackgroundMessageData) => {
    if (method === POPUP_METHODS.reload) {
      wallet.disconnect();
      window.location.reload();
      return null;
    }

    if (typeof aepp === 'string' && method) {
      return handleEthereumRpcMethod(aepp, method as EthRpcSupportedMethods, rpcMethodParams);
    }

    return true;
  },
);

wallet.init();

// Initialize the WalletConnect state monitoring to allow opening the confirmation popup windows.
useWalletConnect({ offscreen: true });
