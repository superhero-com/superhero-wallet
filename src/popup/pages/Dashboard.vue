<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <DashboardBase
        class="dashboard"
        :accounts="accounts"
        :accounts-select-options="accountsSelectOptions"
        :active-account-address="activeAccount.address"
        :active-account-protocol="activeAccount.protocol"
        :active-idx="activeAccountGlobalIdx"
        :balances-total="totalBalance"
        :force-header="multisigAccounts.length > 1"
        @select-account="(addressWithProtocol) => setActiveAccountByAddressAndProtocol(addressWithProtocol.split(':')[1], addressWithProtocol.split(':')[0])"
      >
        <template #swiper>
          <AccountSwiper
            :active-idx="activeAccountGlobalIdx"
            :address-list="accountsAddressList"
            @select-account="(index) => setActiveAccountByGlobalIdx(index)"
          >
            <template #slide="{ index, selected }">
              <AccountCard
                :account="accounts[index]"
                :selected="selected"
                :idx="index"
                :to="{ name: ROUTE_ACCOUNT_DETAILS }"
              />
            </template>
          </AccountSwiper>
        </template>

        <template #buttons>
          <OpenTransferReceiveModalBtn is-big />
          <OpenTransferSendModalBtn is-big />
        </template>
        <template #widgets>
          <div class="buttons-row">
            <!-- <BtnPill @click="onDeployContract">
              Deploy Contract
            </BtnPill> -->
          </div>
        </template>
        <template #cards>
          <DashboardCard
            v-if="!hasSuperheroId && isConnected"
            title="Superhero ID"
            description="Create your Superhero ID to store your settings to the blockchain"
            btn-text="Create"
            @click="onCreateSuperheroId"
          />

          <LatestTransactionsCard />

          <DashboardCard
            v-if="IS_MOBILE_APP || UNFINISHED_FEATURES"
            :title="$t('dashboard.daeppBrowserCard.title')"
            :description="$t('dashboard.daeppBrowserCard.description')"
            :btn-text="$t('dashboard.daeppBrowserCard.button')"
            :background="daeppBrowserBackground"
            :icon="GlobeIcon"
            :to="{ name: ROUTE_APPS_BROWSER }"
            :card-id="DASHBOARD_CARD_ID.daeppBrowser!"
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
            v-if="(
              (isNodeMainnet || isNodeTestnet)
              && activeAccount.protocol === PROTOCOLS.aeternity
            )"
            :title="$t('dashboard.nameCard.title')"
            :description="$t('dashboard.nameCard.description')"
            :btn-text="$t('dashboard.nameCard.button')"
            :background="chainNameBackground"
            :icon="ActionIcon"
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
  ref,
  watch,
} from 'vue';
import {
  IonPage,
  IonContent,
  onIonViewWillEnter,
  onIonViewDidLeave,
} from '@ionic/vue';
import { useRoute } from 'vue-router';

import {
  DASHBOARD_CARD_ID,
  IS_MOBILE_APP,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  PROTOCOLS,
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
  useFungibleTokens,
  useMultisigAccounts,
} from '@/composables';
import { buildAeFaucetUrl, buildSimplexLink } from '@/protocols/aeternity/helpers';

import AccountCard from '@/popup/components/AccountCard.vue';
import AccountSwiper from '@/popup/components/AccountSwiper.vue';
import DashboardBase from '@/popup/components/DashboardBase.vue';
import DashboardCard from '@/popup/components/DashboardCard.vue';
import LatestTransactionsCard from '@/popup/components/LatestTransactionsCard.vue';
import OpenTransferSendModalBtn from '@/popup/components/OpenTransferSendModalBtn.vue';
import { useAddressBook } from '@/composables/addressBook';
import { useModals } from '@/composables/modals';
import { SuperheroIDService } from '@/protocols/aeternity/libs/SuperheroIDService';
import SuperheroIdsAci from '@/protocols/aeternity/aci/SuperheroIdsACI.json';

import ArrowReceiveIcon from '@/icons/arrow-receive.svg?vue-component';
import ArrowSendIcon from '@/icons/arrow-send.svg?vue-component';
import CardIcon from '@/icons/credit-card.svg?vue-component';
import GlobeIcon from '@/icons/globe-small.svg?vue-component';
import ActionIcon from '@/icons/action.svg?vue-component';

import buyBackground from '@/image/dashboard/buy-ae.webp';
import chainNameBackground from '@/image/dashboard/chain-name.webp';
import daeppBrowserBackground from '@/image/dashboard/aepp-browser.webp';
import OpenTransferReceiveModalBtn from '@/popup/components/OpenTransferReceiveModalBtn.vue';
import { unpackTx } from '@aeternity/aepp-sdk';
// import BtnPill from '../components/buttons/BtnPill.vue';

