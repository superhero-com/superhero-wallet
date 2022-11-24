import { computed, ref } from '@vue/composition-api';
import { Node, RpcWallet, Universal } from '@aeternity/aepp-sdk';
import type {
  IDefaultComposableOptions,
  ISdk,
  INetwork,
  IResponseChallenge,
  IRespondChallenge,
} from '../types';
import { App } from '../store/modules/permissions';
import { IS_EXTENSION_BACKGROUND } from '../lib/environment';
import {
  MODAL_CONFIRM_CONNECT,
  MODAL_MESSAGE_SIGN,
  POPUP_TYPE_CONNECT,
  connectFrames,
  watchUntilTruthy,
} from '../popup/utils';
import { getAeppUrl, showPopup } from '../background/popupHandler';
import { useAccounts } from './accounts';
import { useModals } from './modals';

let sdk: ISdk;
let sdkBlocked = false;
let drySdk: ISdk;
let sdkCurrentNetwork: INetwork;

const isNodeConnecting = ref<boolean>(false);
const isNodeReady = ref<boolean>(false);
const isNodeError = ref<boolean>(false);

/**
 * Composable that will replace the Vuex SDK plugin.
 * For now, it works as an abstraction layer.
 */
export function useSdk({ store }: IDefaultComposableOptions) {
  const { accounts, activeAccount, isLoggedIn } = useAccounts({ store });
  const { openModal } = useModals();
  const isSdkReady = computed(() => !!sdk);
  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);

  /**
   * Successful creation of the node means that we are able to connect to node.
   * TODO:
   * With version 12+ creating Node is not async anymore
   * so `nodeInstance.getStatus()` should be used to establish the connection status.
   */
  async function createNodeInstance(url: string) {
    let nodeInstance;
    isNodeReady.value = false;
    isNodeError.value = false;
    isNodeConnecting.value = true;
    try {
      nodeInstance = await Node({ url });
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

    const signCb = async (type: any, action: any, origin: any) => {
      const { method, params } = action;
      try {
        const originUrl = new URL(origin);
        const permission = await store.dispatch('permissions/checkPermissions', {
          host: originUrl.host,
          method,
          params: params?.txObject?.params,
        });
        const aeppUrl = {
          name: originUrl.host,
          host: originUrl.host,
          protocol: originUrl.protocol,
          url: originUrl.href,
        };

        if (method === 'message.sign') {
          if (!permission) {
            await openModal(MODAL_MESSAGE_SIGN, {
              message: params.message,
              app: aeppUrl,
            });
          }
          action.accept({ onAccount: { sign: () => {}, address: () => {} } });
          return;
        }

        action.accept(null, {
          onAccount: {
            sign: async () => store.dispatch('accounts/signTransaction', {
              txBase64: params.tx,
              opt: {
                modal: !permission,
                app: aeppUrl,
              },
            }),
            address: () => {},
          },
        });
      } catch (error: any) {
        action.deny();
        if (error.message !== 'Rejected by user') throw error;
      }
      action.deny();
    };

    const signCbBackground = async (type: any, aepp: any, action: any) => {
      const { method, params } = action;
      if (
        (await store.dispatch('permissions/checkPermissions', {
          host: getAeppUrl(aepp).hostname,
          method,
          params: params?.txObject?.params,
        }))
        || (await showPopup(aepp, type, params).then(
          () => true,
          () => false,
        ))
      ) {
        action.accept.apply(null, [
          ...(method === 'message.sign' ? [] : [null]),
          { onAccount: { sign: () => {}, address: () => {} } },
        ]);
        return;
      }
      action.deny();
    };

    sdk = await RpcWallet.compose({
      methods: {
        getApp(aeppUrl: any) {
          return new App(aeppUrl);
        },
        async address(...args: any) {
          const { address } = activeAccount.value;
          const app = args.pop();
          if (
            app instanceof App
            && !(await store.dispatch('permissions/requestAddressForHost', {
              host: app.host.host,
              name: app.host.hostname,
              address,
              connectionPopupCb: async () => (IS_EXTENSION_BACKGROUND
                ? showPopup(app.host.href, POPUP_TYPE_CONNECT)
                : openModal(MODAL_CONFIRM_CONNECT, {
                  app: {
                    name: app.host.hostname,
                    icons: [],
                    protocol: app.host.protocol,
                    host: app.host.host,
                    url: app.host.href,
                  },
                })),
            }))
          ) {
            return Promise.reject(new Error('Rejected by user'));
          }
          return address;
        },
        sign: (data: any) => (IS_EXTENSION_BACKGROUND)
          ? (Crypto as any).sign(data, activeAccount.value.secretKey)
          : store.dispatch('accounts/sign', data),
        ...(IS_EXTENSION_BACKGROUND ? {} : {
          signTransaction: (txBase64: any, opt: any) => (opt.onAccount
            ? opt.onAccount.sign()
            : store.dispatch('accounts/signTransaction', { txBase64, opt })),
        }),
      },
    })({
      nodes: [{
        name: activeNetwork.value.name,
        instance: nodeInstance,
      }],
      compilerUrl: activeNetwork.value.compilerUrl,
      name: 'Superhero',
      onConnection: (_: any, { accept }: any) => accept(),
      onDisconnect: (_: any, { disconnect }: any) => disconnect(),
      async onSubscription(aepp: any, { accept, deny }: any, origin: any) {
        let activeAccountAddress: string;
        try {
          const url = IS_EXTENSION_BACKGROUND ? getAeppUrl(aepp) : new URL(origin);
          activeAccountAddress = await this.address(this.getApp(url));
        } catch (e) {
          deny();
          return;
        }
        accept({
          accounts: {
            current: { [activeAccountAddress]: {} },
            connected: {
              ...accounts.value
                .reduce((p: any, { address }: any) => ({
                  ...p, ...address !== activeAccountAddress ? { [address]: {} } : {},
                }), {}),
            },
          },
        });
      },
      onSign: IS_EXTENSION_BACKGROUND ? signCbBackground.bind(null, 'sign') : signCb,
      onMessageSign: IS_EXTENSION_BACKGROUND ? signCbBackground.bind(null, 'messageSign') : signCb,
      onAskAccounts: (_: any, { accept }: any) => accept(
        accounts.value.map(({ address }) => address),
      ),
    });

    connectFrames(sdk);

    store.dispatch('initTippingContractInstances');

    sdkBlocked = false;
  }

  async function resetSdkNode() {
    sdkBlocked = true;
    sdk.pool.delete(sdkCurrentNetwork.name);
    const nodeInstance = await createNodeInstance(activeNetwork.value.url);
    sdk.addNode(activeNetwork.value.name, nodeInstance, true);
    sdkCurrentNetwork = activeNetwork.value;
    sdkBlocked = false;
  }

  /**
   * Get the SDK instance. For now the SDK state is asynchronous.
   * TODO: With the new SDK version this probably could be replaced with a computed prop.
   */
  async function getSdk(): Promise<ISdk> {
    if (sdkBlocked) {
      await watchUntilTruthy(isSdkReady);
    } else if (!sdk) {
      await initSdk();
    } else if (sdkCurrentNetwork.networkId !== activeNetwork.value.networkId) {
      await resetSdkNode();
    }
    return sdk;
  }

  /**
   * drySdk is the sdk instance with no accounts attached.
   * To use for multisig operations.
   */
  async function getDrySdk(): Promise<ISdk> {
    if (!drySdk) {
      const { compilerUrl, name, url } = activeNetwork.value;
      drySdk = await Universal({
        nodes: [{
          name,
          instance: await Node({ url }),
        }],
        compilerUrl,
      });
    } else if (activeNetwork.value.url !== drySdk.selectedNode.instance.url) {
      drySdk.pool.delete(activeNetwork.value.name);
      drySdk.addNode(activeNetwork.value.name, await Node({ url: activeNetwork.value.url }), true);
    }
    return drySdk;
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
    getDrySdk,
    createNodeInstance,
    fetchRespondChallenge,
  };
}
