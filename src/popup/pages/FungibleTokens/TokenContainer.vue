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
        v-if="isAe"
        :text="$t('pages.fungible-tokens.buy')"
        :icon="BuyIcon"
        :href="simplexLink"
      />
      <BtnBox
        v-else
        :text="$t('pages.fungible-tokens.swap')"
        :icon="SwapIcon"
        :href="DEX_URL"
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
        :key="routeName!"
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
        <component :is="Component" />
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
import {
  DEX_URL,
  AETERNITY_CONTRACT_ID,
  AETERNITY_SYMBOL,
  buildSimplexLink,
  isContract,
} from '../../utils';
import {
  ROUTE_COIN,
  ROUTE_COIN_DETAILS,
  ROUTE_MULTISIG_COIN,
  ROUTE_MULTISIG_COIN_DETAILS,
  ROUTE_TOKEN,
  ROUTE_TOKEN_DETAILS,
} from '../../router/routeNames';
import { useSdk, useTokensList, useCurrencies } from '../../../composables';
import { useGetter } from '../../../composables/vuex';

import BtnBox from '../../components/buttons/BtnBox.vue';
import TokenAmount from '../../components/TokenAmount.vue';
import Tokens from '../../components/Tokens.vue';
import OpenTransferReceiveModalButton from '../../components/OpenTransferReceiveModalButton.vue';
import OpenTransferSendModalButton from '../../components/OpenTransferSendModalButton.vue';
import Loader from '../../components/Loader.vue';
import Tabs from '../../components/tabs/Tabs.vue';
import TransactionAndTokenFilter from '../../components/TransactionAndTokenFilter.vue';
import Tab from '../../components/tabs/Tab.vue';

import SwapIcon from '../../../icons/swap.svg?vue-component';
import BuyIcon from '../../../icons/credit-card.svg?vue-component';

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

    const { getSdk } = useSdk({ store });
    const currentCurrencyRate = computed(() => store.getters.currentCurrencyRate || 0);
    const isMultisig = computed((): boolean => !!route?.meta?.isMultisig);
    const { aeternityData } = useCurrencies();
    const { aeTokenBalance } = useTokensList({
      store,
      isMultisig: isMultisig.value,
    });

    const isCoin: boolean = !!route.matched.find(
      ({ name }: { name: any }) => name === ROUTE_COIN,
    );
    const contractId = route.params.id as string;
    const isAe = contractId === AETERNITY_CONTRACT_ID;

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
    const tokenPairs = ref({ token0: null, token1: null });
    const account = useGetter('account');
    const tokenBalances = useGetter<any[]>('fungibleTokens/tokenBalances');
    const availableTokens = computed(() => store.state.fungibleTokens.availableTokens);
    const fungibleToken = computed(() => availableTokens.value[contractId]);
    const routeName = computed(() => route.name);
    const simplexLink = computed(() => buildSimplexLink(account.value.address));
    const showFilterBar = computed(() => !!route?.meta?.showFilterBar);

    const tokenData = computed(() => {
      const defaultData = {
        decimals: 18,
        symbol: AETERNITY_SYMBOL,
        convertedBalance: aeTokenBalance.value,
        balanceCurrency: aeTokenBalance.value.toNumber() * currentCurrencyRate.value,
        contractId: '',
        description: '',
        isAe: true,
      };

      return contractId === AETERNITY_CONTRACT_ID
        ? { ...defaultData, ...aeternityData.value }
        : tokenBalances.value.find(
          (token) => token.contractId === contractId,
        ) || { ...fungibleToken.value, contractId };
    });
    const tokens = computed(() => {
      const [token0, token1] = [tokenPairs.value.token0, tokenPairs.value.token1];
      return token0 && token1 ? [token0, token1] : [tokenData.value];
    });
    const convertedBalance = computed(() => +tokenData.value.convertedBalance || 0);

    onMounted(async () => {
      if (isContract(contractId) && !isAe) {
        await getSdk();
        tokenPairs.value = await store.dispatch('fungibleTokens/getContractTokenPairs', contractId);
      }
      loading.value = false;
    });

    return {
      BuyIcon,
      SwapIcon,
      DEX_URL,
      AETERNITY_CONTRACT_ID,
      fungibleToken,
      contractId,
      isAe,
      loading,
      simplexLink,
      tabs,
      tokenData,
      tokenPairs,
      tokens,
      showFilterBar,
      convertedBalance,
      routeName,
      isMultisig,
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
