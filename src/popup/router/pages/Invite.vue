<template>
  <div class="invite">
    <div class="top">
      <p class="section-title">
        <NewInviteLink class="invite-icon" />
        {{ $t('pages.invite.generate-link') }}
      </p>
      <AmountSend
        v-model="amount"
        native-token
        :label="$t('pages.invite.tip-attached')"
      />
      <Button
        bold
        :disabled="!sufficientBalance"
        @click="generate"
      >
        {{
          $t('pages.invite.generate')
        }}
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
import { pick } from 'lodash-es';
import { mapState } from 'vuex';
import { Crypto } from '@aeternity/aepp-sdk/es';
import { AE_AMOUNT_FORMATS } from '@aeternity/aepp-sdk/es/utils/amount-formatter';
import AmountSend from '../components/AmountSend';
import Button from '../components/Button';
import InviteItem from '../components/InviteItem';
import Invite from '../../../icons/invite.svg?vue-component';
import NewInviteLink from '../../../icons/new-invite-link.svg?vue-component';

export default {
  components: {
    AmountSend, Button, InviteItem, Invite, NewInviteLink,
  },
  data: () => ({ amount: 0, loading: false }),
  subscriptions() {
    return pick(this.$store.state.observables, ['balance']);
  },
  computed: {
    ...mapState(['sdk']),
    ...mapState('invites', ['invites']),
    sufficientBalance() {
      return this.balance.comparedTo(this.amount) !== -1;
    },
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
@import '../../../styles/variables';

.invite {
  .top {
    margin: 0 -20px;
    padding: 20px;
    background-color: $color-black;
  }

  .section-title {
    font-size: 17px;
    text-align: left;
    margin-top: 0;
    margin-bottom: 0;
    color: $color-light-grey;
    font-weight: 400;
  }

  .invite-icon {
    vertical-align: sub;
    margin-right: 7px;
  }

  .amount-send-container {
    margin: 10px 0 0 0;
  }

  .generated-links {
    background-color: $color-bg-3;
    margin: 0 -20px;

    .section-title {
      padding: 15px 20px;
      border-bottom: 2px solid $color-border;
    }
  }
}
</style>
