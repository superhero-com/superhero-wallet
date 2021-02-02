<template>
  <div class="invite-row">
    <div class="invite-info">
      <TokenAmount :amount="inviteLinkBalance" />
      <span class="date">{{ createdAt | formatDate }}</span>
    </div>
    <div class="invite-link">
      <span>{{ link }}</span>
      <div class="copied-alert" v-if="copied">{{ $t('pages.invite.copied') }}</div>
      <button class="invite-link-copy" @click="copy" v-clipboard:copy="link"><CopyIcon /></button>
    </div>
    <div class="centered-buttons" v-if="!topUp">
      <Button v-if="inviteLinkBalance > 0" bold @click="claim">{{
        $t('pages.invite.claim')
      }}</Button>
      <Button v-else bold dark @click="deleteItem">{{ $t('pages.invite.delete') }}</Button>
      <Button bold @click="topUp = true">{{ $t('pages.invite.top-up') }}</Button>
    </div>
    <template v-else>
      <AmountSend v-model="topUpAmount" :label="$t('pages.invite.top-up-with')" />
      <div class="centered-buttons">
        <Button bold dark @click="resetTopUpChanges">{{ $t('pages.invite.collapse') }}</Button>
        <Button bold :disabled="!sufficientBalance" @click="sendTopUp">{{
          $t('pages.invite.top-up')
        }}</Button>
      </div>
    </template>
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapState } from 'vuex';
import { AmountFormatter, Crypto } from '@aeternity/aepp-sdk/es';
import TokenAmount from './TokenAmount';
import AmountSend from './AmountSend';
import Button from './Button';
import CopyIcon from '../../../icons/copy.svg?vue-component';
import { formatDate } from '../../utils';

export default {
  props: {
    secretKey: { type: String, required: true },
    createdAt: { type: Number, required: true },
  },
  components: { TokenAmount, Button, AmountSend, CopyIcon },
  filters: { formatDate },
  data: () => ({ topUp: false, topUpAmount: 0, inviteLinkBalance: 0, copied: false }),
  subscriptions() {
    return pick(this.$store.state.observables, ['balance']);
  },
  computed: {
    ...mapState(['sdk']),
    link() {
      const secretKey = Crypto.encodeBase58Check(Buffer.from(this.secretKey, 'hex'));
      return new URL(
        this.$router
          .resolve({ name: 'invite-claim', params: { secretKey } })
          .href.replace(/^#/, ''),
        'https://wallet.superhero.com',
      );
    },
    address() {
      return Crypto.getAddressFromPriv(this.secretKey);
    },
    sufficientBalance() {
      return this.balance.comparedTo(this.topUpAmount) !== -1;
    },
  },
  watch: {
    secretKey: {
      async handler() {
        await this.updateBalance();
      },
      immediate: true,
    },
  },
  methods: {
    copy() {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 3000);
    },
    deleteItem() {
      this.$store.commit('invites/delete', this.secretKey);
    },
    async updateBalance() {
      await this.$watchUntilTruly(() => this.sdk);
      this.inviteLinkBalance = parseFloat(
        await this.sdk
          .balance(this.address, { format: AmountFormatter.AE_AMOUNT_FORMATS.AE })
          .catch(() => 0),
      );
    },
    async claim() {
      this.$emit('loading', true);
      try {
        await this.$store.dispatch('invites/claim', this.secretKey);
        await this.updateBalance();
      } catch (error) {
        if (await this.$store.dispatch('invites/handleNotEnoughFoundsError', error)) return;
        throw error;
      } finally {
        this.$emit('loading', false);
      }
    },
    resetTopUpChanges() {
      this.topUpAmount = 0;
      this.topUp = false;
    },
    async sendTopUp() {
      this.$emit('loading', true);
      try {
        if (this.topUpAmount > 0) {
          await this.sdk.spend(this.topUpAmount, this.address, {
            payload: 'referral',
            denomination: AmountFormatter.AE_AMOUNT_FORMATS.AE,
          });
          await this.updateBalance();
        }
      } catch (error) {
        if (await this.$store.dispatch('invites/handleNotEnoughFoundsError', error)) return;
        throw error;
      } finally {
        this.$emit('loading', false);
      }
      this.resetTopUpChanges();
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.invite-row {
  padding: 1rem;
  width: 100%;
  border-bottom: 2px solid $black-1;
  text-align: left;
  color: $text-color;
  position: relative;

  .invite-link {
    margin-bottom: 5px;
    font-size: 11px;
    display: flex;

    span {
      margin-left: 5px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      color: $white-1;
    }
  }

  .invite-link-copy {
    padding: 0;
    color: $gray-2;
  }

  .invite-info {
    font-size: 13px;
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    color: $gray-2;

    .token-amount {
      flex-grow: 1;
    }

    .date {
      font-size: 11px;
      color: $text-color;
    }
  }

  .amount-send-container {
    margin: 0;
  }

  .centered-buttons {
    display: flex;

    > .primary-button {
      margin-right: 20px;
      width: 120px;
    }
  }

  .copied-alert {
    color: $button-color;
    margin-right: 7px;
  }
}
</style>
