<template>
  <div class="popup">
    <Panel>
      <PanelItem
        to="/generalSettings"
        :title="$t('pages.settings.tabGeneral')"
        :info="$t('pages.settings.tabGeneralsmall')"
      />
      <PanelItem
        to="/securitySettings"
        :title="$t('pages.settings.tabSecurity')"
        :info="$t('pages.settings.tabSecuritysmall')"
      />
      <PanelItem
        to="/networks"
        :title="$t('pages.appVUE.networks')"
        :info="$t('pages.settings.tabNetworksSmall')"
      />
      <PanelItem
        @click="removeAccount"
        :title="$t('pages.settings.tabRemoveAccount')"
        :info="$t('pages.settings.tabRemoveAccountSmall')"
      />

      <PanelItem
        :title="$t('pages.settings.tabSaveErrorLog')"
        :info="$t('pages.settings.tabSaveErrorLogSmall')"
      >
        <CheckBox
          slot="content"
          :value="saveErrorLog"
          name="saveErrorLog"
          type="checkbox"
          @input="val => $store.commit('setSaveErrorLog', val)"
        />
      </PanelItem>
    </Panel>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import removeAccountMixin from '../../../mixins/removeAccount';
import CheckBox from '../components/CheckBox';
import Panel from '../components/Panel';
import PanelItem from '../components/PanelItem';

export default {
  mixins: [removeAccountMixin],
  components: { CheckBox, Panel, PanelItem },
  computed: mapState(['saveErrorLog']),
};
</script>
