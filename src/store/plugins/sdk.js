import { RpcWallet, Crypto, Node } from '@aeternity/aepp-sdk';
import { isEmpty, isEqual } from 'lodash-es';
import { App } from '../modules/permissions';
import { getAeppUrl, showPopup } from '../../background/popupHandler';

export default (store) => {
  let sdk;

  store.registerModule('sdk', {
    namespaced: true,
    getters: {
      sdk: () => sdk || null,
    },
    actions: {
      async initialize() {
        if (sdk) return;
        await store.dispatch('ensureRestored');
        // eslint-disable-next-line no-underscore-dangle
        await store._watcherVM.$watchUntilTruly(() => !isEmpty(store.getters.account));

        const { activeNetwork } = store.getters;

        const cbAccept = (_, { accept }) => accept();
        const signCb = async (type, aepp, action) => {
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
              const hostPermissions = store.state.permissions[aeppUrl.hostname];
              if (!hostPermissions) store.commit('permissions/addHost', aeppUrl.hostname);
              return new App(aeppUrl);
            },
            async address(...args) {
              const { address } = store.getters.account;
              const app = args.pop();
              if (
                app instanceof App
                && !(await store.dispatch('permissions/requestAddressForHost', {
                  host: app.host.hostname,
                  address,
                  connectionPopupCb: async () => showPopup(app.host.href, 'connectConfirm'),
                }))
              ) return Promise.reject(new Error('Rejected by user'));
              return address;
            },
            sign: (data) => Crypto.sign(data, store.getters.account.secretKey),
          },
        })({
          nodes: [{ name: activeNetwork.name, instance: await Node({ url: activeNetwork.url }) }],
          compilerUrl: activeNetwork.compilerUrl,
          name: 'Superhero',
          onConnection: cbAccept,
          onDisconnect(_, client) {
            client.disconnect();
          },
          async onSubscription(aepp, { accept, deny }) {
            let activeAccount;
            try {
              activeAccount = await this.address(this.getApp(getAeppUrl(aepp)));
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
          onSign: signCb.bind(null, 'sign'),
          onMessageSign: signCb.bind(null, 'messageSign'),
          onAskAccounts: cbAccept,
        });
      },
    },
  });

  store.watch(
    (state, getters) => getters.activeNetwork,
    async (network, oldNetwork) => {
      if (isEqual(network, oldNetwork)) return;
      sdk.pool.delete(network.name);
      sdk.addNode(network.name, await Node({ url: network.url }), true);
    },
  );

  store.watch(
    ({ accounts: { activeIdx } }) => activeIdx,
    async (accountIdx) => sdk.selectAccount(store.getters.accounts[accountIdx].address),
  );

  store.watch(
    (state, getters) => getters.accounts.length,
    () => {
      sdk.accounts = store.getters.accounts
        .reduce((p, { address }) => ({ ...p, [address]: {} }), {});
    },
  );
};
