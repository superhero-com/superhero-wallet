<template>
  <div class="settings">
    <PanelItem
      :to="{ name: 'settings-seed-phrase' }"
      :title="$t('pages.index.seedPhrase')"
    />
    <PanelItem
      :to="{ name: 'network-settings' }"
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
      :title="$t('pages.settings.tabGeneral')"
    />
    <PanelItem
      :to="{ name: 'settings-currency' }"
      :title="$t('pages.titles.currency')"
      :info="activeCurrency"
    />
    <PanelItem
      :to="{ name: 'settings-errors-log' }"
      :title="$t('pages.settings.tabSaveErrorLog')"
      :info="saveErrorLog ? 'On' : 'Off'"
    />
    <PanelItem
      :to="{ name: 'settings-reset-wallet' }"
      :title="$t('pages.settings.tabRemoveAccount')"
    />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import PanelItem from '../components/PanelItem.vue';
import { CURRENCIES } from '../utils/constants';

export default {
  components: { PanelItem },
  computed: {
    ...mapState(['saveErrorLog', 'current']),
    ...mapGetters(['activeNetwork']),
    activeCurrency() {
      if (!this.current || !this.current.currency) return null;
      const currency = CURRENCIES.find((_currency) => _currency.code === this.current.currency);
      if (!currency) return null;
      return `${String(currency.code).toUpperCase()} (${String(currency.symbol).toUpperCase()})`;
    },
  },
};
</script>

<style lang="scss" scoped>
.settings {
  overflow: hidden;
}
</style>
