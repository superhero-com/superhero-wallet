import { Universal, Crypto } from '@aeternity/aepp-sdk';
import { App } from '../modules/permissions';
import { watchUntilTruthy } from '../../popup/utils';
import { IS_EXTENSION_BACKGROUND } from '../../lib/environment';
import { useAccounts, useSdk } from '../../composables';

export default (store) => {
  const { createNewNodeInstance } = useSdk({ store });

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

        sdk = await Universal.compose({
          methods: {
            getApp(aeppUrl) {
              return new App(aeppUrl);
            },
            async address() {
              const { address } = activeAccount.value;
              return address;
            },
            sign: (data) => (IS_EXTENSION_BACKGROUND
              ? Crypto.sign(data, activeAccount.value.secretKey)
              : store.dispatch('accounts/sign', data)),
            ...(IS_EXTENSION_BACKGROUND ? {} : {
              signTransaction: (txBase64, options) => (typeof options.onAccount === 'object')
                ? options.onAccount.sign()
                : store.dispatch('accounts/signTransaction', { txBase64, options }),
            }),
          },
        })({
          nodes: [
            { name: activeNetwork.name, instance: await createNewNodeInstance(activeNetwork.url) },
          ],
          name: 'Superhero',
        });
        commit('setSdkReady');
      },
    },
  });
};
