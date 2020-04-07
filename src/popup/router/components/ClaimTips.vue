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
              .catch(() => 0)
          )
        );
        if (!claimAmount) throw new Error(this.$t('pages.claim.noZeroClaim'));
        await axios.post(`${TIP_SERVICE}`, { url: tab.url, address: this.account.publicKey }).catch(() => {
          throw new Error(this.$t('pages.claim.errorClaim'));
        });
        this.$emit('setLoading', false);
        this.$store.dispatch('popupAlert', {
          name: 'tipping',
          type: 'claim_success',
          msg: `<svg id="Icon_Shield_Fill" data-name="Icon/Shield Fill" xmlns="http://www.w3.org/2000/svg" width="35.435" height="28.35" viewBox="0 0 35.435 28.35">
                  <path id="Shield_Fill" data-name="Shield Fill" d="M17.717,28.35a1.247,1.247,0,0,1-.889-.371L.374,11.477A1.306,1.306,0,0,1,.151,9.953L5.1.672A1.262,1.262,0,0,1,6.213,0H29.222a1.262,1.262,0,0,1,1.112.672l4.95,9.281a1.306,1.306,0,0,1-.223,1.524l-16.455,16.5A1.247,1.247,0,0,1,17.717,28.35Zm-.534-13.125h0a.368.368,0,0,1,.364.369.392.392,0,0,1,0,.046l-.858,7.181a.369.369,0,0,0,.319.411l.044,0a.36.36,0,0,0,.3-.166l7.432-11.433a.374.374,0,0,0-.1-.513.355.355,0,0,0-.2-.06l-5.889.014a.369.369,0,0,1-.365-.369.385.385,0,0,1,0-.056L19.283,3.54a.371.371,0,0,0-.307-.421.361.361,0,0,0-.352.153L10.711,14.664a.374.374,0,0,0,.088.516.358.358,0,0,0,.211.068Z" transform="translate(0 0)" fill="#2a9cff"/>
                </svg> <br>
                <b>${this.$t('pages.claim.url')}:</b> ${tab.url} <br>
                <b>${this.$t('pages.claim.tipsOnUrl')}:</b> ${claimAmount} ${this.$t('pages.claim.ae')} <br>
                <span style="color: #2a9cff;">${this.$t('pages.claim.claimed')}</span>`,
        });
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
