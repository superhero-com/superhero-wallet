<template>
  <div class="popup">
    <p class="section-title">
      {{ $t('pages.invite.generate-link') }}
    </p>
    <AmountSend @changeAmount="val => (amount = val)" :value="amount" />
    <Button @click="generate" extend>{{ $t('pages.invite.generate') }}</Button>
    <p class="section-title">
      {{ $t('pages.invite.created-links') }}
    </p>
    <ReferralItem
      v-for="(referral, idx) in referrals"
      :key="referral.link"
      :referral="{ ...referral, idx }"
      @loading="val => (loading = val)"
    />
    <Loader v-if="loading" />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { Crypto } from '@aeternity/aepp-sdk/es';
import { AE_AMOUNT_FORMATS } from '@aeternity/aepp-sdk/es/utils/amount-formatter';
import AmountSend from '../components/AmountSend';
import ReferralItem from '../components/ReferralItem';

export default {
  components: { AmountSend, ReferralItem },
  data: () => ({ amount: 0, loading: false }),
  computed: {
    ...mapState(['sdk']),
    ...mapState('invites', ['referrals']),
  },
  async created() {
    await this.$watchUntilTruly(() => this.sdk);
    this.$store.dispatch('invites/getBalances');
  },
  methods: {
    async generate() {
      this.loading = true;
      await this.$watchUntilTruly(() => this.sdk);
      const { publicKey, secretKey } = Crypto.generateKeyPair();
      if (this.amount) {
        try {
          await this.sdk.spend(this.amount, publicKey, {
            payload: 'referral',
            denomination: AE_AMOUNT_FORMATS.AE,
          });
        } catch (e) {
          this.$store.dispatch('modals/open', { name: 'default', msg: e.message });
          this.loading = false;
          return;
        }
      }
      const link = `https://superhero.com/i/${Crypto.encodeBase58Check(
        Buffer.from(secretKey, 'hex'),
      )}`;

      this.$store.commit('invites/add', {
        link,
        publicKey,
        secretKey,
        balance: 0,
        date: Date.now(),
      });
      this.loading = false;
      this.$store.dispatch('invites/getBalances');
    },
  },
};
</script>

<style lang="scss" scoped>
.section-title {
  font-size: 16px;
  text-align: left;
  margin-bottom: 0;
}
</style>
