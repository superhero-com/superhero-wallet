<template>
  <div class="token-container">
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
        large
        :amount="convertedBalance"
        :aex9="!isAe"
      />
    </div>

    <div class="token-actions">
      <OpenTransferReceiveModalButton
        :is-multisig="isMultisig"
        :token-contract-id="fungibleToken ? fungibleToken.contractId : null"
      />
      <OpenTransferSendModalButton
        :is-multisig="isMultisig"
        :token-contract-id="fungibleToken ? fungibleToken.contractId : null"
      />
      <BtnBox
        v-if="isAe && isNodeMainnet && UNFINISHED_FEATURES"
        :text="$t('common.buy')"
        :icon="BuyIcon"
        :href="activeAccountSimplexLink"
      />
      <BtnBox
        v-else-if="isAe && isNodeTestnet"
        :text="$t('common.faucet')"
        :icon="FaucetIcon"
        :href="activeAccountFaucetUrl"
      />
      <BtnBox
        v-else-if="!IS_IOS && (isNodeMainnet || isNodeTestnet)"
        :text="$t('common.swap')"
        :icon="SwapIcon"
        :href="AE_DEX_URL"
      />
    </div>

    <div class="sticky-tabs-wrapper">
      <Tabs>
        <Tab
          v-for="tab in tabs"
          :key="tab.routeName"
          :exact-path="tab.exact"
          :to="{ name: tab.routeName }"
          :text="tab.text"
        />
      </Tabs>
      <TransactionAndTokenFilter
        :key="routeName"
        :show-filters="showFilterBar"
      />
    </div>
    <RouterView
      v-slot="{ Component }"
      :contract-id="contractId"
      :token-pairs="tokenPairs"
      :token-data="tokenData"
      :tokens="tokens"
      :is-multisig="isMultisig"
    >
      <transition
        name="fade-transition"
        mode="out-in"
      >
        <Component :is="Component" />
      </transition>
    </RouterView>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
} from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Encoded } from '@aeternity/aepp-sdk';

import type { IToken, ITokenList } from '@/types';
import { IS_IOS } from '@/constants';
import { AE_CONTRACT_ID, AE_DEX_URL } from '@/protocols/aeternity/config';
import { isContract } from '@/popup/utils';
import {
  ROUTE_COIN,
  ROUTE_COIN_DETAILS,
  ROUTE_MULTISIG_COIN,
  ROUTE_MULTISIG_COIN_DETAILS,
  ROUTE_TOKEN,
  ROUTE_TOKEN_DETAILS,
} from '../../router/routeNames';
import {
  useAccounts,
  useCurrencies,
  useAeSdk,
  useTokensList,
} from '../../../composables';
import { useState, useGetter } from '../../../composables/vuex';

import BtnBox from '../../components/buttons/BtnBox.vue';
import TokenAmount from '../../components/TokenAmount.vue';
import Tokens from '../../components/Tokens.vue';
import OpenTransferReceiveModalButton from '../../components/OpenTransferReceiveModalButton.vue';
import OpenTransferSendModalButton from '../../components/OpenTransferSendModalButton.vue';
import Loader from '../../components/Loader.vue';
import Tabs from '../../components/tabs/Tabs.vue';
import Tab from '../../components/tabs/Tab.vue';
import TransactionAndTokenFilter from '../../components/TransactionAndTokenFilter.vue';

import SwapIcon from '../../../icons/swap.svg?vue-component';
import BuyIcon from '../../../icons/credit-card.svg?vue-component';
import FaucetIcon from '../../../icons/faucet.svg?vue-component';

