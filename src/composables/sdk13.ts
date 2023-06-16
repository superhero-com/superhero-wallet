import { computed, ref } from '@vue/composition-api';
import {
  Node,
  WALLET_TYPE,
  RpcRejectedByUserError,
  CompilerHttp,
} from '@aeternity/aepp-sdk-13';
import { ShSdkWallet } from '../lib/shSdkWallet';
import type {
  IDefaultComposableOptions,
  INetwork,
  IResponseChallenge,
  IRespondChallenge,
} from '../types';
import { App } from '../store/modules/permissions';
import { IS_EXTENSION_BACKGROUND } from '../lib/environment';
import {
  MODAL_CONFIRM_CONNECT,
  POPUP_TYPE_CONNECT,
  connectFrames,
  watchUntilTruthy,
} from '../popup/utils';
import { showPopup } from '../background/popupHandler';
import { useAccounts } from './accounts';

let sdk: ShSdkWallet;
let sdkBlocked = false;
let sdkCurrentNetwork: INetwork;
const isNodeConnecting = ref<boolean>(false);
const isNodeReady = ref<boolean>(false);
const isNodeError = ref<boolean>(false);
const aeppInfo: Record<string, any> = {};

/**
 * Composable that will replace the Vuex SDK plugin.
 * For now, it works as an abstraction layer.
 */
export function useSdk13({ store }: IDefaultComposableOptions) {
  const { isLoggedIn } = useAccounts({ store });
  const isSdkReady = computed(() => !!sdk);
  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);

  /**
   * Create Node instance and get connection status
   */
  async function createNodeInstance(url: string) {
    let nodeInstance;
    isNodeReady.value = false;
    isNodeError.value = false;
    isNodeConnecting.value = true;
    try {
      // TODO: remove ignore version once HTTP compiler dependency is removed
      nodeInstance = new Node(url, { ignoreVersion: true });
      await nodeInstance.getStatus();
      isNodeReady.value = true;
    } catch (error) {
      isNodeError.value = true;
      return null;
    } finally {
      isNodeConnecting.value = false;
    }
    return nodeInstance;
  }

  async function initSdk() {
    sdkBlocked = true;

    await Promise.all([
      watchUntilTruthy(() => store.state.isRestored),
      watchUntilTruthy(isLoggedIn),
    ]);
    sdkCurrentNetwork = activeNetwork.value;
    const nodeInstance = await createNodeInstance(activeNetwork.value.url);

    sdk = new ShSdkWallet(store, {
      name: 'Superhero',
      nodes: [{
        name: activeNetwork.value.name,
        instance: nodeInstance!,
      }],
      id: 'Superhero Wallet',
      type: WALLET_TYPE.extension,
      onCompiler: new CompilerHttp(activeNetwork.value.compilerUrl),
      onConnection(aeppId: string, params: any, origin: string) {
        aeppInfo[aeppId] = { ...params, origin };
      },
      onDisconnect(aeppId: string) {
        delete aeppInfo[aeppId];
      },
      async onSubscription(aeppId: string) {
        const aepp = aeppInfo[aeppId];
        const url = IS_EXTENSION_BACKGROUND ? new URL(aepp.origin) : new URL(origin);
        const app = new App(url);
        const { activeAccount } = useAccounts({ store });
        if (!(await store.dispatch('permissions/requestAddressForHost', {
          host: app.host.host,
          name: app.host.hostname,
          address: activeAccount.value.address,
          connectionPopupCb: () => IS_EXTENSION_BACKGROUND
            ? showPopup(app.host.href, POPUP_TYPE_CONNECT)
            : store.dispatch('modals/open', {
              name: MODAL_CONFIRM_CONNECT,
              app: {
                name: app.host.hostname,
                icons: [],
                protocol: app.host.protocol,
                host: app.host.host,
              },
            }),
        }))
        ) {
          return Promise.reject(new RpcRejectedByUserError('Rejected by user'));
        }
        return activeAccount.value.address;
      },
      onAskAccounts: () => {
        const { accountsAddressList } = useAccounts({ store });
        return accountsAddressList.value;
      },
    });

    connectFrames(sdk);

    sdkBlocked = false;
  }

  async function resetSdkNode() {
    sdkBlocked = true;
    sdk.pool.delete(sdkCurrentNetwork.name);
    const nodeInstance = await createNodeInstance(activeNetwork.value.url);
    sdk.addNode(activeNetwork.value.name, nodeInstance!, true);
    sdkCurrentNetwork = activeNetwork.value;
    sdkBlocked = false;
  }

  /**
   * Get the SDK instance. For now the SDK state is asynchronous.
   * TODO: this probably could be replaced with a computed prop.
   */
  async function getSdk(): Promise<ShSdkWallet> {
    if (sdkBlocked) {
      await watchUntilTruthy(isSdkReady);
    } else if (!sdk) {
      await initSdk();
    } else if (sdkCurrentNetwork.networkId !== activeNetwork.value.networkId) {
      await resetSdkNode();
    }
    return sdk;
  }

  async function fetchRespondChallenge(
    responseChallenge: IResponseChallenge,
  ): Promise<IRespondChallenge> {
    const sdkLocal = await getSdk();
    const signedChallenge = Buffer.from(
      await sdkLocal.signMessage(responseChallenge.challenge),
    ).toString('hex');

    return {
      challenge: responseChallenge.challenge,
      signature: signedChallenge,
    };
  }

  return {
    isNodeReady,
    isNodeConnecting,
    isNodeError,
    isSdkReady,
    getSdk,
    fetchRespondChallenge,
  };
}
