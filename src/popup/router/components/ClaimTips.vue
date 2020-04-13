<template>
  <BoxButton :text="$t('pages.account.claim')" accent @handleClick="claimTips" class="tour__step4">
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
          .catch(() => {
            throw new Error(this.$t('pages.claim.errorClaim'));
          });
        this.$emit('setLoading', false);
        this.$store.dispatch('modals/open', { name: 'claim-success', url: tab.url, claimAmount });
      } catch (e) {
        this.$emit('setLoading', false);
        this.$store.dispatch('modals/open', { name: 'default', msg: e.message });
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
