<template>
  <div class="token-details">
    <Loader v-if="loading" />

    <div class="top">
      <Tokens
        :tokens="
          tokenPairs.token0 && tokenPairs.token1
            ? [tokenPairs.token0, tokenPairs.token1]
            : [tokenData]
        "
        :symbol-length="22"
        vertical
      />

      <TokenAmount
        class="token-amount"
        no-symbol
        :amount="convertedBalance"
        :aex9="id !== AETERNITY_CONTRACT_ID"
      />
    </div>

    <div class="token-actions">
      <BtnBox
        class="token-actions-btn"
        :disabled="!convertedBalance"
        @click="openTransferSendModal()"
      >
        <SendIcon />
        {{ $t('pages.token-details.send') }}
      </BtnBox>
      <BtnBox
        class="token-actions-btn"
        @click="openTransferReceiveModal()"
      >
        <ReceiveIcon />
        {{ $t('pages.token-details.receive') }}
      </BtnBox>
      <BtnBox
        v-if="id === AETERNITY_CONTRACT_ID"
        class="token-actions-btn"
        :href="simplexLink"
      >
        <BuyIcon />
        {{ $t('pages.fungible-tokens.buyAe') }}
      </BtnBox>
    </div>

    <Tabs>
      <Tab
        :text="$t('pages.transactionDetails.transactions')"
        :active="activeTab === 'transactions'"
        @click="activeTab = 'transactions'"
      />
      <Tab
        :text="$t('pages.token-details.details')"
        :active="activeTab === 'details'"
        @click="activeTab = 'details'"
      />
    </Tabs>

    <div
      v-if="activeTab === 'details'"
      class="token-info"
    >
      <DetailsRow
        v-if="tokenData.symbol"
        :label="$t('pages.token-details.token')"
        :text="tokenData.symbol"
      />
      <DetailsRow
        v-if="tokenData.decimals"
        :label="$t('pages.token-details.decimals')"
        :text="tokenData.decimals"
      />
      <DetailsRow
        v-if="tokenData.contractId"
        :label="$t('pages.token-details.contract')"
      >
        <template #text>
          <AddressShortening :address="tokenData.contractId" />
        </template>
      </DetailsRow>
      <DetailsRow
        v-if="tokenData.circulating_supply"
        :label="$t('pages.token-details.max-supply')"
        :text="formatNumber(tokenData.circulating_supply)"
      />
      <DetailsRow
        v-if="tokenData.total_supply"
        :label="$t('pages.token-details.total-supply')"
        :text="formatNumber(tokenData.total_supply)"
      />
      <DetailsRow
        v-if="tokenData.market_cap"
        :label="$t('pages.token-details.market-cap')"
        class="price"
      >
        <template #text>
          {{ formatCurrency(tokenData.market_cap) }}
        </template>
      </DetailsRow>
      <DetailsRow
        v-if="tokenPairs.balances"
        :label="$t('pages.token-details.holders')"
        :text="tokenPairs.balances.size"
      />
      <DetailsRow v-if="tokenPairs.token0 && tokenPairs.token0.amount > 0">
        <template #label>
          {{ $t('pages.token-details.pooled') }}
          <span class="white">{{ tokenPairs.token0.symbol }}</span>
        </template>
        <template #text>
          {{ convertToken(tokenPairs.token0.amount, -tokenPairs.token0.decimals) }}
        </template>
      </DetailsRow>

      <DetailsRow v-if="tokenPairs.token1 && tokenPairs.token1.amount > 0">
        <template #label>
          {{ $t('pages.token-details.pooled') }}
          <span class="white">{{ tokenPairs.token1.symbol }}</span>
        </template>
        <template #text>
          {{ convertToken(tokenPairs.token1.amount, -tokenPairs.token1.decimals) }}
        </template>
      </DetailsRow>

      <DetailsRow
        v-if="poolShare"
        :label="$t('pages.token-details.poolShare')"
        :text="poolShare"
      />
      <DetailsRow
        v-if="!tokenData.isAe && UNFINISHED_FEATURES"
        :label="$t('pages.token-details.transactions')"
      />

      <DetailsRow
        v-if="tokenData.total_volume"
        :label="$t('pages.token-details.volume')"
      >
        <template #text>
          {{ formatCurrency(tokenData.total_volume) }}
        </template>
      </DetailsRow>
      <DetailsRow
        v-if="tokenData.market_cap_change_24h"
        class="price"
        :label="$t('pages.token-details.volumeDaily')"
      >
        <template #text>
          <span
            :class="{
              green: tokenData.market_cap_change_percentage_24h > 0,
              red: tokenData.market_cap_change_percentage_24h < 0,
            }"
          >
            {{ Number(tokenData.market_cap_change_percentage_24h).toFixed(2) }}%
          </span>
          {{ formatCurrency(tokenData.market_cap_change_24h) }}
        </template>
      </DetailsRow>
      <DetailsRow
        v-if="!tokenData.isAe && UNFINISHED_FEATURES"
        :label="$t('pages.token-details.feeDaily')"
      />

      <DetailsRow
        v-if="!tokenData.isAe"
        class="link"
        :label="$t('pages.token-details.chart')"
      >
        <template #text>
          <a
            :href="DEX_URL"
            target="_blank"
          >
            {{ displayDexUrl }}
            <ExternalLink />
          </a>
        </template>
      </DetailsRow>
      <DetailsRow
        v-if="!tokenData.isAe && UNFINISHED_FEATURES"
        :label="$t('pages.token-details.price-ae')"
      />
      <DetailsRow
        v-if="tokenData.current_price"
        class="price"
        :label="$t('pages.token-details.price')"
      >
        <template #text>
          <span
            :class="{
              green: tokenData.price_change_percentage_24h > 0,
              red: tokenData.price_change_percentage_24h < 0,
            }"
          >
            {{ Number(tokenData.price_change_percentage_24h).toFixed(2) }}%
          </span>
          {{ formatCurrency(tokenData.current_price) }}
        </template>
      </DetailsRow>
      <DetailsRow
        v-if="tokenData.ath"
        :label="$t('pages.token-details.ath-change')"
        :text="formatCurrency(tokenData.ath)"
      />
      <DetailsRow
        v-if="tokenData.atl"
        :label="$t('pages.token-details.atl-change')"
        :text="formatCurrency(tokenData.atl)"
      />
    </div>
    <div
      v-else
      class="transaction-list-wrapper"
    >
      <TransactionList :token="id" />
    </div>
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapGetters, mapState } from 'vuex';
import BigNumber from 'bignumber.js';
import SendIcon from '../../../icons/send.svg?vue-component';
import ReceiveIcon from '../../../icons/receive.svg?vue-component';
import BuyIcon from '../../../icons/buy.svg?vue-component';
import ExternalLink from '../../../icons/external-link.svg?vue-component';
import BtnBox from '../../components/buttons/BtnBox.vue';
import TokenAmount from '../../components/TokenAmount.vue';
import DetailsRow from '../../components/FungibleTokens/DetailsRow.vue';
import Tokens from '../../components/Tokens.vue';
import Loader from '../../components/Loader.vue';
import TransactionList from '../../components/TransactionList.vue';
import AddressShortening from '../../components/AddressShortening.vue';
import {
  DEX_URL,
  MODAL_TRANSFER_RECEIVE,
  MODAL_TRANSFER_SEND,
  AETERNITY_CONTRACT_ID,
} from '../../utils/constants';
import { convertToken, watchUntilTruthy } from '../../utils/helper';
import { buildSimplexLink } from '../../../background/utils';
import Tabs from '../../components/tabs/Tabs.vue';
import Tab from '../../components/tabs/Tab.vue';

