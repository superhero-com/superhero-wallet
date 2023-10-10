<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="token-container">
        <div class="token-content">
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
              :protocol="PROTOCOL_AETERNITY"
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

          <div
            ref="stickyTabsWrapperEl"
            class="sticky-tabs-wrapper"
          >
            <Tabs>
              <Tab
                v-for="tab in tabs"
                :key="tab.routeName"
                :exact-path="tab.exact"
                :to="{ name: tab.routeName, params: route.params }"
                :text="tab.text"
              />
            </Tabs>
            <TransactionAndTokenFilter
              :key="routeName"
              :show-filters="showFilterBar"
            />
          </div>
        </div>
        <!-- We are disabling animations on FF because of a bug that causes flickering
          see: https://github.com/ionic-team/ionic-framework/issues/26620 -->
        <IonRouterOutlet
          :animated="!IS_FIREFOX"
          class="token-router"
          :style="{ height: routerHeight || '350px' }"
        />
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  IonPage,
  IonRouterOutlet,
  IonContent,
  onIonViewDidLeave,
  onIonViewDidEnter,
} from '@ionic/vue';
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  nextTick,
} from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Encoded } from '@aeternity/aepp-sdk';

import type { IToken, ITokenList, TokenPair } from '@/types';
import {
  IS_IOS,
  PROTOCOL_AETERNITY,
  UNFINISHED_FEATURES,
  IS_FIREFOX,
} from '@/constants';
import {
  ROUTE_COIN,
  ROUTE_COIN_DETAILS,
  ROUTE_MULTISIG_COIN,
  ROUTE_MULTISIG_COIN_DETAILS,
  ROUTE_TOKEN,
  ROUTE_TOKEN_DETAILS,
} from '@/popup/router/routeNames';
import {
  useAccounts,
  useAeSdk,
  useCurrencies,
  useTokensList,
  useTokenProps,
  useUi,
} from '@/composables';
import { useState, useGetter } from '@/composables/vuex';
import { AE_CONTRACT_ID, AE_DEX_URL } from '@/protocols/aeternity/config';
import { buildAeFaucetUrl, buildSimplexLink, isContract } from '@/protocols/aeternity/helpers';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import BtnBox from '../../components/buttons/BtnBox.vue';
import TokenAmount from '../../components/TokenAmount.vue';
import Tokens from '../../components/Tokens.vue';
import OpenTransferReceiveModalButton from '../../components/OpenTransferReceiveModalButton.vue';
import OpenTransferSendModalButton from '../../components/OpenTransferSendModalButton.vue';
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
    Tabs,
    Tab,
    OpenTransferReceiveModalButton,
    OpenTransferSendModalButton,
    IonPage,
    IonContent,
    IonRouterOutlet,
  },
  setup() {
    const store = useStore();
    const route = useRoute();
    const { t } = useI18n();
    const { setTokenProps } = useTokenProps();
    const { setLoaderVisible } = useUi();

    const isMultisig = computed((): boolean => !!route?.meta?.isMultisig);

    const { isNodeMainnet, isNodeTestnet, getAeSdk } = useAeSdk({ store });
    const { activeAccount } = useAccounts();
    const { aeTokenBalance } = useTokensList({
      store,
      isMultisig: isMultisig.value,
    });
    const { marketData } = useCurrencies();

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
    const routerHeight = ref<string>();
    const tokenPairs = ref<TokenPair>({ token0: null, token1: null });
    const stickyTabsWrapperEl = ref<HTMLDivElement>();
    const tokenBalances = useGetter<IToken[]>('fungibleTokens/tokenBalances');
    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');
    const fungibleToken = computed(() => availableTokens.value[contractId]);
    const routeName = computed(() => route.name);
    const showFilterBar = computed(() => !!route?.meta?.showFilterBar);
    const activeAccountFaucetUrl = computed(
      () => (isAe) ? buildAeFaucetUrl(activeAccount.value.address) : null,
    );
    const activeAccountSimplexLink = computed(
      () => (isAe) ? buildSimplexLink(activeAccount.value.address) : null,
    );

    const tokenData = computed((): IToken => {
      if (isAe) {
        return ProtocolAdapterFactory
          .getAdapter(PROTOCOL_AETERNITY)
          .getDefaultCoin(marketData.value!, aeTokenBalance.value.toNumber());
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

    function calculateRouterHeight() {
      nextTick(() => {
        const ionicWrapperBottom = document.querySelector('#app-wrapper')?.getBoundingClientRect()?.bottom;
        const tabsWrapperElementBottom = stickyTabsWrapperEl.value?.getBoundingClientRect().bottom;
        routerHeight.value = `${ionicWrapperBottom! - tabsWrapperElementBottom!}px`!;
      });
    }

    /**
     * Observe tabs wrapper height changes and recalculate router height.
     * Tabs change height when filters are shown/hidden
     */
    function observeTabsWrapperHeight() {
      const resizeObserver = new ResizeObserver(() => {
        calculateRouterHeight();
      });
      resizeObserver.observe(stickyTabsWrapperEl.value!);
    }

    onMounted(async () => {
      if (isContract(contractId) && !isAe) {
        await getAeSdk();
        tokenPairs.value = await store.dispatch('fungibleTokens/getContractTokenPairs', contractId);
      }
      setLoaderVisible(false);
      setTimeout(() => {
        observeTabsWrapperHeight();
        calculateRouterHeight();
      }, 250);
    });

    onIonViewDidEnter(() => {
      setLoaderVisible(true);
      setTokenProps({
        contractId,
        tokenPairs: tokenPairs.value,
        tokenData: tokenData.value,
        tokens: tokens.value,
        isMultisig: isMultisig.value,
      });
    });

    onIonViewDidLeave(() => {
      setLoaderVisible(false);
      setTokenProps(null);
    });

    return {
      PROTOCOL_AETERNITY,
      UNFINISHED_FEATURES,
      IS_IOS,
      AE_DEX_URL,
      stickyTabsWrapperEl,
      BuyIcon,
      SwapIcon,
      FaucetIcon,
      fungibleToken,
      contractId,
      isAe,
      isNodeMainnet,
      isNodeTestnet,
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
      route,
      routerHeight,
      IS_FIREFOX,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables';
@use '@/styles/typography';

.token-container {
  display: flex;
  flex-direction: column;

  .token-content {
    --screen-padding-x: 12px;

    display: flex;
    flex-direction: column;
    padding-inline: var(--screen-padding-x);
  }

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

  .token-router {
    position: inherit;
    padding-inline-start: calc(-1 * var(--screen-padding-x));
    padding-inline-end: calc(-1 * var(--screen-padding-x));
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
