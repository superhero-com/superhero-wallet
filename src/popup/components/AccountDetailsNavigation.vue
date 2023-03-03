<template>
  <div class="account-details-navigation">
    <Tabs>
      <Tab
        v-for="tab in currentTabs"
        :key="tab.routeName"
        :exact-path="tab.exact"
        :to="{ name: tab.routeName }"
        :text="$t(tab.text)"
        :data-cy="tab.routeName"
      />
    </Tabs>
    <div
      v-if="isOnline && currentSubTabs.length"
      class="sub-tabs"
    >
      <BtnPill
        v-for="subTab in currentSubTabs"
        :key="subTab.name"
        :to="{ name: subTab.routeName }"
        :text="$t(subTab.text)"
        :exact="subTab.exact"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import {
  ROUTE_ACCOUNT_DETAILS,
  ROUTE_ACCOUNT_DETAILS_NAMES,
  ROUTE_ACCOUNT_DETAILS_NAMES_AUCTIONS,
  ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM,
  ROUTE_ACCOUNT_DETAILS_TRANSACTIONS,
  ROUTE_MULTISIG_DETAILS,
  ROUTE_MULTISIG_DETAILS_INFO,
  ROUTE_MULTISIG_DETAILS_TRANSACTIONS,
} from '../router/routeNames';
import { useConnection } from '../../composables';

import BtnPill from './buttons/BtnPill.vue';
import Tab from './tabs/Tab.vue';
import Tabs from './tabs/Tabs.vue';

interface NavigationElement {
  text: string,
  routeName: string,
  exact?: boolean,
  children?: NavigationElement[]
}

const navigationConfigRegular: NavigationElement[] = [
  {
    text: 'modals.accountDetails.assets',
    routeName: ROUTE_ACCOUNT_DETAILS,
    exact: true,
  },
  {
    text: 'modals.accountDetails.transactions',
    routeName: ROUTE_ACCOUNT_DETAILS_TRANSACTIONS,
  },
  {
    text: 'modals.accountDetails.names',
    routeName: ROUTE_ACCOUNT_DETAILS_NAMES,
    children: [
      {
        text: 'pages.names.tabs.my-names',
        routeName: ROUTE_ACCOUNT_DETAILS_NAMES,
        exact: true,
      },
      {
        text: 'pages.names.tabs.auctions',
        routeName: ROUTE_ACCOUNT_DETAILS_NAMES_AUCTIONS,
      },
      {
        text: 'pages.names.tabs.register',
        routeName: ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM,
      },
    ],
  },
];

const navigationConfigMultisig: NavigationElement[] = [
  {
    text: 'modals.accountDetails.assets',
    routeName: ROUTE_MULTISIG_DETAILS,
    exact: true,
  },
  {
    text: 'modals.accountDetails.transactions',
    routeName: ROUTE_MULTISIG_DETAILS_TRANSACTIONS,
  },
  {
    text: 'modals.accountDetails.details',
    routeName: ROUTE_MULTISIG_DETAILS_INFO,
  },
];

export default defineComponent({
  name: 'AccountDetailsNavigation',
  components: {
    Tabs,
    Tab,
    BtnPill,
  },
  props: {
    isMultisig: Boolean,
  },
  setup(props, { root }) {
    const { isOnline } = useConnection();
    const currentTabs = computed(() => (
      props.isMultisig ? navigationConfigMultisig : navigationConfigRegular
    ));

    const currentSubTabs = computed(
      () => (currentTabs.value.find(
        ({ children }) => children?.some(
          ({ routeName }) => routeName === root.$route.name,
        ),
      ))?.children || [],
    );

    return {
      isOnline,
      currentTabs,
      currentSubTabs,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/mixins';

.account-details-navigation {
  .sub-tabs {
    @include mixins.flex(flex-start, center, row);

    margin-top: 10px;
    gap: var(--gap);
    padding-top: 2px;
    padding-bottom: 10px;
    background-color: var(--screen-bg-color);
  }
}

</style>
