<template>
  <div class="claim-tips popup">
    <p class="primary-title text-left mb-8 f-16">
      {{ $t('pages.claimTips.urlToClaim') }}
    </p>
    <Input size="m-0 sm" v-model="url" :error="!normalizedUrl" />

    <Button @click="claimTips" :disabled="!normalizedUrl || !tippingSupported">
      {{ $t('pages.tipPage.confirm') }}
    </Button>
    <Button :to="{ name: 'account' }">
      {{ $t('pages.tipPage.cancel') }}
    </Button>

    <Loader v-if="loading" />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { aettosToAe, toURL, validateTipUrl } from '../../utils/helper';
import Input from '../components/Input';
import Button from '../components/Button';

export default {
  components: { Input, Button },
  data: () => ({
    url: '',
    loading: false,
  }),
  computed: {
    ...mapState(['sdk', 'tippingV1']),
    ...mapGetters(['account', 'tippingSupported']),
    normalizedUrl() {
      if (!validateTipUrl(this.url)) return '';
      return toURL(this.url).toString();
    },
  },
  async created() {
    if (process.env.IS_EXTENSION) {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab && validateTipUrl(tab.url)) {
        this.url = tab.url;
      }
    }
  },
  methods: {
    async claimTips() {
      const url = this.normalizedUrl;
      this.loading = true;
      await this.$watchUntilTruly(() => this.sdk && this.tippingV1);
      try {
        const claimAmount = parseFloat(
          aettosToAe(
            await this.tippingV1.methods
              .unclaimed_for_url(url)
              .then((r) => r.decodedResult)
              .catch(() => 1),
          ),
        );
        if (!claimAmount) throw new Error('NO_ZERO_AMOUNT_PAYOUT');
        await this.$store.dispatch('claimTips', { url, address: this.account.publicKey });
        await this.$store.dispatch('cacheInvalidateOracle');
        await this.$store.dispatch('cacheInvalidateTips');
        this.$store.dispatch('modals/open', { name: 'claim-success', url, claimAmount });
        this.$router.push({ name: 'account' });
      } catch (e) {
        const { error = '' } = e.response ? e.response.data : {};
        let msg;
        if (error.includes('MORE_ORACLES_NEEDED')) msg = this.$t('pages.claim.moreOracles');
        else if (error.includes('URL_NOT_EXISTING')) msg = this.$t('pages.claim.urlNotExisting');
        else if (
          error.includes('NO_ZERO_AMOUNT_PAYOUT') ||
          e.message.includes('NO_ZERO_AMOUNT_PAYOUT')
        )
          msg = this.$t('pages.claim.noZeroClaim');
        else if (error.includes('ORACLE_SEVICE_CHECK_CLAIM_FAILED'))
          msg = this.$t('pages.claim.oracleFailed');
        else if (error) msg = error;
        if (msg) this.$store.dispatch('modals/open', { name: 'default', msg });
        else {
          e.payload = { url };
          throw e;
        }
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.claim-tips .input-wrapper {
  margin: 20px 0;
}
</style>
