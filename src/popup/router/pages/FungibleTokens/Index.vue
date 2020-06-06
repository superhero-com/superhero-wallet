<template>
  <div class="popup">
    <Panel>
      <PanelItem
        to="/add-token"
        :title="$t('pages.fungible-tokens.add')"
        :info="$t('pages.fungible-tokens.add-info')"
      />

      <PanelItem
        to="/deploy-token"
        :title="$t('pages.fungible-tokens.deploy')"
        :info="$t('pages.fungible-tokens.deploy-info')"
      />

      <PanelItem
        to="/mint-token"
        :title="$t('pages.fungible-tokens.mint')"
        :info="$t('pages.fungible-tokens.mint-info')"
      />

      <PanelItem
        to="/allowances"
        :title="$t('pages.fungible-tokens.allowances')"
        :info="$t('pages.fungible-tokens.allowances-info')"
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
