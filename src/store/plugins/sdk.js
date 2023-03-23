import { RpcWallet, Crypto } from '@aeternity/aepp-sdk';
import { App } from '../modules/permissions';
import { getAeppUrl, showPopup } from '../../background/popupHandler';
import { MODAL_CONFIRM_CONNECT, MODAL_MESSAGE_SIGN, watchUntilTruthy } from '../../popup/utils';
import { IS_EXTENSION_BACKGROUND } from '../../lib/environment';
import { useAccounts, useModals, useSdk } from '../../composables';

export default (store) => {
  const { getSdk, createNewNodeInstance } = useSdk({ store });
  const { openModal } = useModals();
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
        const { activeAccount, isLoggedIn } = useAccounts({ store });
        await watchUntilTruthy(
          () => store.state.isRestored && isLoggedIn.value,
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
              const { address } = activeAccount.value;
              const app = args.pop();
              if (
                app instanceof App
                && !(await store.dispatch('permissions/requestAddressForHost', {
                  host: app.host.host,
                  name: app.host.hostname,
                  address,
                  connectionPopupCb: async () => (IS_EXTENSION_BACKGROUND
                    ? showPopup(app.host.href, 'connectConfirm')
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
              ) return Promise.reject(new Error('Rejected by user'));
              return address;
            },
            sign: (data) => (IS_EXTENSION_BACKGROUND
              ? Crypto.sign(data, activeAccount.value.secretKey)
              : store.dispatch('accounts/sign', data)),
            ...(IS_EXTENSION_BACKGROUND ? {} : {
              signTransaction: (txBase64, opt) => (typeof opt.onAccount === 'object')
                ? opt.onAccount.sign()
                : store.dispatch('accounts/signTransaction', { txBase64, opt }),
            }),
          },
        })({
          nodes: [
            { name: activeNetwork.name, instance: await createNewNodeInstance(activeNetwork.url) },
          ],
          name: 'Superhero',
          onConnection: cbAccept,
          onDisconnect(_, client) {
            client.disconnect();
          },
          async onSubscription(aepp, { accept, deny }, origin) {
            let activeAccountAddress;
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
                  ...store.getters.accounts
                    .reduce((p, { address }) => ({
                      ...p, ...address !== activeAccountAddress ? { [address]: {} } : {},
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
    ({ accounts: { activeIdx } }, { accounts }) => accounts?.length + activeIdx,
    async () => {
      const sdkLocal = await getSdk();
      Object.values(sdkLocal.rpcClients)
        .filter((client) => client.isConnected() && client.isSubscribed())
        .forEach((client) => client.setAccounts({
          current: { [activeAccount.value.address]: {} },
          connected: {
            ...store.getters.accounts
              .reduce((p, { address }) => ({
                ...p, ...address !== activeAccount.value.address ? { [address]: {} } : {},
              }), {}),
          },
        }));
    },
    { immediate: true },
  );
};