export default defineComponent({
  name: 'Dashboard',
  components: {
    AccountCard,
    AccountSwiper,
    DashboardBase,
    DashboardCard,
    IonPage,
    IonContent,
    LatestTransactionsCard,
    OpenTransferReceiveModalBtn,
    OpenTransferSendModalBtn,
    // BtnPill,
  },
  setup() {
    const pageIsActive = ref(true);

    const route = useRoute();

    const {
      accounts,
      accountsAddressList,
      accountsSelectOptions,
      activeAccount,
      activeAccountGlobalIdx,
      setActiveAccountByGlobalIdx,
      setActiveAccountByAddressAndProtocol,
      aeAccounts,
    } = useAccounts();
    const { multisigAccounts } = useMultisigAccounts();
    const { addressBook, addAddressBookEntriesFromJson } = useAddressBook();
    const { openModal, openDefaultModal } = useModals();

    const { accountsTotalBalance } = useBalances();
    const { accountsTotalTokenBalance } = useFungibleTokens();
    const { checkIfOpenTransferSendModal } = useDeepLinkApi();
    const { isNodeMainnet, isNodeTestnet, getAeSdk } = useAeSdk();

    const activeAccountFaucetUrl = computed(() => buildAeFaucetUrl(activeAccount.value.address));
    const activeAccountSimplexLink = computed(() => buildSimplexLink(activeAccount.value.address));

    const totalBalance = computed(() => (
      (+accountsTotalBalance.value + +accountsTotalTokenBalance.value).toString()
    ));

    watch(
      () => route.query,
      () => checkIfOpenTransferSendModal(route),
      {
        deep: true,
        immediate: true,
      },
    );

    onIonViewWillEnter(() => {
      pageIsActive.value = true;
    });

    onIonViewDidLeave(() => {
      pageIsActive.value = false;
    });

    const superheroSvc = ref<SuperheroIDService | null>(null);
    const connectedContractId = ref<string | null>(null);
    const isConnected = computed(() => !!superheroSvc.value);
    const hasSuperheroId = ref(false);

    async function onDeployContract() {
      try {
        const res = await fetch('/contracts/SuperheroIds.aes');
        const source = await res.text();
        const svc = new SuperheroIDService();
        const ct = await svc.deployFromSource(source);
        connectedContractId.value = ct;
        openDefaultModal({ title: 'Contract', msg: `Deployed: ${ct}` });
      } catch (e) {
        openDefaultModal({ title: 'Contract', msg: 'Deploy failed' });
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }

    async function onConnectSuperheroId() {
      if (!aeAccounts.value.length) {
        return;
      }
      superheroSvc.value = new SuperheroIDService();
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _stub = SuperheroIdsAci;
        const addr = aeAccounts.value?.[0]?.address as `ak_${string}`;
        if (addr) {
          hasSuperheroId.value = await superheroSvc.value.hasId();
          if (hasSuperheroId.value) {
            const json = await superheroSvc.value.getId();
            if (json) addAddressBookEntriesFromJson(json);
          }
        }
      } catch (e) {
        openDefaultModal({ title: 'Contract', msg: 'Connection to Superhero ID contract failed' });
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }

    async function onCreateSuperheroId() {
      try {
        if (!superheroSvc.value) throw new Error('Connect Superhero ID first');
        const addr = aeAccounts.value?.[0]?.address as `ak_${string}`;
        if (!addr) throw new Error('No æternity account');
        const svc = new SuperheroIDService();
        const txBase64 = await svc.buildSetIdTx(JSON.stringify(addressBook.value)) as any;
        const tx = unpackTx(txBase64) as any;
        await openModal(MODAL_CONFIRM_TRANSACTION_SIGN, {
          txBase64,
          tx,
          protocol: PROTOCOLS.aeternity,
          app: { host: window.location.origin, href: window.location.origin },
        });
        const aeSdk = await getAeSdk();
        const signed = await aeSdk.signTransaction(txBase64, { fromAccount: addr } as any);
        const { txHash } = await aeSdk.api.postTransaction({ tx: signed });
        await aeSdk.poll(txHash);
        hasSuperheroId.value = true;
        openDefaultModal({ title: 'Superhero ID', msg: 'Created Superhero ID.' });
      } catch (e) {
        openDefaultModal({ title: 'Superhero ID', msg: 'Create failed' });
      }
    }

    watch(
      () => [isNodeTestnet.value],
      () => {
        if (isNodeTestnet.value) {
          onConnectSuperheroId();
        }
      },
      {
        immediate: true,
      },
    );

    return {
      DASHBOARD_CARD_ID,
      IS_MOBILE_APP,
      PROTOCOLS,
      ROUTE_ACCOUNT_DETAILS,
      ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM,
      ROUTE_APPS_BROWSER,
      UNFINISHED_FEATURES,

      ArrowSendIcon,
      ArrowReceiveIcon,
      CardIcon,
      GlobeIcon,
      ActionIcon,

      multisigAccounts,
      accounts,
      accountsAddressList,
      accountsSelectOptions,
      activeAccount,
      activeAccountSimplexLink,
      activeAccountFaucetUrl,
      activeAccountGlobalIdx,
      buyBackground,
      chainNameBackground,
      daeppBrowserBackground,
      isNodeMainnet,
      isNodeTestnet,
      pageIsActive,
      totalBalance,
      setActiveAccountByGlobalIdx,
      setActiveAccountByAddressAndProtocol,
      isConnected,
      hasSuperheroId,
      onDeployContract,
      onConnectSuperheroId,
      onCreateSuperheroId,
    };
  },
});
</script>