export default {
  name: 'TokenDetails',
  components: {
    SendIcon,
    ReceiveIcon,
    BuyIcon,
    TokenAmount,
    BtnBox,
    DetailsRow,
    TransactionList,
    AddressShortening,
    ExternalLink,
    Tokens,
    Loader,
    Tabs,
    Tab,
  },
  props: {
    id: { type: String, required: true },
  },
  data() {
    return {
      activeTab: 'transactions',
      loading: false,
      tokenPairs: {},
      DEX_URL,
      UNFINISHED_FEATURES: process.env.UNFINISHED_FEATURES,
      AETERNITY_CONTRACT_ID,
    };
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['balance', 'balanceCurrency']);
  },
  computed: {
    ...mapGetters(['formatCurrency', 'formatNumber', 'accounts', 'account']),
    ...mapState('accounts', ['activeIdx']),
    ...mapState('fungibleTokens', ['aePublicData', 'availableTokens']),
    ...mapGetters('fungibleTokens', ['tokenBalances']),
    simplexLink() {
      return buildSimplexLink(this.account.address);
    },
    fungibleToken() {
      return this.availableTokens[this.id];
    },
    displayDexUrl() {
      return this.DEX_URL.replace('https://', '');
    },
    tokenData() {
      if (this.id === AETERNITY_CONTRACT_ID) {
        return {
          decimals: 18,
          ...this.aePublicData,
          symbol: 'AE',
          convertedBalance: this.balance,
          balanceCurrency: this.balanceCurrency,
          contractId: '',
          description: '',
          isAe: true,
        };
      }

      return (
        this.tokenBalances.find(({ contractId }) => contractId === this.id) || {
          ...this.fungibleToken,
          contractId: this.id,
        }
      );
    },
    convertedBalance() {
      return +this.tokenData.convertedBalance || 0;
    },
    poolShare() {
      if (!this.tokenPairs || !this.tokenPairs.balance || !this.tokenPairs.totalSupply) {
        return null;
      }
      return `${BigNumber(this.tokenPairs.balance)
        .times(100).div(this.tokenPairs.totalSupply).toFixed(8)}%`;
    },
  },
  async mounted() {
    if (this.id.includes('ct_')) {
      this.loading = true;
      await watchUntilTruthy(() => this.$store.state.sdk);
      this.tokenPairs = await this.$store.dispatch('fungibleTokens/getContractTokenPairs', this.id);
      this.loading = false;
    }
  },
  methods: {
    convertToken,
    openTransferReceiveModal() {
      this.$store.dispatch('modals/open', {
        name: MODAL_TRANSFER_RECEIVE,
        tokenContractId: this.fungibleToken?.contractId,
      });
    },
    openTransferSendModal() {
      this.$store.dispatch('modals/open', {
        name: MODAL_TRANSFER_SEND,
        tokenContractId: this.fungibleToken?.contractId,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.token-details {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding-inline: var(--screen-padding-x);

  .top {
    text-align: center;
  }

  .transaction-list {
    flex-grow: 1;

    ::v-deep .filters {
      top: calc(env(safe-area-inset-top) + 270px);
    }
  }

  .token-amount {
    padding-top: 8px;
    margin-bottom: 14px;
    display: block;
    text-align: center;

    @extend %face-sans-24-medium;

    ::v-deep .fiat {
      display: block;
      font-size: 16px;
    }
  }

  .token-actions {
    display: flex;
    justify-content: center;
    gap: var(--gap);
    margin-bottom: var(--gap);

    &-btn {
      max-width: 120px;
    }
  }

  .token-info {
    margin-top: 10px;
  }

  .community ::v-deep .text {
    color: variables.$color-green;
    font-size: 13px;
  }

  .primary ::v-deep .text {
    color: variables.$color-blue;
  }

  .link ::v-deep .text a {
    color: variables.$color-light-grey;
    text-decoration: none;
    display: inline-flex;
    align-items: center;

    svg {
      width: 22px;
      height: 22px;
    }
  }

  .price ::v-deep .text {
    .green {
      color: variables.$color-green;
      font-weight: 400;
    }

    .red {
      color: variables.$color-danger;
      font-weight: 400;
    }
  }

  ::v-deep .address-shortening {
    color: variables.$color-light-grey;

    &:hover {
      color: variables.$color-white;
    }
  }

  .transaction-list-wrapper {
    margin-top: 16px;
  }
}
</style>
