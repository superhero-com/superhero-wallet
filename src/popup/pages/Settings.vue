<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="settings">
        <PanelItem
          :to="{ name: ROUTE_SEED_PHRASE_SETTINGS }"
          :title="$t('pages.index.seedPhrase')"
        />
        <PanelItem
          :to="{ name: ROUTE_SECURE_LOGIN_SETTINGS }"
          :info="secureLoginSettingsInfo"
          :title="$t('pages.titles.secureLogin')"
        />
        <PanelItem
          :to="{ name: ROUTE_NETWORK_SETTINGS }"
          :title="$t('pages.titles.networks')"
          :info="activeNetwork.name"
          data-cy="networks-settings"
        />
        <PanelItem
          :to="{ name: ROUTE_TOKEN_SALES }"
          :title="$t('pages.titles.tokenSales')"
          data-cy="token-sales"
        />
        <PanelItem
          :to="{ name: ROUTE_PERMISSIONS_SETTINGS }"
          :title="$t('pages.titles.permissionsSettings')"
        />
        <PanelItem
          v-if="protocolsInUse.includes(PROTOCOLS.aeternity)"
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
          :info="saveErrorLog ? $t('common.on') : $t('common.off')"
        />
        <PanelItem
          v-if="hasSuperheroId"
          :title="$t('dashboard.superheroId.syncSettingsBtn')"
          :disabled="isSyncing"
          @click="onSyncSettings"
        />
        <PanelItem
          :to="{ name: 'settings-reset-wallet' }"
          :title="$t('pages.titles.resetWallet')"
        />
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { computed, defineComponent, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { IS_MOBILE_APP, PROTOCOLS } from '@/constants';
import {
  useAccounts,
  useCurrencies,
  useNetworks,
  useUi,
  useSuperheroId,
} from '@/composables';
import {
  ROUTE_NETWORK_SETTINGS,
  ROUTE_PERMISSIONS_SETTINGS,
  ROUTE_SECURE_LOGIN_SETTINGS,
  ROUTE_SEED_PHRASE_SETTINGS,
  ROUTE_TOKEN_SALES,
} from '@/popup/router/routeNames';

import PanelItem from '@/popup/components/PanelItem.vue';

export default defineComponent({
  name: 'Settings',
  components: {
    PanelItem,
    IonPage,
    IonContent,
  },
  setup() {
    const { t } = useI18n();
    const { protocolsInUse } = useAccounts();
    const { currentCurrencyInfo } = useCurrencies();
    const { hasSuperheroId, syncSettings } = useSuperheroId();
    const isSyncing = ref(false);
    const { activeNetwork } = useNetworks();
    const { saveErrorLog, isBiometricLoginEnabled } = useUi();

    const activeCurrency = computed(
      () => `${currentCurrencyInfo.value.code.toUpperCase()} (${currentCurrencyInfo.value.symbol.toUpperCase()})`,
    );

    const secureLoginSettingsInfo = computed(() => {
      if (IS_MOBILE_APP) {
        return isBiometricLoginEnabled.value ? t('common.on') : t('common.off');
      }
      return null;
    });

    async function onSyncSettings() {
      try {
        isSyncing.value = true;
        await syncSettings(JSON.stringify({ currency: currentCurrencyInfo.value.code }));
      } finally {
        isSyncing.value = false;
      }
    }

    return {
      IS_MOBILE_APP,
      PROTOCOLS,
      ROUTE_NETWORK_SETTINGS,
      ROUTE_PERMISSIONS_SETTINGS,
      ROUTE_SECURE_LOGIN_SETTINGS,
      ROUTE_SEED_PHRASE_SETTINGS,
      ROUTE_TOKEN_SALES,
      activeNetwork,
      protocolsInUse,
      saveErrorLog,
      secureLoginSettingsInfo,
      isBiometricLoginEnabled,
      activeCurrency,
      hasSuperheroId,
      onSyncSettings,
      isSyncing,
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
