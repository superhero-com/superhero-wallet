<template>
  <div class="account-details-navigation">
    <Tabs>
      <Tab
        v-for="tab in navigationConfig"
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

interface NavigationElement {
  text: string,
  routeName: string,
  exact?: boolean,
  children?: NavigationElement[]
}

const navigationConfig: NavigationElement[] = [
  {
    text: 'modals.account-details.assets',
    routeName: 'account-details',
    exact: true,
  },
  {
    text: 'modals.account-details.transactions',
    routeName: 'account-details-transactions',
  },
  {
    text: 'modals.account-details.names',
    routeName: 'account-details-names',
    children: [
      {
        text: 'pages.names.tabs.my-names',
        routeName: 'account-details-names',
        exact: true,
      },
      {
        text: 'pages.names.tabs.auctions',
        routeName: 'account-details-names-auctions',
      },
      {
        text: 'pages.names.tabs.register',
        routeName: 'account-details-names-claim',
      },
    ],
  },
];

export default defineComponent({
  name: 'AccountDetailsNavigation',
  components: {
    Tabs,
    Tab,
    BtnPill,
  },
  setup(props, { root }) {
    const currentSubTabs = computed(
      () => (navigationConfig.find(
        ({ children }) => children?.some(
          ({ routeName }) => routeName === root.$route.name,
        ),
      ))?.children || [],
    );

    return {
      currentSubTabs,
      navigationConfig,
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
