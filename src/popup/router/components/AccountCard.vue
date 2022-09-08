<template>
  <RouterLink
    class="account-card"
    :style="cardCssProps"
    :to="{ name: 'account-details' }"
  >
    <AccountInfo
      :account-idx="accountIdx"
      :color="color"
    />

    <BalanceInfo :account-idx="accountIdx" />
    <div class="misc">
      <div class="total-tokens">
        <span class="digit">
          {{ totalTokens }}
        </span>
        <span class="wording">
          {{ $t('pages.fungible-tokens.tokens') }}
        </span>
      </div>
      <div class="buttons">
        <button
          class="buttons-button"
          @click.prevent="openTransferReceiveModal()"
        >
          <ReceiveIcon :style="iconCssProps" />
        </button>
        <button
          class="buttons-button"
          @click.prevent="openTransferSendModal()"
        >
          <SendIcon :style="iconCssProps" />
        </button>
      </div>
    </div>
  </RouterLink>
</template>

<script>
import { mapGetters } from 'vuex';
import AccountInfo from './AccountInfo.vue';
import BalanceInfo from './BalanceInfo.vue';
import ReceiveIcon from '../../../icons/account-card/account-receive.svg?vue-component';
import SendIcon from '../../../icons/account-card/account-send.svg?vue-component';
import { getAddressColor } from '../../utils/avatar';
import {
  MODAL_TRANSFER_RECEIVE,
  MODAL_TRANSFER_SEND,
} from '../../utils/constants';

export default {
  components: {
    AccountInfo,
    BalanceInfo,
    SendIcon,
    ReceiveIcon,
  },
  props: {
    accountIdx: { type: Number, required: true },
  },
  computed: {
    ...mapGetters('fungibleTokens', ['getTokenBalance']),
    ...mapGetters(['accounts']),
    cardCssProps() {
      return { 'background-color': this.color };
    },
    totalTokens() {
      return this.getTokenBalance(this.accounts[this.accountIdx].address).length;
    },
    color() {
      return getAddressColor(this.accounts[this.accountIdx].address);
    },
    iconCssProps() {
      return {
        '--primaryColor': this.color,
      };
    },
  },
  methods: {
    openTransferReceiveModal() {
      this.$store.dispatch('modals/open', {
        name: MODAL_TRANSFER_RECEIVE,
      });
    },
    openTransferSendModal() {
      this.$store.dispatch('modals/open', {
        name: MODAL_TRANSFER_SEND,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.account-card {
  display: flex;
  flex-direction: column;
  width: 328px;
  height: 192px;
  border-radius: 16px;
  margin: 8px 16px 32px 16px;
  padding: 12px;
  align-items: flex-start;
  text-decoration: none;
  color: inherit;
  cursor: pointer;

  .balance-info {
    margin-top: 12px;
    align-self: center;
  }

  .misc {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    flex: 1;

    .total-tokens {
      @extend %face-sans-14-medium;

      line-height: 16px;

      .wording {
        opacity: 0.85;
      }
    }

    .buttons {
      display: flex;
      gap: 8px;

      &-button {
        margin: 0;
        padding: 0;
        color: rgba(variables.$color-white, 0.8);
        cursor: pointer;

        &:hover {
          color: rgba(variables.$color-white, 1);
        }

        svg {
          height: 36px;
          width: 36px;
        }
      }
    }
  }
}
</style>
