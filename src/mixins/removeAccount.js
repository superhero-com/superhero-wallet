import { AEX2_METHODS } from '../popup/utils/constants';
import { postMessage } from '../popup/utils/connection';
import { IN_FRAME } from '../popup/utils/helper';

export default {
  methods: {
    async removeAccount() {
      const remove = await this.$store
        .dispatch('modals/open', {
          name: 'confirm',
          title: this.$t('modals.removeAccount.title'),
          msg: this.$t('modals.removeAccount.msg'),
        })
        .catch(() => false);
      if (remove) {
        this.$emit('close');
        if (process.env.PLATFORM === 'web' && IN_FRAME) {
          const { sdk } = this.$store.state;
          const { clients } = sdk.getClients();
          Array.from(clients.values()).forEach((aepp) => {
            aepp.sendMessage(
              { method: 'connection.close', params: { reason: 'bye' }, jsonrpc: '2.0' },
              true,
            );
            aepp.disconnect();
          });
        }
        await this.$store.dispatch('reset');
        await this.$router.push('/');
        this.$store.commit('setMainLoading', false);
        if (process.env.IS_EXTENSION) postMessage({ type: AEX2_METHODS.LOGOUT });
      }
    },
  },
};
