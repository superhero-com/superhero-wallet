<template>
  <div>
    <Button data-cy="tip-button" class="claim-tips" @click="claimTips">
      <div class="flex flex-align-center flex-justify-content-center">
        <Claim />
        <span class="ml-5">{{ $t('pages.claim.claim') }}</span>
      </div>
    </Button>
    <popup />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { uniq } from 'lodash-es';
import axios from 'axios';
import { postMessageToContent } from '../../utils/connection';
import { getAddressByNameEntry, aettosToAe } from '../../utils/helper';
import { TIP_SERVICE } from '../../utils/constants';
import Button from './Button';
import Claim from '../../../icons/claim.svg?vue-component';

export default {
  components: {
    Button,
    Claim,
  },
  computed: mapGetters(['sdk', 'tipping', 'account', 'popup']),
  methods: {
    async claimTips() {
      this.$emit('setLoading', true);
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      const { address, chainName } = await postMessageToContent({ method: 'getAddresses' }, tab.id);
      let addresses = Array.isArray(address) ? address : [address];
      const chainNames = Array.isArray(chainName) ? chainName : [chainName];
      const chainNamesAddresses = await Promise.all(
        chainNames.map(async n => {
          try {
            return getAddressByNameEntry(await this.sdk.api.getNameEntryByName(n));
          } catch (e) {
            return null;
          }
        })
      );
      addresses = [...addresses, ...chainNamesAddresses];
      try {
        if (!uniq(addresses).includes(this.account.publicKey)) throw new Error(this.$t('pages.claim.noAddress'));
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
