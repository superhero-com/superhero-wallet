<template>
  <div class="token-details">
    <Plate class="token-header">
      <div class="token-profile">
        <TokenAmount
          :amount="+tokenData.convertedBalance || 0"
          :symbol="tokenData.symbol"
          :aex9="id !== 'aeternity'"
        />
      </div>
      <div class="token-actions">
        <BoxButton
          @click.native="proceed({ name: 'transfer-send' })"
        >
          <SendIcon />{{ $t('pages.token-details.send') }}
        </BoxButton>
        <BoxButton
          @click.native="proceed({ name: 'transfer-receive' })"
        >
          <ReceiveIcon />{{ $t('pages.token-details.receive') }}
        </BoxButton>
        <BoxButton
          v-if="id === 'aeternity'"
          fill="alternative"
          @click.native="proceed({ name: 'buy' })"
        >
          <BuyIcon />{{ $t('pages.fungible-tokens.buyAe') }}
        </BoxButton>
      </div>
      <div
        slot="bottom"
        class="token-tabs"
      >
        <div
          :class="{ selected: activeTab === 'details' }"
          @click="activeTab = 'details'"
        >
          <Warning />
          {{ $t('pages.token-details.details') }}
        </div>
        <div
          :class="{ selected: activeTab === 'transactions' }"
          @click="activeTab = 'transactions'"
        >
          <TxHistory />
          {{ $t('pages.transactionDetails.transactions') }}
        </div>
      </div>
    </Plate>
    <div
      v-if="activeTab === 'details'"
      class="token-info"
    >
      <DetailsRow
        :label="$t('pages.token-details.abbreviation')"
        :text="tokenData.symbol"
      />
      <DetailsRow
        :label="$t('pages.token-details.decimals')"
        :text="tokenData.decimals"
      />
      <DetailsRow
        v-if="tokenData.contract"
        :class="{ contract: tokenData.contract }"
        :label="$t('pages.token-details.contract')"
        :text="tokenData.contract"
      />
      <DetailsRow
        :label="$t('pages.token-details.available-supply')"
        :text="tokenData.circulating_supply"
      />
      <DetailsRow
        :label="$t('pages.token-details.total-supply')"
        :text="tokenData.total_supply"
      />
      <DetailsRow
        :label="$t('pages.token-details.max-supply')"
        :text="tokenData.max_supply"
      />
      <DetailsRow :label="$t('pages.token-details.price-ae')" />
      <DetailsRow
        :label="$t('pages.token-details.price')"
        :text="tokenData.current_price ? formatCurrency(tokenData.current_price) : ''"
      />
      <DetailsRow
        :label="$t('pages.token-details.volume')"
        :text="tokenData.total_volume"
      />
      <DetailsRow
        :label="$t('pages.token-details.market-cap')"
        :text="tokenData.market_cap"
      />
      <DetailsRow
        :label="$t('pages.token-details.ath-change')"
        :text="tokenData.ath"
      />
      <DetailsRow
        :label="$t('pages.token-details.atl-change')"
        :text="tokenData.atl"
      />
      <DetailsRow :label="$t('pages.token-details.chart')" />
    </div>
    <TransactionList
      v-else
      :token="id"
    />
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapGetters, mapState } from 'vuex';
import Plate from '../../components/Plate.vue';
import SendIcon from '../../../../icons/send.svg?vue-component';
import ReceiveIcon from '../../../../icons/receive.svg?vue-component';
import BuyIcon from '../../../../icons/buy.svg?vue-component';
import Warning from '../../../../icons/warning.svg?vue-component';
import TxHistory from '../../../../icons/history.svg?vue-component';
import BoxButton from '../../components/BoxButton.vue';
import TokenAmount from '../../components/TokenAmount.vue';
import DetailsRow from '../../components/FungibleTokens/DetailsRow.vue';
import TransactionList from '../../components/TransactionList.vue';

export default {
  components: {
    Plate,
    SendIcon,
    ReceiveIcon,
    BuyIcon,
    Warning,
    TxHistory,
    TokenAmount,
    BoxButton,
    DetailsRow,
    TransactionList,
  },
  props: {
    id: { type: String, required: true },
  },
  data() {
    return {
      activeTab: 'details',
    };
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['tokenBalance', 'balanceCurrency']);
  },
  computed: {
    ...mapGetters(['formatCurrency', 'accounts']),
    ...mapState('accounts', ['activeIdx']),
    ...mapState('fungibleTokens', ['aePublicData', 'availableTokens']),
    ...mapGetters('fungibleTokens', ['tokenBalances']),
    fungibleToken() {
      return this.availableTokens[this.id];
    },
    tokenData() {
      if (this.id === 'aeternity') {
        return {
          ...this.aePublicData,
          symbol: 'AE',
          convertedBalance: this.tokenBalance,
          balanceCurrency: this.balanceCurrency,
          contract: '',
        };
      }
      return (
        this.tokenBalances.find(({ contract }) => contract === this.id) || {
          ...this.fungibleToken,
          contract: this.id,
        }
      );
    },
  },
  mounted() {
    this.$store.commit('setPageTitle', this.fungibleToken ? this.fungibleToken.name : 'Aeternity');
  },
  destroyed() {
    this.$store.commit('setPageTitle', '');
  },
  methods: {
    proceed(path) {
      this.$store.commit('fungibleTokens/setSelectedToken', {
        address: this.accounts[this.activeIdx].address,
        token: this.id !== 'aeternity' ? this.tokenBalances.find(({ value }) => value === this.id) : null,
      });
      this.$router.push(path);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';
@use '../../../../styles/typography';

.token-details {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  .transaction-list {
    flex-grow: 1;
  }

  ::v-deep {
    text-align: left;
  }

  .token-header {
    background-color: variables.$color-black;

    .token-amount {
      padding-top: 16px;
    }

    .token-actions {
      display: flex;
      justify-content: center;
      padding-bottom: 24px;

      .box-button {
        margin-right: 24px;

        &:last-child {
          margin: 0;
        }
      }
    }

    .token-tabs {
      display: flex;
      align-items: center;
      height: 48px;
      cursor: pointer;

      div {
        display: flex;
        align-items: center;
        margin-left: 18px;

        @extend %face-sans-16-bold;

        font-weight: 500;
        color: variables.$color-light-grey;

        svg {
          margin-right: 6px;
          width: 20px;
          height: 20px;
        }

        &.selected {
          color: variables.$color-green;
        }
      }
    }

    .token-profile {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 20px;

      .token-amount {
        font-size: 18px;
        margin-left: 10px;
        text-align: center;

        ::v-deep .fiat {
          display: block;
          font-size: 16px;
        }
      }
    }
  }

  .token-info > div:nth-child(odd) {
    background-color: variables.$color-bg-1;
  }

  .contract ::v-deep .text,
  .community ::v-deep .text {
    color: variables.$color-green;
  }

  .contract ::v-deep .text {
    font-size: 9px;
    display: flex;
    align-items: center;
  }

  .community ::v-deep .text {
    font-size: 13px;
  }
}
</style>
