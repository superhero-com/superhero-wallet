<template>
  <div class="claim-tips popup">
    <Input size="m-0 sm" v-model="url" :error="!normalizedUrl" />

    <Button @click="claimTips" :disabled="!normalizedUrl">
      {{ $t('pages.tipPage.confirm') }}
    </Button>
    <Button :to="{ name: 'account' }">
      {{ $t('pages.tipPage.cancel') }}
    </Button>

    <Loader size="big" :loading="loading" type="transparent" content="" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import axios from 'axios';
import { aettosToAe, toURL, validateTipUrl } from '../../utils/helper';
import { TIP_SERVICE, BACKEND_URL } from '../../utils/constants';
import Input from '../components/Input';

export default {
  components: { Input },
  data: () => ({
    url: '',
    loading: false,
  }),
  computed: {
    ...mapGetters(['sdk', 'tipping', 'account']),
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
      await this.$watchUntilTruly(() => this.sdk && this.tipping);
      try {
        const claimAmount = parseFloat(
          aettosToAe(
            await this.tipping.methods
              .unclaimed_for_url(url)
              .then(r => r.decodedResult)
              .catch(() => 1),
          ),
        );
        if (!claimAmount) throw new Error(this.$t('pages.claim.noZeroClaim'));
        await axios
          .post(TIP_SERVICE, { url, address: this.account.publicKey })
          .catch(({ response }) => {
            const { error = 'UNKNOWN_ERROR' } = response.data;
            if (error.includes('MORE_ORACLES_NEEDED'))
              throw new Error(this.$t('pages.claim.moreOracles'));
            else if (error.includes('URL_NOT_EXISTING'))
              throw new Error(this.$t('pages.claim.urlNotExisting'));
            else if (error.includes('NO_ZERO_AMOUNT_PAYOUT'))
              throw new Error(this.$t('pages.claim.noZeroClaim'));
            else if (error.includes('ORACLE_SEVICE_CHECK_CLAIM_FAILED'))
              throw new Error(this.$t('pages.claim.oracleFailed'));
            else if (error.includes('UNKNOWN_ERROR'))
              throw new Error(this.$t('pages.claim.unknownError'));
            else throw new Error(error);
          });
        await axios.post(`${BACKEND_URL}/cache/invalidate/tips`).catch();
        await axios.post(`${BACKEND_URL}/cache/invalidate/oracle`).catch();
        this.$store.dispatch('modals/open', { name: 'claim-success', url, claimAmount });
        this.$router.push({ name: 'account' });
      } catch (e) {
        const msg = e.message.replace('Error: ', '');
        this.$store.dispatch('modals/open', { name: 'default', msg });
        e.payload = { url };
        throw e;
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
