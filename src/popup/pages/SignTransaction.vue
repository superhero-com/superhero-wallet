<script>
import deeplinkApi from '../../mixins/deeplinkApi';
import { handleUnknownError, watchUntilTruthy } from '../utils/helper';

export default {
  mixins: [deeplinkApi],
  async mounted() {
    try {
      await watchUntilTruthy(() => this.$store.state.sdk);
      const { transaction, networkId, broadcast } = this.$route.query;
      const currentNetworkId = this.$store.getters.activeNetwork.networkId;
      if (networkId !== currentNetworkId) {
        await this.$store.dispatch('modals/open', {
          name: 'default',
          icon: 'warning',
          title: this.$t('modals.wrongNetwork.title'),
          msg: this.$t('modals.wrongNetwork.msg', [networkId]),
          buttonMessage: this.$t('modals.wrongNetwork.button'),
        });
        this.openCallbackOrGoHome(false);
        return;
      }
      const signedTransaction = await this.$store.state.sdk
        .signTransaction(transaction, { networkId });
      if (broadcast) {
        const result = await this.$store.state.sdk
          .sendTransaction(signedTransaction, { waitMined: true });
        this.openCallbackOrGoHome(true, { 'transaction-hash': result.hash });
      } else {
        this.openCallbackOrGoHome(true, { transaction: signedTransaction });
      }
    } catch (e) {
      this.openCallbackOrGoHome(false);
      if (e.message !== 'Rejected by user') handleUnknownError(e);
    }
  },
  render() {
    return null;
  },
};
</script>
