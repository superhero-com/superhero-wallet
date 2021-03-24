<script>
import deeplinkApi from '../../../mixins/deeplinkApi';

export default {
  mixins: [deeplinkApi],
  async mounted() {
    try {
      await this.$watchUntilTruly(() => this.$store.state.sdk);
      const { transaction, networkId, broadcast } = this.$route.query;
      const currentNetworkId = this.$store.getters.activeNetwork.networkId;
      if (networkId !== currentNetworkId) {
        await this.$store.dispatch('modals/open', {
          name: 'confirm',
          msg: `This action is being done on network ${networkId}, are you sure you want to proceed?`,
        });
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
    } catch {
      this.openCallbackOrGoHome(false);
      throw new Error('Rejected by user');
    }
  },
  render() {
    return null;
  },
};
</script>
