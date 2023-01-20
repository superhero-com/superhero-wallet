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
      v-if="currentSubTabs.length"
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
import BtnPill from './buttons/BtnPill.vue';
import Tab from './tabs/Tab.vue';
import Tabs from './tabs/Tabs.vue';
import {
  ROUTE_ACCOUNT_DETAILS,
  ROUTE_ACCOUNT_DETAILS_MULTISIG_DETAILS,
  ROUTE_ACCOUNT_DETAILS_NAMES,
  ROUTE_ACCOUNT_DETAILS_NAMES_AUCTIONS,
  ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM,
  ROUTE_ACCOUNT_DETAILS_TRANSACTIONS,
} from '../router/routeNames';

interface NavigationElement {
  text: string,
  routeName: string,
  exact?: boolean,
  children?: NavigationElement[]
}

const navItemAssets: NavigationElement = {
  text: 'modals.accountDetails.assets',
  routeName: ROUTE_ACCOUNT_DETAILS,
  exact: true,
};

const navItemTransactions: NavigationElement = {
  text: 'modals.accountDetails.transactions',
  routeName: ROUTE_ACCOUNT_DETAILS_TRANSACTIONS,
};

const navItemDetails: NavigationElement = {
  text: 'modals.accountDetails.details',
  routeName: ROUTE_ACCOUNT_DETAILS_MULTISIG_DETAILS,
};

const navItemNames: NavigationElement = {
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
};

const navigationConfigRegular: NavigationElement[] = [
  navItemAssets,
  navItemTransactions,
  navItemNames,
];

const navigationConfigMultisig: NavigationElement[] = [
  navItemAssets,
  navItemTransactions,
  navItemDetails,
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
