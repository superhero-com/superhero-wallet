<template>
  <div class="popup">
    <p class="section-title">
      {{ $t('pages.invite.generate-link') }}
    </p>
    <AmountSend v-model="amount" />
    <Button @click="generate" extend>{{ $t('pages.invite.generate') }}</Button>
    <p class="section-title">
      {{ $t('pages.invite.created-links') }}
    </p>
    <InviteItem
      v-for="(l, idx) in links"
      :key="l.link"
      :invite="{ ...l, idx }"
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
import InviteItem from '../components/InviteItem';

export default {
  components: { AmountSend, InviteItem },
  data: () => ({ amount: 0, loading: false }),
  computed: {
    ...mapState(['sdk']),
    ...mapState('invites', ['links']),
  },
  async created() {
    await this.$watchUntilTruly(() => this.sdk);
    this.$store.dispatch('invites/updateBalances');
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
          if (e.message.includes('is not enough to execute')) {
            this.$store.dispatch('modals/open', {
              name: 'default',
              msg: this.$t('pages.invite.insufficient-balance'),
            });
            return;
          }
          throw e;
        } finally {
          this.loading = false;
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
      this.$store.dispatch('invites/updateBalances');
      this.amount = 0;
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
