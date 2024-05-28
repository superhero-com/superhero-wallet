<template>
  <div class="account-details-navigation">
    <Tabs>
      <Tab
        v-for="tab in currentTabs"
        :key="tab.routeName"
        :exact-path="tab.exact"
        :to="{ name: tab.routeName }"
        :text="tab.text"
        :data-cy="tab.routeName"
      />
    </Tabs>
    <div
      v-if="isOnline && currentSubTabs.length"
      class="sub-tabs"
    >
      <BtnPill
        v-for="subTab in currentSubTabs"
        :key="subTab.routeName"
        :to="{ name: subTab.routeName }"
        :text="subTab.text"
        :exact="subTab.exact"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { PropType, computed, defineComponent } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

import type { ObjectValues } from '@/types';
import { useConnection } from '@/composables';
import {
  ROUTE_ACCOUNT_DETAILS,
  ROUTE_ACCOUNT_DETAILS_ASSETS,
  ROUTE_ACCOUNT_DETAILS_NAMES,
  ROUTE_ACCOUNT_DETAILS_NAMES_AUCTIONS,
  ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM,
  ROUTE_MULTISIG_DETAILS,
  ROUTE_MULTISIG_DETAILS_INFO,
  ROUTE_MULTISIG_DETAILS_ASSETS,
} from '../router/routeNames';

import BtnPill from './buttons/BtnPill.vue';
import Tab from './tabs/Tab.vue';
import Tabs from './tabs/Tabs.vue';

const navigationPossibleItems: Record<string, string> = {
  [ROUTE_ACCOUNT_DETAILS]: ROUTE_ACCOUNT_DETAILS,
  [ROUTE_ACCOUNT_DETAILS_ASSETS]: ROUTE_ACCOUNT_DETAILS_ASSETS,
  [ROUTE_ACCOUNT_DETAILS_NAMES]: ROUTE_ACCOUNT_DETAILS_NAMES,
  [ROUTE_MULTISIG_DETAILS]: ROUTE_MULTISIG_DETAILS,
  [ROUTE_MULTISIG_DETAILS_INFO]: ROUTE_MULTISIG_DETAILS_INFO,
  [ROUTE_MULTISIG_DETAILS_ASSETS]: ROUTE_MULTISIG_DETAILS_ASSETS,
} as const;

type NavigationItem = ObjectValues<typeof navigationPossibleItems>;

interface NavigationElement {
  text: string;
  routeName?: string;
  exact?: boolean;
  children?: NavigationElement[];
}

export default defineComponent({
  name: 'AccountDetailsNavigation',
  components: {
    Tabs,
    Tab,
    BtnPill,
  },
  props: {
    routeNames: {
      type: Array as PropType<NavigationItem[]>,
      required: true,
      validator: (items: string[]) => items
        .every((routeName: string) => !!navigationPossibleItems[routeName]),
    },
  },
  setup(props) {
    const route = useRoute();
    const { t } = useI18n();
    const { isOnline } = useConnection();

    const navigationConfig: Record<string, NavigationElement> = {
      [ROUTE_ACCOUNT_DETAILS]: {
        text: t('modals.accountDetails.transactions'),
        exact: true,
      },
      [ROUTE_ACCOUNT_DETAILS_ASSETS]: {
        text: t('modals.accountDetails.assets'),
      },
      [ROUTE_ACCOUNT_DETAILS_NAMES]: {
        text: t('modals.accountDetails.names'),
        children: [
          {
            text: t('pages.names.tabs.my-names'),
            routeName: ROUTE_ACCOUNT_DETAILS_NAMES,
            exact: true,
          },
          {
            text: t('pages.names.tabs.auctions'),
            routeName: ROUTE_ACCOUNT_DETAILS_NAMES_AUCTIONS,
          },
          {
            text: t('pages.names.tabs.register'),
            routeName: ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM,
          },
        ],
      },
      [ROUTE_MULTISIG_DETAILS]: {
        text: t('modals.accountDetails.transactions'),
        exact: true,
      },
      [ROUTE_MULTISIG_DETAILS_ASSETS]: {
        text: t('modals.accountDetails.assets'),
      },
      [ROUTE_MULTISIG_DETAILS_INFO]: {
        text: t('modals.accountDetails.details'),
      },
    };

    const currentTabs = props.routeNames.map((routeName) => ({
      routeName,
      ...navigationConfig[routeName],
    }));

    const currentSubTabs = computed(
      () => (currentTabs.find(
        ({ children }) => children?.some(
          ({ routeName }) => routeName === route.name,
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
@use '@/styles/variables' as *;
@use '@/styles/mixins';

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
