<template>
  <div
    class="account-card"
    :style="cardCssProps"
    @click.prevent="$store.dispatch('modals/open', {
      ...$attrs,
      name: MODAL_ACCOUNT_DETAILS,
    })"
  >
    <AccountInfo
      v-bind="$attrs"
      :color="color"
      @click.native.stop
    />
    <BalanceInfo v-bind="$attrs" />
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
        <a @click.stop="openTransferReceiveModal($attrs)">
          <ReceiveIcon :style="iconCssProps" />
        </a>
        <RouterLink :to="{ name: 'transfer-send' }">
          <SendIcon :style="iconCssProps" />
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import AccountInfo from './AccountInfo.vue';
import BalanceInfo from './BalanceInfo.vue';
import ReceiveIcon from '../../../icons/account-card/account-receive.svg?vue-component';
import SendIcon from '../../../icons/account-card/account-send.svg?vue-component';
import { getAddressColor } from '../../utils/avatar';
import { MODAL_ACCOUNT_DETAILS, MODAL_TRANSFER_RECEIVE } from '../../utils/constants';

export default {
  components: {
    AccountInfo,
    BalanceInfo,
    SendIcon,
    ReceiveIcon,
  },
  props: {
    idx: { type: Number, required: true },
  },
  data: () => ({
    MODAL_ACCOUNT_DETAILS,
  }),
  computed: {
    ...mapGetters('fungibleTokens', ['getTokenBalance']),
    ...mapGetters(['accounts']),
    cardCssProps() {
      return { 'background-color': this.color };
    },
    totalTokens() {
      return this.getTokenBalance(this.accounts[this.idx].address).length;
    },
    color() {
      return getAddressColor(this.accounts[this.idx].address);
    },
    iconCssProps() {
      return {
        '--primaryColor': this.color,
      };
    },
  },
  methods: {
    openTransferReceiveModal(attrs) {
      this.$store.dispatch('modals/open', {
        ...attrs,
        name: MODAL_TRANSFER_RECEIVE,
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

      a {
        margin-left: 8px;
        color: rgba(variables.$color-white, 0.8);

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
