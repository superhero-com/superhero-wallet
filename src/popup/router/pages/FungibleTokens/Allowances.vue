<template>
  <div class="popup">
    <Panel>
      <PanelItem
        :to="{ name: 'manage-allowances', params: { type: 'create' } }"
        :title="$t('pages.allowances.create-allowance')"
        :info="$t('pages.allowances.create-allowance-info')"
      />

      <PanelItem
        :to="{ name: 'manage-allowances', params: { type: 'transfer' } }"
        :title="$t('pages.allowances.transfer-allowance')"
        :info="$t('pages.allowances.transfer-allowance-info')"
      />

      <PanelItem
        to="/all-allowances"
        :title="$t('pages.allowances.all-allowances')"
        :info="$t('pages.allowances.all-allowances-info')"
      />
    </Panel>
  </div>
</template>

<script>
import Panel from '../../components/Panel';
import PanelItem from '../../components/PanelItem';

export default {
  components: { Panel, PanelItem },
};
</script>