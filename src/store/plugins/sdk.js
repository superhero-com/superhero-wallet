import {
  AeSdkWallet,
  sign,
  Node,
  WALLET_TYPE,
  messageToHash,
  unpackTx,
  RpcRejectedByUserError,
  CompilerHttp,
} from '@aeternity/aepp-sdk';
import { isEmpty, isEqual } from 'lodash-es';
import { App } from '../modules/permissions';
import { showPopup } from '../../background/popupHandler';
import { MODAL_CONFIRM_CONNECT, watchUntilTruthy } from '../../popup/utils';
import { IS_CORDOVA, IS_EXTENSION_BACKGROUND } from '../../lib/environment';

export default (store) => {
  let sdk;
  const aeppInfo = {};

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
        await watchUntilTruthy(
          () => store.state.isRestored && !isEmpty(store.getters.account),
        );

        const { activeNetwork } = store.getters;

        const signCb = async (payload, options, origin = null) => {
          try {
            const host = origin ? new URL(origin).host : null;
            const permission = (!host && IS_CORDOVA)
              ? true
              : await store.dispatch('permissions/checkPermissions', {
                host,
                method: 'sign',
                params: payload,
              });

            return store.dispatch('accounts/signTransaction', {
              txBase64: payload,
              options: {
                ...options,
                modal: !permission,
                host,
              },
            });
          } catch (error) {
            throw new RpcRejectedByUserError(error.message);
          }
        };

        const signCbBackground = async (method, payload, options) => {
          const aepp = aeppInfo[options.aeppRpcClientId];
          if (
            (await store.dispatch('permissions/checkPermissions', {
              host: new URL(aepp.origin).host,
              method,
              params: options,
            }))
            || (await showPopup(
              aepp.origin,
              method === 'transaction.sign' ? 'sign' : 'messageSign',
              { ...options, ...(method === 'transaction.sign') ? { tx: payload, txObject: unpackTx(payload) } : { message: payload } },
            ).then(
              () => true,
              () => false,
            ))
          ) {
            if (method === 'message.sign') {
              return store.dispatch('accounts/sign', messageToHash(payload));
            }
            return store.dispatch('accounts/signTransaction', {
              txBase64: payload,
              options: {
                ...options,
                modal: false,
                host: aepp.origin,
              },
            });
          }
          throw new RpcRejectedByUserError('Rejected by user');
        };

        // TODO: move this to a seperate file with typescript and combine the custom type
        class SuperheroSdk extends AeSdkWallet {
          _resolveAccount = () => ({
            address: store.getters.account.address,
            sign: (unsigned) => (IS_EXTENSION_BACKGROUND
              ? sign(unsigned, store.getters.account.secretKey)
              : store.dispatch('accounts/sign', unsigned)),
            signMessage: (message, options) => IS_EXTENSION_BACKGROUND
              ? signCbBackground('message.sign', message, options)
              : store.dispatch('accounts/sign', messageToHash(message)),
            signTransaction: (txBase64, options, origin) => IS_EXTENSION_BACKGROUND
              ? signCbBackground('transaction.sign', txBase64, options)
              : signCb(txBase64, options, origin),
          });

            getAccounts = () => ({
              current: { [store.getters.account.address]: {} },
              connected: {
                ...store.getters.accounts
                  .reduce((p, { address }) => ({
                    ...p, ...address !== store.getters.account.address ? { [address]: {} } : {},
                  }), {}),
              },
            });

            addresses = () => store.getters.accounts.map(
              (account) => account.address,
            );
        }

        sdk = new SuperheroSdk({
          name: 'Superhero',
          nodes: [{ name: activeNetwork.name, instance: new Node(activeNetwork.url) }],
          id: 'Superhero Wallet',
          type: WALLET_TYPE.extension,
          onCompiler: new CompilerHttp(activeNetwork.compilerUrl),
          onConnection(aeppId, params, origin) {
            aeppInfo[aeppId] = { ...params, origin };
          },
          onDisconnect(_, client) {
            client.disconnect();
          },
          async onSubscription(aeppId) {
            const aepp = aeppInfo[aeppId];
            const url = IS_EXTENSION_BACKGROUND ? new URL(aepp.origin) : new URL(origin);
            const app = new App(url);
            const { address } = store.getters.account;
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
            ) return Promise.reject(new RpcRejectedByUserError('Rejected by user'));
            return address;
          },
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
      await watchUntilTruthy(() => store.getters['sdkPlugin/sdk']);
      sdk.pool.delete(network.name);
      sdk.addNode(network.name, new Node(network.url), true);
    },
  );

  store.watch(
    ({ accounts: { activeIdx } }, { accounts }) => accounts?.length + activeIdx,
    async () => {
      await watchUntilTruthy(() => store.getters['sdkPlugin/sdk']);
      Object.values(sdk._clients)
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
