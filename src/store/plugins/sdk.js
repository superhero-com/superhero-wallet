import { RpcWallet, Crypto, Node } from '@aeternity/aepp-sdk';
import { isEmpty, isEqual } from 'lodash-es';
import { App } from '../modules/permissions';
import { MODAL_CONFIRM_CONNECT } from '../../popup/utils/constants';
import { getAeppUrl, showPopup } from '../../background/popupHandler';
import { waitUntilTruthy } from '../../popup/utils/helper';
import { IS_EXTENSION_BACKGROUND } from '../../lib/environment';

export default (store) => {
  let sdk;

  store.registerModule('sdkPlugin', {
    namespaced: true,
    state: {
      ready: false,
    },
    getters: {
      sdk: ({ ready }) => (ready ? sdk : undefined),
    },
    mutations: {
      setSdkReady(state) {
        state.ready = true;
      },
    },
    actions: {
      async initialize({ commit }) {
        if (sdk) return;
        await waitUntilTruthy(
          () => store.state.isRestored && !isEmpty(store.getters.account),
        );

        const { activeNetwork } = store.getters;

        const cbAccept = (_, { accept }) => accept();
        const signCb = async (_, action, origin) => {
          const { method, params } = action;
          try {
            const originUrl = new URL(origin);
            const permission = await store.dispatch('permissions/checkPermissions', {
              host: originUrl.host,
              method,
              params: params?.txObject?.params,
            });
            if (method === 'message.sign') {
              if (!permission) {
                await store.dispatch('modals/open', {
                  name: 'confirm-message-sign',
                  message: params.message,
                  app: {
                    name: originUrl.host,
                    host: originUrl.host,
                    protocol: originUrl.protocol,
                  },
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
                    host: originUrl.host,
                  },
                }),
                address: () => {},
              },
            });
          } catch (error) {
            action.deny();
            if (error.message !== 'Rejected by user') throw error;
          }
          action.deny();
        };

        const signCbBackground = async (type, aepp, action) => {
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
            getApp(aeppUrl) {
              return new App(aeppUrl);
            },
            async address(...args) {
              const { address } = store.getters.account;
              const app = args.pop();
              if (
                app instanceof App
                && !(await store.dispatch('permissions/requestAddressForHost', {
                  host: app.host.host,
                  name: app.host.hostname,
                  address,
                  connectionPopupCb: async () => (IS_EXTENSION_BACKGROUND
                    ? showPopup(app.host.href, 'connectConfirm')
                    : store.dispatch('modals/open', {
                      name: MODAL_CONFIRM_CONNECT,
                      app: {
                        name: app.host.hostname,
                        icons: [],
                        protocol: app.host.protocol,
                        host: app.host.host,
                      },
                    })),
                }))
              ) return Promise.reject(new Error('Rejected by user'));
              return address;
            },
            sign: (data) => (IS_EXTENSION_BACKGROUND
              ? Crypto.sign(data, store.getters.account.secretKey)
              : store.dispatch('accounts/sign', data)),
            ...(IS_EXTENSION_BACKGROUND ? {} : {
              signTransaction: (txBase64, opt) => (opt.onAccount
                ? opt.onAccount.sign()
                : store.dispatch('accounts/signTransaction', { txBase64, opt })),
            }),
          },
        })({
          nodes: [{ name: activeNetwork.name, instance: await Node({ url: activeNetwork.url }) }],
          compilerUrl: activeNetwork.compilerUrl,
          name: 'Superhero',
          onConnection: cbAccept,
          onDisconnect(_, client) {
            client.disconnect();
          },
          async onSubscription(aepp, { accept, deny }, origin) {
            let activeAccount;
            try {
              const url = IS_EXTENSION_BACKGROUND ? getAeppUrl(aepp) : new URL(origin);
              activeAccount = await this.address(this.getApp(url));
            } catch (e) {
              deny();
              return;
            }
            accept({
              accounts: {
                current: { [activeAccount]: {} },
                connected: {
                  ...store.getters.accounts
                    .reduce((p, { address }) => ({
                      ...p, ...address !== activeAccount ? { [address]: {} } : {},
                    }), {}),
                },
              },
            });
          },
          onSign: IS_EXTENSION_BACKGROUND ? signCbBackground.bind(null, 'sign') : signCb,
          onMessageSign: IS_EXTENSION_BACKGROUND ? signCbBackground.bind(null, 'messageSign') : signCb,
          onAskAccounts: (_, { accept }) => accept(store.getters.accounts
            .map(({ address }) => address)),
        });
        commit('setSdkReady');
      },
    },
  });

  store.watch(
    (state, getters) => getters.activeNetwork,
    async (network, oldNetwork) => {
      if (isEqual(network, oldNetwork)) return;
      await waitUntilTruthy(() => store.getters['sdkPlugin/sdk']);
      sdk.pool.delete(network.name);
      sdk.addNode(network.name, await Node({ url: network.url }), true);
    },
  );

  store.watch(
    ({ accounts: { activeIdx } }, { accounts }) => accounts?.length + activeIdx,
    async () => {
      await waitUntilTruthy(() => store.getters['sdkPlugin/sdk']);
      Object.values(sdk.rpcClients)
        .filter((client) => client.isConnected() && client.isSubscribed())
        .forEach((client) => client.setAccounts({
          current: { [store.getters.account.address]: {} },
          connected: {
            ...store.getters.accounts
              .reduce((p, { address }) => ({
                ...p, ...address !== store.getters.account.address ? { [address]: {} } : {},
              }), {}),
          },
        }));
    },
    { immediate: true },
  );
};
