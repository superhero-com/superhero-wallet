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
      <OpenTransferReceiveModalButton :is-multisig="isMultisig" />
      <OpenTransferProposeModalButton v-if="isMultisig" />
      <OpenTransferSendModalButton v-else />
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
        :key="routeName"
        :show-filters="showFilterBar"
      />
    </div>
    <transition
      name="fade-transition"
      mode="out-in"
    >
      <RouterView
        :contract-id="contractId"
        :token-pairs="tokenPairs"
        :token-data="tokenData"
        :tokens="tokens"
        :is-multisig="isMultisig"
      />
    </transition>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
} from '@vue/composition-api';
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
import { useSdk, useTokensList } from '../../../composables';
import { useGetter } from '../../../composables/vuex';

import BtnBox from '../../components/buttons/BtnBox.vue';
import TokenAmount from '../../components/TokenAmount.vue';
import Tokens from '../../components/Tokens.vue';
import OpenTransferReceiveModalButton from '../../components/OpenTransferReceiveModalButton.vue';
import OpenTransferSendModalButton from '../../components/OpenTransferSendModalButton.vue';
import OpenTransferProposeModalButton from '../../components/OpenTransferProposeModalButton.vue';
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
    OpenTransferProposeModalButton,
  },
  setup(props, { root }) {
    const { getSdk } = useSdk({ store: root.$store });
    const currentCurrencyRate = computed(() => root.$store.getters.currentCurrencyRate);
    const isMultisig = computed((): boolean => !!root.$route?.meta?.isMultisig);
    const { aeTokenBalance } = useTokensList({
      store: root.$store,
      isMultisig: isMultisig.value,
    });

    const isCoin: boolean = !!root.$route.matched.find(({ name }) => name === ROUTE_COIN);
    const contractId = root.$route.params.id;
    const isAe = contractId === AETERNITY_CONTRACT_ID;

    const detailsRouteName = isCoin ? ROUTE_COIN_DETAILS : ROUTE_TOKEN_DETAILS;
    const transactionRouteName = isCoin ? ROUTE_COIN : ROUTE_TOKEN;
    const tabs = [
      {
        text: root.$t('pages.transactionDetails.transactions'),
        routeName: isMultisig.value
          ? ROUTE_MULTISIG_COIN
          : transactionRouteName,
        exact: true,
      },
      {
        text: isCoin
          ? root.$t('pages.token-details.coin-details')
          : root.$t('pages.token-details.token-details'),
        routeName: isMultisig.value
          ? ROUTE_MULTISIG_COIN_DETAILS
          : detailsRouteName,
        exact: true,
      },
    ];
    const loading = ref<boolean>(true);
    const tokenPairs = ref({ token0: null, token1: null });
    const account = useGetter('account');
    const isConnected = useGetter('isConnected');
    const tokenBalances = useGetter<any[]>('fungibleTokens/tokenBalances');
    const availableTokens = computed(() => root.$store.state.fungibleTokens.availableTokens);
    const aePublicData = computed(() => root.$store.state.fungibleTokens.aePublicData);
    const fungibleToken = computed(() => availableTokens.value[contractId]);
    const routeName = computed(() => root.$route.name);
    const simplexLink = computed(() => buildSimplexLink(account.value.address));
    const showFilterBar = computed(() => !!root.$route?.meta?.showFilterBar);

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
        ? { ...defaultData, ...aePublicData.value }
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
        tokenPairs.value = await root.$store.dispatch('fungibleTokens/getContractTokenPairs', contractId);
      }
      loading.value = false;
    });

    return {
      BuyIcon,
      SwapIcon,
      DEX_URL,
      AETERNITY_CONTRACT_ID,
      contractId,
      isAe,
      loading,
      isConnected,
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

  ::v-deep .filters {
    --buttons-height: 40px;

    padding-top: 12px;
    position: sticky;
    top: calc(var(--buttons-height) + env(safe-area-inset-top));
  }
}
</style>
