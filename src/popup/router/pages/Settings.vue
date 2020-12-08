<template>
  <div class="popup">
    <Panel>
      <PanelItem
        to="/settings/language"
        :title="$t('pages.settings.tabGeneral')"
        :info="$t('pages.settings.tabGeneralsmall')"
      />
      <PanelItem
        to="/settings/security"
        :title="$t('pages.settings.tabSecurity')"
        :info="$t('pages.settings.tabSecuritysmall')"
      />
      <PanelItem
        to="/settings/networks"
        :title="$t('pages.titles.networks')"
        :info="$t('pages.settings.tabNetworksSmall')"
      />
      <PanelItem
        to="/settings/permissions"
        :title="$t('pages.titles.permissionsSettings')"
        :info="$t('pages.settings.tabPermissionsSettingsSmall')"
      />
      <PanelItem
        @click="requestResetting"
        :title="$t('pages.settings.tabRemoveAccount')"
        :info="$t('pages.settings.tabRemoveAccountSmall')"
      />
      <PanelItem
        :title="$t('pages.settings.tabSaveErrorLog')"
        :info="$t('pages.settings.tabSaveErrorLogSmall')"
      >
        <CheckBox slot="content" :value="saveErrorLog" @input="setSaveErrorLog" />
      </PanelItem>
    </Panel>
  </div>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex';
import CheckBox from '../components/CheckBox';
import Panel from '../components/Panel';
import PanelItem from '../components/PanelItem';

export default {
  components: { CheckBox, Panel, PanelItem },
  computed: mapState(['saveErrorLog']),
  methods: {
    ...mapMutations(['setSaveErrorLog']),
    ...mapActions(['requestResetting']),
  },
};
</script>
