<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <DashboardBase
        class="dashboard"
        :accounts="accounts"
        :accounts-select-options="accountsSelectOptions"
        :active-account-address="activeAccount.address"
        :active-idx="activeAccountGlobalIdx"
        :balances-total="accountsTotalBalance"
        @select-account="setActiveAccountByAddress"
      >
        <template #swiper>
          <AccountSwiper
            :active-idx="activeAccountGlobalIdx"
            :address-list="accountsAddressList"
            :to="{ name: ROUTE_ACCOUNT_DETAILS }"
            @select-account="(index) => setActiveAccountByGlobalIdx(index)"
          >
            <template #slide="{ index }">
              <AccountCard
                :account="accounts[index]"
                :selected="index === activeAccountGlobalIdx"
              />
            </template>
          </AccountSwiper>
        </template>

        <template #buttons>
          <OpenTransferReceiveModalButton is-big />
          <OpenTransferSendModalButton is-big />
        </template>

        <template #cards>
          <LatestTransactionsCard />

          <DashboardCard
            v-if="IS_MOBILE_APP || UNFINISHED_FEATURES"
            :title="$t('dashboard.daeppBrowserCard.title')"
            :description="$t('dashboard.daeppBrowserCard.description')"
            :btn-text="$t('dashboard.daeppBrowserCard.button')"
            :background="daeppBrowserBackground"
            :icon="GlobeIcon"
            :to="{ name: ROUTE_APPS_BROWSER }"
            :card-id="DASHBOARD_CARD_ID.daeppBrowser"
          />
          <DashboardCard
            v-if="isNodeMainnet && UNFINISHED_FEATURES"
            :title="$t('dashboard.buyCard.title')"
            :description="$t('dashboard.buyCard.description')"
            :btn-text="$t('dashboard.buyCard.button')"
            :background="buyBackground"
            :icon="CardIcon"
            :href="activeAccountSimplexLink"
            :card-id="DASHBOARD_CARD_ID.buyAe"
          />

          <DashboardCard
            v-if="(isNodeMainnet || isNodeTestnet) && activeAccount.protocol === PROTOCOL_AETERNITY"
            :title="$t('dashboard.nameCard.title')"
            :description="$t('dashboard.nameCard.description')"
            :btn-text="$t('dashboard.nameCard.button')"
            :background="chainNameBackground"
            :icon="MenuCardIcon"
            :to="{ name: ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM }"
            :card-id="DASHBOARD_CARD_ID.claimName"
            variant="purple"
          />
        </template>
      </DashboardBase>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  watch,
} from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import { useRoute } from 'vue-router';

import {
  DASHBOARD_CARD_ID,
  IS_MOBILE_APP,
  PROTOCOL_AETERNITY,
  UNFINISHED_FEATURES,
} from '@/constants';
import {
  ROUTE_ACCOUNT_DETAILS,
  ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM,
  ROUTE_APPS_BROWSER,
} from '@/popup/router/routeNames';
import {
  useAccounts,
  useAeSdk,
  useBalances,
  useDeepLinkApi,
} from '@/composables';
import { buildAeFaucetUrl, buildSimplexLink } from '@/protocols/aeternity/helpers';

import AccountCard from '@/popup/components/AccountCard.vue';
import AccountSwiper from '@/popup/components/AccountSwiper.vue';
import DashboardBase from '@/popup/components/DashboardBase.vue';
import DashboardCard from '@/popup/components/DashboardCard.vue';
import OpenTransferReceiveModalButton from '@/popup/components/OpenTransferReceiveModalButton.vue';
import OpenTransferSendModalButton from '@/popup/components/OpenTransferSendModalButton.vue';
import LatestTransactionsCard from '@/popup/components/LatestTransactionsCard.vue';

import ArrowReceiveIcon from '@/icons/arrow-receive.svg?vue-component';
import ArrowSendIcon from '@/icons/arrow-send.svg?vue-component';
import CardIcon from '@/icons/credit-card.svg?vue-component';
import GlobeIcon from '@/icons/globe-small.svg?vue-component';
import MenuCardIcon from '@/icons/menu-card-fill.svg?vue-component';

import buyBackground from '@/image/dashboard/buy-ae.jpg';
import chainNameBackground from '@/image/dashboard/chain-name.jpg';
import daeppBrowserBackground from '@/image/dashboard/aepp-browser.jpg';

export default defineComponent({
  name: 'Dashboard',
  components: {
    DashboardCard,
    LatestTransactionsCard,
    OpenTransferReceiveModalButton,
    OpenTransferSendModalButton,
    DashboardBase,
    AccountCard,
    AccountSwiper,
    IonPage,
    IonContent,
  },
  setup() {
    const route = useRoute();

    const {
      accounts,
      accountsAddressList,
      accountsSelectOptions,
      activeAccount,
      activeAccountGlobalIdx,
      setActiveAccountByGlobalIdx,
      setActiveAccountByAddress,
    } = useAccounts();

    const { accountsTotalBalance } = useBalances();
    const { checkIfOpenTransferSendModal } = useDeepLinkApi();
    const { isNodeMainnet, isNodeTestnet } = useAeSdk();

    const activeAccountFaucetUrl = computed(() => buildAeFaucetUrl(activeAccount.value.address));
    const activeAccountSimplexLink = computed(() => buildSimplexLink(activeAccount.value.address));

    watch(
      () => route.query,
      () => checkIfOpenTransferSendModal(route),
      {
        deep: true,
        immediate: true,
      },
    );

    return {
      IS_MOBILE_APP,
      PROTOCOL_AETERNITY,
      DASHBOARD_CARD_ID,
      UNFINISHED_FEATURES,
      ROUTE_ACCOUNT_DETAILS,
      ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM,
      ROUTE_APPS_BROWSER,

      ArrowSendIcon,
      ArrowReceiveIcon,
      CardIcon,
      GlobeIcon,
      MenuCardIcon,

      accounts,
      accountsAddressList,
      accountsSelectOptions,
      accountsTotalBalance,
      activeAccount,
      activeAccountSimplexLink,
      activeAccountFaucetUrl,
      activeAccountGlobalIdx,
      buyBackground,
      chainNameBackground,
      daeppBrowserBackground,
      isNodeMainnet,
      isNodeTestnet,
      setActiveAccountByGlobalIdx,
      setActiveAccountByAddress,
    };
  },
});
</script>
