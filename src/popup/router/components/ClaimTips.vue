<template>
  <BoxButton :text="$t('pages.account.claim')" accent @handleClick="claimTips">
    <Claim slot="icon" />
  </BoxButton>
</template>

<script>
import { mapGetters } from 'vuex';
import axios from 'axios';
import { aettosToAe } from '../../utils/helper';
import { TIP_SERVICE } from '../../utils/constants';
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
      const { addresses, tab } = await this.$store.dispatch('getWebPageAddresses');
      try {
        if (!addresses || !addresses.includes(this.account.publicKey)) throw new Error(this.$t('pages.claim.noAddress'));
        const claimAmount = parseFloat(
          aettosToAe(
            await this.tipping.methods
              .unclaimed_for_url(tab.url)
              .then(r => r.decodedResult)
              .catch(() => 0)
          )
        );
        if (!claimAmount) throw new Error(this.$t('pages.claim.noZeroClaim'));
        await axios.post(`${TIP_SERVICE}`, { url: tab.url, address: this.account.publicKey }).catch(() => {
          throw new Error(this.$t('pages.claim.errorClaim'));
        });
        this.$emit('setLoading', false);
        this.$store.dispatch('popupAlert', { name: 'tipping', type: 'claim_success', msg: `${claimAmount} ${this.$t('pages.claim.claimed')}` });
      } catch (e) {
        this.$emit('setLoading', false);
        this.$store.dispatch('popupAlert', { name: 'tipping', type: 'claim_error', msg: e.message });
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