export default defineComponent({
  name: 'TokenContainer',
  components: {
    TransactionAndTokenFilter,
    TokenAmount,
    BtnBox,
    Tokens,
    Loader,
    Tabs,
    Tab,
    OpenTransferReceiveModalButton,
    OpenTransferSendModalButton,
  },
  setup() {
    const store = useStore();
    const route = useRoute();
    const { t } = useI18n();

    const isMultisig = computed((): boolean => !!route?.meta?.isMultisig);

    const { isNodeMainnet, isNodeTestnet, getAeSdk } = useAeSdk({ store });
    const {
      activeAccountSimplexLink,
      activeAccountFaucetUrl,
    } = useAccounts({ store });
    const { aeternityData } = useCurrencies();
    const { aeTokenBalance } = useTokensList({
      store,
      isMultisig: isMultisig.value,
    });

    const isCoin: boolean = !!route.matched.find(
      ({ name }) => name && [ROUTE_COIN, ROUTE_COIN_DETAILS].includes(name.toString()),
    );
    const contractId = route.params.id as Encoded.ContractAddress | typeof AE_CONTRACT_ID;
    const isAe = contractId === AE_CONTRACT_ID;

    const detailsRouteName = isCoin ? ROUTE_COIN_DETAILS : ROUTE_TOKEN_DETAILS;
    const transactionRouteName = isCoin ? ROUTE_COIN : ROUTE_TOKEN;
    const tabs = [
      {
        text: t('pages.transactionDetails.transactions'),
        routeName: isMultisig.value
          ? ROUTE_MULTISIG_COIN
          : transactionRouteName,
        exact: true,
      },
      {
        text: isCoin
          ? t('pages.token-details.coin-details')
          : t('pages.token-details.token-details'),
        routeName: isMultisig.value
          ? ROUTE_MULTISIG_COIN_DETAILS
          : detailsRouteName,
        exact: true,
      },
    ];
    const loading = ref<boolean>(true);
    const tokenPairs = ref<Record<string, IToken | null>>({ token0: null, token1: null });
    const tokenBalances = useGetter<IToken[]>('fungibleTokens/tokenBalances');
    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');
    const fungibleToken = computed(() => availableTokens.value[contractId]);
    const routeName = computed(() => route.name);
    const showFilterBar = computed(() => !!route?.meta?.showFilterBar);

    const tokenData = computed((): IToken => {
      if (isAe) {
        return {
          ...aeternityData.value!,
          convertedBalance: aeTokenBalance.value.toNumber(),
        };
      }
      return tokenBalances.value.find(
        (token) => token.contractId === contractId,
      ) || { ...fungibleToken.value, contractId };
    });

    const tokens = computed((): IToken[] => {
      const [token0, token1] = [tokenPairs.value.token0, tokenPairs.value.token1];
      return (token0 && token1) ? [token0!, token1!, tokenData.value] : [tokenData.value];
    });

    const convertedBalance = computed(() => +tokenData.value.convertedBalance! || 0);

    onMounted(async () => {
      if (isContract(contractId) && !isAe) {
        await getAeSdk();
        tokenPairs.value = await store.dispatch('fungibleTokens/getContractTokenPairs', contractId);
      }
      loading.value = false;
    });

    return {
      AE_DEX_URL,
      BuyIcon,
      SwapIcon,
      FaucetIcon,
      fungibleToken,
      contractId,
      isAe,
      isNodeMainnet,
      isNodeTestnet,
      loading,
      activeAccountSimplexLink,
      activeAccountFaucetUrl,
      tabs,
      tokenData,
      tokenPairs,
      tokens,
      showFilterBar,
      convertedBalance,
      routeName,
      isMultisig,
      IS_IOS,
      UNFINISHED_FEATURES: process.env.UNFINISHED_FEATURES,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.token-container {
  --screen-padding-x: 12px;

  display: flex;
  flex-direction: column;
  padding-inline: var(--screen-padding-x);

  .top {
    text-align: center;
  }

  .token-amount {
    @extend %face-sans-22-medium;

    padding-top: 10px;
    margin-bottom: 20px;
    display: block;
    text-align: center;
  }

  .token-actions {
    display: flex;
    justify-content: center;
    gap: var(--gap);
    margin-bottom: var(--gap);
  }

  .sticky-tabs-wrapper {
    position: sticky;
    top: env(safe-area-inset-top);
    background-color: var(--screen-bg-color);
    padding-bottom: 4px;
  }

  :deep(.filters) {
    --buttons-height: 40px;

    padding-top: 12px;
    position: sticky;
    top: calc(var(--buttons-height) + env(safe-area-inset-top));
  }
}
</style>
