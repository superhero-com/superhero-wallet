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
      v-for="(link, idx) in invites"
      :key="link.secretKey"
      v-bind="{ ...link, idx }"
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
    ...mapState('invites', ['invites']),
  },
  methods: {
    async generate() {
      this.loading = true;
      const { publicKey, secretKey } = Crypto.generateKeyPair();

      try {
        if (this.amount > 0) {
          await this.$watchUntilTruly(() => this.sdk);
          await this.sdk.spend(this.amount, publicKey, {
            payload: 'referral',
            denomination: AE_AMOUNT_FORMATS.AE,
          });
        }
      } catch (error) {
        if (await this.$store.dispatch('invites/handleNotEnoughFoundsError', error)) return;
        throw error;
      } finally {
        this.loading = false;
      }

      this.$store.commit('invites/add', secretKey);
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
