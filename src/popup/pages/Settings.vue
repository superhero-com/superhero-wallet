<template>
  <div class="settings">
    <PanelItem
      :to="{ name: 'settings-seed-phrase' }"
      :title="$t('pages.index.seedPhrase')"
    />
    <PanelItem
      :to="{ name: ROUTE_NETWORK_SETTINGS }"
      :title="$t('pages.titles.networks')"
      :info="activeNetwork.name"
      data-cy="networks"
    />
    <PanelItem
      :to="{ name: 'permissions-settings' }"
      :title="$t('pages.titles.permissionsSettings')"
    />
    <PanelItem
      :to="{ name: 'notification-settings' }"
      :title="$t('pages.titles.notifications')"
    />
    <PanelItem
      :to="{ name: 'settings-language' }"
      :title="$t('pages.titles.language')"
    />
    <PanelItem
      :to="{ name: 'settings-currency' }"
      :title="$t('pages.titles.currency')"
      :info="activeCurrency"
    />
    <PanelItem
      :to="{ name: 'settings-errors-log' }"
      :title="$t('pages.titles.saveErrorsLog')"
      :info="saveErrorLog ? 'On' : 'Off'"
    />
    <PanelItem
      :to="{ name: 'settings-reset-wallet' }"
      :title="$t('pages.titles.resetWallet')"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useState } from '@/composables/vuex';
import { useCurrencies, useNetworks } from '@/composables';
import { ROUTE_NETWORK_SETTINGS } from '@/popup/router/routeNames';

import PanelItem from '@/popup/components/PanelItem.vue';

export default defineComponent({
  name: 'Settings',
  components: {
    PanelItem,
  },
  setup() {
    const { currentCurrencyInfo } = useCurrencies();
    const { activeNetwork } = useNetworks();

    const saveErrorLog = useState('saveErrorLog');

    const activeCurrency = computed(
      () => `${currentCurrencyInfo.value.code.toUpperCase()} (${currentCurrencyInfo.value.symbol.toUpperCase()})`,
    );

    return {
      ROUTE_NETWORK_SETTINGS,
      activeNetwork,
      saveErrorLog,
      activeCurrency,
    };
  },
});
</script>

<style lang="scss" scoped>
.settings {
  --screen-padding-x: 8px;

  overflow: hidden;
  padding-inline: var(--screen-padding-x);
}
</style>
