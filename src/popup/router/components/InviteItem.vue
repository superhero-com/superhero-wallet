<template>
  <div class="invite-row">
    <div class="invite-info">
      <TokenAmount :amount="inviteLinkBalance" />
      <span class="date">{{ createdAt | formatDate }}</span>
    </div>
    <div class="invite-link">
      <span>{{ link }}</span>
      <div
        v-if="copied"
        class="copied-alert"
      >
        {{ $t('copied') }}
      </div>
      <ButtonPlain
        v-clipboard:success="copy"
        v-clipboard:copy="link"
        class="invite-link-copy"
      >
        <CopyIcon />
      </ButtonPlain>
    </div>
    <div
      v-if="!topUp"
      class="centered-buttons"
    >
      <Button
        v-if="inviteLinkBalance > 0"
        bold
        @click="claim"
      >
        {{
          $t('pages.invite.claim')
        }}
      </Button>
      <Button
        v-else
        bold
        fill="secondary"
        @click="deleteItem"
      >
        {{ $t('pages.invite.delete') }}
      </Button>
      <Button
        bold
        @click="topUp = true"
      >
        {{ $t('pages.invite.top-up') }}
      </Button>
    </div>
    <template v-else>
      <InputAmount
        v-model="topUpAmount"
        :label="$t('pages.invite.top-up-with')"
      />
      <div class="centered-buttons">
        <Button
          bold
          fill="secondary"
          @click="resetTopUpChanges"
        >
          {{ $t('pages.invite.collapse') }}
        </Button>
        <Button
          bold
          :disabled="!sufficientBalance"
          @click="sendTopUp"
        >
          {{
            $t('pages.invite.top-up')
          }}
        </Button>
      </div>
    </template>
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapState } from 'vuex';
import { AmountFormatter, Crypto } from '@aeternity/aepp-sdk';
import CopyMixin from '../../../mixins/copy';
import TokenAmount from './TokenAmount.vue';
import InputAmount from './InputAmount.vue';
import Button from './Button.vue';
import ButtonPlain from './ButtonPlain.vue';
import CopyIcon from '../../../icons/copy-old.svg?vue-component';
import { formatDate } from '../../utils';
import { APP_LINK_WEB } from '../../utils/constants';

export default {
  components: {
    TokenAmount, Button, ButtonPlain, InputAmount, CopyIcon,
  },
  filters: { formatDate },
  mixins: [CopyMixin],
  props: {
    secretKey: { type: String, required: true },
    createdAt: { type: Number, required: true },
  },
  data: () => ({
    topUp: false, topUpAmount: 0, inviteLinkBalance: 0,
  }),
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
        APP_LINK_WEB,
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
@use '../../../styles/variables';

.invite-row {
  padding: 1rem;
  width: 100%;
  border-bottom: 2px solid variables.$color-border;
  text-align: left;
  color: variables.$color-white;
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
      color: variables.$color-white;
    }
  }

  .invite-link-copy {
    color: variables.$color-dark-grey;
  }

  .invite-info {
    font-size: 13px;
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    color: variables.$color-dark-grey;

    .token-amount {
      flex-grow: 1;
    }

    .date {
      font-size: 11px;
      color: variables.$color-white;
    }
  }

  .input-amount {
    margin: 0;
  }

  .centered-buttons {
    display: flex;

    > .button {
      margin-right: 20px;
      width: 120px;
    }
  }

  .copied-alert {
    color: variables.$color-blue;
    margin-right: 7px;
  }
}
</style>
