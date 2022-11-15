<template>
  <div class="token-details">
    <Loader v-if="loading" />

    <div class="top">
      <Tokens
        :tokens="tokens"
        :symbol-length="22"
        vertical
      />

      <TokenAmount
        class="token-amount"
        no-symbol
        fiat-below
        :amount="convertedBalance"
        :aex9="!isAe"
      />
    </div>

    <div class="token-actions">
      <BtnBox
        @click="openTransferReceiveModal()"
      >
        <ArrowReceiveIcon />
        {{ $t('pages.token-details.receive') }}
      </BtnBox>
      <BtnBox
        :disabled="!(convertedBalance && isConnected)"
        @click="openTransferSendModal()"
      >
        <ArrowSendIcon />
        {{ $t('pages.token-details.send') }}
      </BtnBox>
      <BtnBox
        v-if="isAe"
        :href="simplexLink"
      >
        <BuyIcon />
        {{ $t('pages.fungible-tokens.buy') }}
      </BtnBox>
      <BtnBox
        v-else
        :href="DEX_URL"
      >
        <SwapIcon />
        {{ $t('pages.fungible-tokens.swap') }}
      </BtnBox>
    </div>

    <div class="sticky-tabs-wrapper">
      <Tabs>
        <Tab
          :text="$t('pages.transactionDetails.transactions')"
          :active="activeTab === TABS.transactions"
          @click="setActiveTab(TABS.transactions)"
        />
        <Tab
          :text="isAe
            ? $t('pages.token-details.coin-details')
            : $t('pages.token-details.token-details')"
          :active="activeTab === TABS.details"
          @click="setActiveTab(TABS.details)"
        />
      </Tabs>
    </div>
    <TokenDetailsInfo
      v-if="activeTab === TABS.details"
      :token-data="tokenData"
      :token-pairs="tokenPairs"
      :tokens="tokens"
    />
    <TransactionList
      v-else
      :token="id"
      show-filters
      :scroll-top-threshold="213"
      class="transaction-list-wrapper"
    />
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapGetters, mapState } from 'vuex';
import {
  DEX_URL,
  MODAL_TRANSFER_RECEIVE,
  MODAL_TRANSFER_SEND,
  AETERNITY_CONTRACT_ID,
  buildSimplexLink,
  watchUntilTruthy, AETERNITY_SYMBOL,
} from '../../utils';

import BtnBox from '../../components/buttons/BtnBox.vue';
import TokenAmount from '../../components/TokenAmount.vue';
import Tokens from '../../components/Tokens.vue';
import Loader from '../../components/Loader.vue';
import TransactionList from '../../components/TransactionList.vue';
import Tabs from '../../components/tabs/Tabs.vue';
import Tab from '../../components/tabs/Tab.vue';
import TokenDetailsInfo from '../../components/FungibleTokens/TokenDetailsInfo.vue';

import ArrowSendIcon from '../../../icons/arrow-send.svg?vue-component';
import ArrowReceiveIcon from '../../../icons/arrow-receive.svg?vue-component';
import SwapIcon from '../../../icons/swap.svg?vue-component';
import BuyIcon from '../../../icons/buy.svg?vue-component';

const TABS = {
  details: 1,
  transactions: 2,
};

export default {
  name: 'TokenDetails',
  components: {
    TokenDetailsInfo,
    ArrowSendIcon,
    ArrowReceiveIcon,
    BuyIcon,
    SwapIcon,
    TokenAmount,
    BtnBox,
    TransactionList,
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
      activeTab: TABS.transactions,
      loading: false,
      tokenPairs: {},
      DEX_URL,
      AETERNITY_CONTRACT_ID,
      TABS,
    };
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['balance', 'balanceCurrency']);
  },
  computed: {
    ...mapGetters(['account', 'isConnected']),
    ...mapGetters('fungibleTokens', ['tokenBalances']),
    ...mapState('fungibleTokens', ['aePublicData', 'availableTokens']),
    simplexLink() {
      return buildSimplexLink(this.account.address);
    },
    fungibleToken() {
      return this.availableTokens[this.id];
    },
    isAe() {
      return this.id === AETERNITY_CONTRACT_ID;
    },
    tokenData() {
      if (this.isAe) {
        return {
          decimals: 18,
          ...this.aePublicData,
          symbol: AETERNITY_SYMBOL,
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
    tokens() {
      return this.tokenPairs.token0 && this.tokenPairs.token1
        ? [this.tokenPairs.token0, this.tokenPairs.token1]
        : [this.tokenData];
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
    setActiveTab(tab) {
      this.activeTab = tab;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.token-details {
  --screen-padding-x: 12px;
  --screen-bg-color: #{variables.$color-bg-modal};

  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding-inline: var(--screen-padding-x);
  background-color: variables.$color-bg-4;

  .top {
    text-align: center;
  }

  .token-amount {
    padding-top: 10px;
    margin-bottom: 20px;
    display: block;
    text-align: center;

    @extend %face-sans-22-medium;

    ::v-deep .fiat {
      padding-top: 4px;

      @extend %face-sans-18-regular;
    }
  }

  .token-actions {
    display: flex;
    justify-content: center;
    gap: var(--gap);
    margin-bottom: var(--gap);
  }

  .sticky-tabs-wrapper {
    position: sticky;
    top: calc(var(--header-height) + env(safe-area-inset-top));
    background-color: var(--screen-bg-color);
  }

  ::v-deep .filters {
    --buttons-height: 44px;

    padding-top: 12px;
    height: 56px;
    position: sticky;
    top: calc(var(--header-height) + var(--buttons-height) + env(safe-area-inset-top));
  }
}
</style>
