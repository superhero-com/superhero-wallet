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
              :protocol="PROTOCOLS.aeternity"
              :amount="assetBalance"
              :hide-fiat="!isAe"
            />
          </div>

          <div class="token-actions">
            <OpenTransferReceiveModalButton
              :is-multisig="isMultisig"
              :token-contract-id="fungibleToken?.contractId"
            />
            <OpenTransferSendModalButton
              :is-multisig="isMultisig"
              :token-contract-id="fungibleToken?.contractId"
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
          :animation="fadeAnimation"
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
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Encoded } from '@aeternity/aepp-sdk';

import type { AssetContractId, IToken, TokenPair } from '@/types';
import {
  IS_IOS,
  PROTOCOLS,
  UNFINISHED_FEATURES,
  IS_FIREFOX,
} from '@/constants';
import { excludeFalsy } from '@/utils';
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
  useAccountAssetsList,
  useAeSdk,
  useAssetDetails,
  useCurrencies,
  useFungibleTokens,
  useMultisigAccounts,
  useUi,
} from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { fadeAnimation } from '@/popup/animations';
import AedexV2PairACI from '@/protocols/aeternity/aci/AedexV2PairACI.json';
import { AE_CONTRACT_ID, AE_DEX_URL } from '@/protocols/aeternity/config';
import {
  buildAeFaucetUrl,
  buildSimplexLink,
  calculateSupplyAmount,
  isContract,
} from '@/protocols/aeternity/helpers';

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
  name: 'AssetDetails',
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
    const route = useRoute();
    const { t } = useI18n();
    const { setSharedAssetDetails, resetSharedAssetDetails } = useAssetDetails();
    const { setLoaderVisible } = useUi();

    const isMultisig = computed((): boolean => !!route?.meta?.isMultisig);

    const { isNodeMainnet, isNodeTestnet, getAeSdk } = useAeSdk();
    const { activeAccount, getLastActiveProtocolAccount } = useAccounts();
    const { protocolCoinBalance } = useAccountAssetsList({
      isMultisig: isMultisig.value,
    });
    const { marketData } = useCurrencies();
    const {
      getAccountTokenBalance,
      getProtocolAvailableTokens,
    } = useFungibleTokens();

    const { activeMultisigAccount } = useMultisigAccounts();

    const currentActiveAddress = computed(
      () => isMultisig.value
        ? activeMultisigAccount.value?.gaAccountId!
        : activeAccount.value.address!,
    );

    const currentActiveProtocol = computed(
      () => isMultisig.value
        ? PROTOCOLS.aeternity
        : activeAccount.value.protocol,
    );

    const isCoin: boolean = !!route.matched.find(
      ({ name }) => name && [
        ROUTE_COIN,
        ROUTE_COIN_DETAILS,
        ROUTE_MULTISIG_COIN,
      ].includes(name.toString()),
    );
    const contractId = route.params.id as AssetContractId;
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
    const tokenPairs = ref<Partial<TokenPair>>({ token0: null, token1: null });
    const stickyTabsWrapperEl = ref<HTMLDivElement>();

    const fungibleToken = computed(
      () => getProtocolAvailableTokens(currentActiveProtocol.value)[contractId],
    );
    const fungibleTokenBalance = computed(
      () => (isCoin) ? undefined : getAccountTokenBalance(currentActiveAddress.value, contractId),
    );
    const routeName = computed(() => route.name);
    const showFilterBar = computed(() => !!route?.meta?.showFilterBar);
    const activeAccountFaucetUrl = computed(
      () => (isAe) ? buildAeFaucetUrl(currentActiveAddress.value) : null,
    );
    const activeAccountSimplexLink = computed(
      () => (isAe) ? buildSimplexLink(currentActiveAddress.value) : null,
    );

    const assetData = computed((): IToken | undefined => {
      if (isCoin) {
        return ProtocolAdapterFactory
          .getAdapter(currentActiveProtocol.value)
          .getDefaultCoin(marketData.value!);
      }
      return fungibleToken.value;
    });

    const tokens = computed((): IToken[] => {
      const [token0, token1] = [tokenPairs.value.token0, tokenPairs.value.token1];
      const result = (token0 && token1) ? [token0, token1, assetData.value] : [assetData.value];
      return result.filter(excludeFalsy);
    });

    const assetBalance = computed((): number => (isCoin)
      ? protocolCoinBalance.value.toNumber()
      : getAccountTokenBalance(currentActiveAddress.value, contractId)?.convertedBalance || 0);

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

    async function getContractTokenPairs(
      address: Encoded.ContractAddress,
    ): Promise<Partial<TokenPair> & Record<string, any>> {
      try {
        const aeSdk = await getAeSdk();
        const account = getLastActiveProtocolAccount(PROTOCOLS.aeternity);
        const tokenContract = await aeSdk.initializeContract({
          aci: AedexV2PairACI,
          address,
        });
        const protocolTokens = getProtocolAvailableTokens(PROTOCOLS.aeternity);

        const [
          { decodedResult: balances },
          { decodedResult: balance },
          { decodedResult: token0 },
          { decodedResult: token1 },
          { decodedResult: reserves },
          { decodedResult: totalSupply },
        ] = await Promise.all([
          tokenContract.balances(),
          tokenContract.balance(account?.address),
          tokenContract.token0(),
          tokenContract.token1(),
          tokenContract.get_reserves(),
          tokenContract.total_supply(),
        ]);

        return {
          token0: (protocolTokens[token0])
            ? {
              ...protocolTokens[token0],
              amount: calculateSupplyAmount(
                balance,
                totalSupply,
                reserves.reserve0,
              )!,
            }
            : undefined,
          token1: (protocolTokens[token1])
            ? {
              ...protocolTokens[token1],
              amount: calculateSupplyAmount(
                balance,
                totalSupply,
                reserves.reserve1,
              )!,
            }
            : undefined,
          totalSupply,
          balance,
          balances,
        };
      } catch (error) {
        return {};
      }
    }

    onMounted(async () => {
      if (isContract(contractId) && !isAe) {
        setLoaderVisible(true);
        await getAeSdk();
        tokenPairs.value = await getContractTokenPairs(contractId as Encoded.ContractAddress);
        setLoaderVisible(false);
      }
      setTimeout(() => {
        observeTabsWrapperHeight();
        calculateRouterHeight();
      }, 250);
    });

    onIonViewDidEnter(() => {
      setSharedAssetDetails({
        contractId,
        tokenPairs: tokenPairs.value,
        tokenData: assetData.value,
        tokenBalance: fungibleTokenBalance.value,
        tokens: tokens.value,
        isMultisig: isMultisig.value,
      });
    });

    onIonViewDidLeave(() => {
      resetSharedAssetDetails();
    });

    return {
      PROTOCOLS,
      UNFINISHED_FEATURES,
      IS_FIREFOX,
      IS_IOS,
      AE_DEX_URL,

      BuyIcon,
      FaucetIcon,
      SwapIcon,

      assetBalance,
      assetData,
      contractId,
      stickyTabsWrapperEl,
      fungibleToken,
      isAe,
      isNodeMainnet,
      isNodeTestnet,
      activeAccountSimplexLink,
      activeAccountFaucetUrl,
      tabs,
      tokenPairs,
      tokens,
      showFilterBar,
      routeName,
      isMultisig,
      route,
      routerHeight,
      fadeAnimation,
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
