<template>
  <div class="invite">
    <div class="top">
      <p class="section-title">
        <NewInviteLink class="invite-icon" />
        {{ $t('pages.invite.generate-link') }}
      </p>
      <InputAmount
        v-model="amount"
        :label="$t('pages.invite.tip-attached')"
        no-token
        @error="(val) => error = val"
      />
      <Button
        bold
        :disabled="error"
        @click="generate"
      >
        {{ $t('pages.invite.generate') }}
      </Button>
    </div>
    <div
      v-if="invites.length > 0"
      class="generated-links"
    >
      <p class="section-title">
        <Invite class="invite-icon" />
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
import { mapState } from 'vuex';
import { Crypto, AmountFormatter } from '@aeternity/aepp-sdk';
import InputAmount from '../components/InputAmount.vue';
import Button from '../components/Button.vue';
import InviteItem from '../components/InviteItem.vue';
import Invite from '../../../icons/invite.svg?vue-component';
import NewInviteLink from '../../../icons/new-invite-link.svg?vue-component';

export default {
  components: {
    InputAmount, Button, InviteItem, Invite, NewInviteLink,
  },
  data: () => ({ amount: '', loading: false, error: false }),
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
@use '../../../styles/variables';

.invite {
  padding: 16px;

  .top {
    margin: 0 -20px;
    padding: 20px;
  }

  .section-title {
    font-size: 17px;
    text-align: left;
    margin-top: 0;
    margin-bottom: 0;
    color: variables.$color-light-grey;
    font-weight: 400;
  }

  .invite-icon {
    vertical-align: sub;
    margin-right: 7px;
  }

  .input-amount {
    margin: 10px 0 0 0;
  }

  .button {
    width: 100%;
  }

  .generated-links {
    background-color: variables.$color-bg-3;
    margin: 0 -20px;

    .section-title {
      padding: 15px 20px;
      border-bottom: 2px solid variables.$color-border;

      .invite-icon {
        width: 21px;
        height: 21px;
      }
    }
  }
}
</style>
