<template>
  <div class="invite-page">
    <div class="top">
      <p class="section-title">
        <NewInviteLink class="section-title-icon" />
        {{ $t('pages.invite.generate-link') }}
      </p>
      <InputAmount
        v-model="amount"
        class="amount"
        :label="$t('pages.invite.tip-attached')"
        no-token
        ae-only
        @error="(val) => error = val"
      />
      <BtnMain
        extend
        :disabled="error"
        @click="generate"
      >
        {{ $t('pages.invite.generate') }}
      </BtnMain>
    </div>
    <div
      v-if="invites.length > 0"
      class="generated-links"
    >
      <p class="section-title">
        <Invite class="section-title-icon" />
        {{ $t('pages.invite.created-links') }}
      </p>
      <InviteItem
        v-for="link in invites"
        :key="link.secretKey"
        v-bind="link"
        @loading="(val) => (loading = val)"
      />
    </div>
    <Loader v-if="loading" />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { Crypto, AmountFormatter } from '@aeternity/aepp-sdk';
import { watchUntilTruthy } from '../utils';
import InputAmount from '../components/InputAmountV2.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import InviteItem from '../components/InviteItem.vue';
import Invite from '../../icons/invite.svg?vue-component';
import NewInviteLink from '../../icons/new-invite-link.svg?vue-component';

export default {
  components: {
    InputAmount,
    BtnMain,
    InviteItem,
    Invite,
    NewInviteLink,
  },
  data: () => ({
    amount: '',
    loading: false,
    error: false,
  }),
  computed: {
    ...mapGetters('sdkPlugin', ['sdk']),
    ...mapState('invites', ['invites']),
  },
  methods: {
    async generate() {
      this.loading = true;
      const { publicKey, secretKey } = Crypto.generateKeyPair();

      try {
        if (this.amount > 0) {
          await watchUntilTruthy(() => this.sdk);
          await this.sdk.spend(this.amount, publicKey, {
            payload: 'referral',
            denomination: AmountFormatter.AE_AMOUNT_FORMATS.AE,
          });
        }
      } catch (error) {
        if (await this.$store.dispatch('invites/handleNotEnoughFoundsError', { error })) return;
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
@use '../../styles/variables';

.invite-page {
  padding: 0 var(--screen-padding-x);
  overflow: hidden;

  .section-title {
    display: flex;
    align-items: center;
    margin: 20px 0 16px;
    font-size: 17px;
    text-align: left;
    color: variables.$color-grey-light;
    font-weight: 400;

    &-icon {
      width: 22px;
      height: 22px;
      margin-right: 7px;
    }
  }

  .amount {
    margin-bottom: 20px;
  }
}
</style>
