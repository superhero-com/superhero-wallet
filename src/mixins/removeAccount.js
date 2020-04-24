import { AEX2_METHODS } from '../popup/utils/constants';
import { postMessage } from '../popup/utils/connection';

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
        this.$emit('closeMenu');
        await this.$store.dispatch('reset');
        await this.$router.push('/');
        this.$store.commit('SET_MAIN_LOADING', false);
        if (process.env.IS_EXTENSION) postMessage({ type: AEX2_METHODS.LOGOUT });
      }
    },
  },
};
