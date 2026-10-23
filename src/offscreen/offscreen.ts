import '@/lib/initPolyfills';
import '@/protocols/registerAdapters';
import { watch } from 'vue';

import type { Runtime } from 'webextension-polyfill';
import type { IBackgroundMessageData, Protocol } from '@/types';

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
import {
  getConnectedSiteAccounts,
  handleEvmRpcRequest,
  isSwitchingEvmChain,
} from '@/protocols/evm/libs/EvmRpcMethodsHandler';
import { ETH_CONTENT_SCRIPT_METHODS, ETH_RPC_WALLET_EVENTS } from '@/protocols/ethereum/config';
import * as wallet from './wallet';
import { registerInPageContentScript, updateDynamicRules } from '../background/utils';
import { isExtensionPageSender } from '../background/messageGuards';
import { isAcceptedOffscreenSender } from './messageGuards';

const { activeNetworkName, networks } = useNetworks();
const { activeAccount, getLastActiveProtocolAccount } = useAccounts();

/**
 * Sends an EIP-1193 event to the content scripts of every tab, as the one the user looks at can
 * be a confirmation window. Each tells only its pages that may hear it.
 */
async function emitWalletEvent(method: string, result?: string) {
  if (IS_FIREFOX) {
    (await browser.tabs.query({})).forEach(({ id }) => {
      if (id) {
        browser.tabs.sendMessage(id, {
          superheroWalletApproved: true,
          method,
          result,
          type: 'result',
        }).catch(() => {}); // A tab without the content script
      }
    });
  } else {
    browser.runtime.sendMessage<IBackgroundMessageData>({
      target: 'background',
      method: method as any,
      params: {
        rpcMethodParams: {
          result,
        },
      },
    });
  }
}

/** Dapps get the chain of the active EVM protocol, Ethereum while another one is active */
const getEvmProtocol = (protocol?: Protocol) => (
  (protocol && EVM_PROTOCOLS.includes(protocol)) ? protocol : PROTOCOLS.ethereum
);

let lastChainIdHex: string | undefined;

function getChainIdHex(protocol: Protocol) {
  const chainIdDec = networks.value[activeNetworkName.value].protocols[protocol].chainId;
  return `0x${BigInt(chainIdDec).toString(16)}`;
}

function emitChainChanged(protocol: Protocol) {
  // Told once the switch is done
  if (isSwitchingEvmChain.value) return;
  const chainIdHex = getChainIdHex(protocol);
  // Switching the protocol and the network at once changes the chain once
  if (chainIdHex !== lastChainIdHex) {
    lastChainIdHex = chainIdHex;
    emitWalletEvent(ETH_RPC_WALLET_EVENTS.chainChanged, chainIdHex);
  }
}

watch(activeNetworkName, (newNetworkName, oldNetworkName) => {
  if (oldNetworkName && newNetworkName !== oldNetworkName) {
    emitChainChanged(getEvmProtocol(activeAccount.value.protocol));
  }
});

watch(isSwitchingEvmChain, (isSwitching) => {
  const protocol = getEvmProtocol(activeAccount.value.protocol);
  if (isSwitching) {
    // So that a rejected switch tells nothing
    lastChainIdHex ??= getChainIdHex(protocol);
  } else {
    emitChainChanged(protocol);
  }
});

// Propagate EIP-1193 accountsChanged when the account dapps see changes
watch(activeAccount, async (newVal, oldVal) => {
  try {
    // None while locked, dapps hear of the chain once there is an account again
    if (!newVal?.protocol) return;
    // E.g. a dapp switched to the chain of another EVM protocol, or one of another
    // protocol made Ethereum's the chain
    if (oldVal && getEvmProtocol(oldVal.protocol) !== getEvmProtocol(newVal.protocol)) {
      emitChainChanged(getEvmProtocol(newVal.protocol));
    }
    const oldAddress = (oldVal && EVM_PROTOCOLS.includes(oldVal.protocol))
      ? oldVal.address
      : undefined;
    const address = EVM_PROTOCOLS.includes(newVal.protocol)
      ? newVal.address
      // Ethereum's last active one, unchanged unless an EVM account was active before
      : oldAddress && getLastActiveProtocolAccount(PROTOCOLS.ethereum)?.address;
    if (oldAddress === address) return;

    // Each content script asks which accounts its page is permitted
    await emitWalletEvent(ETH_RPC_WALLET_EVENTS.accountsChanged);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to emit accountsChanged', e);
  }
});

// If browser is FF, load the redirectRule script because background is not loaded from the manifest
// in FF we have to use the offscreen.html as background page
if (IS_FIREFOX) {
  browser.runtime.onInstalled.addListener(updateDynamicRules);
  registerInPageContentScript();
}

browser.runtime.onMessage.addListener(
  (
    msg: IBackgroundMessageData,
    sender: Runtime.MessageSender,
  ) => {
    if (!isAcceptedOffscreenSender(msg, sender)) return undefined;

    const {
      method,
      payload,
      params: { aepp, rpcMethodParams } = {},
    } = msg;

    // Content scripts relay whatever a web page posts: EVM RPC calls only,
    // so take the origin from the browser, not from the message.
    if (!isExtensionPageSender(sender)) {
      if (method === ETH_CONTENT_SCRIPT_METHODS.getPermittedAccounts && sender.url) {
        return Promise.resolve({ result: getConnectedSiteAccounts(new URL(sender.url).origin) });
      }
      if (typeof aepp === 'string' && method && sender.url) {
        return handleEvmRpcRequest(new URL(sender.url).origin, method, rpcMethodParams);
      }
      return undefined;
    }

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

    return undefined;
  },
);

wallet.init();

// Initialize the WalletConnect state monitoring to allow opening the confirmation popup windows.
useWalletConnect({ offscreen: true });
