<template>
  <BoxButton :text="$t('pages.account.claim')" accent @handleClick="claimTips" class="tour__step4">
    <Claim slot="icon" />
  </BoxButton>
</template>

<script>
import { mapGetters } from 'vuex';
import axios from 'axios';
import { aettosToAe } from '../../utils/helper';
import { TIP_SERVICE, BACKEND_URL } from '../../utils/constants';
import BoxButton from './BoxButton';
import Claim from '../../../icons/claim-icon.svg?vue-component';

export default {
  components: {
    Claim,
    BoxButton,
  },
  computed: mapGetters(['sdk', 'tipping', 'account', 'popup']),
  methods: {
    async claimTips() {
      this.$emit('setLoading', true);
      await this.$watchUntilTruly(() => this.sdk);
      await this.$watchUntilTruly(() => this.tipping);
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      try {
        const claimAmount = parseFloat(
          aettosToAe(
            await this.tipping.methods
              .unclaimed_for_url(tab.url)
              .then(r => r.decodedResult)
              .catch(() => 0),
          ),
        );
        if (!claimAmount) throw new Error(this.$t('pages.claim.noZeroClaim'));
        await axios
          .post(`${TIP_SERVICE}`, { url: tab.url, address: this.account.publicKey })
          .catch(({ response }) => {
            const { error } = response.data;
            if (error.includes('MORE_ORACLES_NEEDED'))
              throw new Error(this.$t('pages.claim.moreOracles'));
            else if (error.includes('URL_NOT_EXISTING'))
              throw new Error(this.$t('pages.claim.urlNotExisting'));
            else if (error.includes('NO_ZERO_AMOUNT_PAYOUT'))
              throw new Error(this.$t('pages.claim.noZeroClaim'));
            else if (error.includes('ORACLE_SEVICE_CHECK_CLAIM_FAILED'))
              throw new Error(this.$t('pages.claim.oracleFailed'));
            else throw new Error(error);
          });
        await axios.post(`${BACKEND_URL}/cache/invalidate/tip`).catch();
        await axios.post(`${BACKEND_URL}/cache/invalidate/oracle`).catch();
        this.$emit('setLoading', false);
        this.$store.dispatch('modals/open', { name: 'claim-success', url: tab.url, claimAmount });
      } catch (e) {
        const msg = e.message.replace('Error: ', '');
        this.$emit('setLoading', false);
        this.$store.dispatch('modals/open', { name: 'default', msg });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.claim-tips {
  margin-top: 26px;
}
</style>
