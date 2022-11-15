<template>
  <div class="invite-row">
    <div class="invite-info">
      <TokenAmount :amount="inviteLinkBalance" />
      <span class="date">{{ formatDate(createdAt) }}</span>
    </div>
    <CopyText
      class="invite-link"
      :value="link.toString()"
    >
      <span class="invite-link-url">{{ link }}</span>
    </CopyText>
    <div
      v-if="!topUp"
      class="centered-buttons"
    >
      <BtnMain
        v-if="inviteLinkBalance > 0"
        class="button"
        @click="claim"
      >
        {{ $t('pages.invite.claim') }}
      </BtnMain>
      <BtnMain
        v-else
        class="button"
        variant="secondary"
        @click="deleteItem"
      >
        {{ $t('pages.invite.delete') }}
      </BtnMain>
      <BtnMain
        class="button"
        @click="topUp = true"
      >
        {{ $t('pages.invite.top-up') }}
      </BtnMain>
    </div>
    <template v-else>
      <InputAmount
        v-model="topUpAmount"
        class="input-amount"
        :label="$t('pages.invite.top-up-with')"
        no-token
        @error="(val) => error = val"
      />
      <div class="centered-buttons">
        <BtnMain
          variant="secondary"
          @click="resetTopUpChanges"
        >
          {{ $t('pages.invite.collapse') }}
        </BtnMain>
        <BtnMain
          :disabled="error"
          @click="sendTopUp"
        >
          {{ $t('pages.invite.top-up') }}
        </BtnMain>
      </div>
    </template>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { AmountFormatter, TxBuilderHelper, Crypto } from '@aeternity/aepp-sdk';
import { APP_LINK_WEB, watchUntilTruthy, formatDate } from '../utils';
import TokenAmount from './TokenAmount.vue';
import InputAmount from './InputAmount.vue';
import BtnMain from './buttons/BtnMain.vue';
import CopyText from './CopyText.vue';

export default {
  components: {
    TokenAmount,
    BtnMain,
    InputAmount,
    CopyText,
  },
  props: {
    secretKey: { type: String, required: true },
    createdAt: { type: Number, required: true },
  },
  data: () => ({
    topUp: false,
    topUpAmount: '',
    inviteLinkBalance: 0,
    error: false,
  }),
  computed: {
    ...mapState(['sdk']),
    link() {
      // sg_ prefix was chosen as a dummy to decode from base58Check
      const secretKey = (TxBuilderHelper.encode(Buffer.from(this.secretKey, 'hex'), 'sg')).slice(3);
      return new URL(
        this.$router
          .resolve({ name: 'invite-claim', params: { secretKey } })
          .href.replace(/^#/, ''),
        APP_LINK_WEB,
      );
    },
    address() {
      return Crypto.getAddressFromPriv(this.secretKey);
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
    formatDate,
    deleteItem() {
      this.$store.commit('invites/delete', this.secretKey);
    },
    async updateBalance() {
      await watchUntilTruthy(() => this.sdk);
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
        if (await this.$store.dispatch('invites/handleNotEnoughFoundsError', { error, isInviteError: true })) return;
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
        if (await this.$store.dispatch('invites/handleNotEnoughFoundsError', { error })) return;
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
@use '../../styles/variables';

.invite-row {
  padding: 1rem var(--screen-padding-x);
  margin: -2px calc(-1 * var(--screen-padding-x)) 0;
  border-style: solid;
  border-color: variables.$color-border;
  border-width: 2px 0;
  text-align: left;
  color: variables.$color-white;
  position: relative;

  .invite-link {
    width: 100%;
    margin-bottom: 5px;
    padding-block: 4px;

    &-url {
      display: block;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      font-size: 11px;
      color: variables.$color-white;
    }
  }

  .invite-info {
    font-size: 13px;
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    color: variables.$color-grey-dark;

    .token-amount {
      flex-grow: 1;
    }

    .date {
      font-size: 11px;
      color: variables.$color-white;
    }
  }

  .input-amount {
    margin-bottom: var(--gap);
  }

  .centered-buttons {
    display: flex;
    gap: var(--gap);
  }
}
</style>
