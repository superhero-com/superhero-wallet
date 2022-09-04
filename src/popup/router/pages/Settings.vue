<template>
  <div class="settings">
    <PanelItem
      :to="{ name: 'settings-security' }"
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
      v-if="UNFINISHED_FEATURES"
      to="/settings/currency"
      :title="$t('pages.titles.currency')"
      info="USD ($)"
    />
    <PanelItem
      v-if="UNFINISHED_FEATURES"
      :to="{ name: 'settings-errors-log' }"
      :title="$t('pages.settings.tabSaveErrorLog')"
      :info="saveErrorLog ? 'On' : 'Off'"
      @click="setSaveErrorLog(!saveErrorLog)"
    />
    <PanelItem
      v-if="UNFINISHED_FEATURES"
      :to="{ name: 'settings-reset-wallet' }"
      :title="$t('pages.settings.tabRemoveAccount')"
      @click="requestResetting"
    />
  </div>
</template>

<script>
import {
  mapState, mapMutations, mapActions, mapGetters,
} from 'vuex';
import PanelItem from '../components/PanelItem.vue';

export default {
  components: { PanelItem },
  data: () => ({
    UNFINISHED_FEATURES: process.env.UNFINISHED_FEATURES,
  }),
  computed: {
    ...mapState(['saveErrorLog']),
    ...mapGetters(['activeNetwork']),
  },
  methods: {
    ...mapMutations(['setSaveErrorLog']),
    ...mapActions(['requestResetting']),
  },
};
</script>
