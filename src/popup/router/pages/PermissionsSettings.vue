<template>
  <div class="popup">
    <Panel v-if="hosts.length">
      <PanelItem
        v-for="host in hosts"
        :key="host"
        class="host"
        :to="{ name: 'permissions-details', params: { host } }"
        :title="host"
      />
    </Panel>
    <div v-else>{{ $t('pages.permissions.empty') }}</div>
  </div>
</template>

<script>
import Panel from '../components/Panel';
import PanelItem from '../components/PanelItem';

export default {
  components: {
    Panel,
    PanelItem,
  },
  computed: {
    hosts() {
      return Object.keys(this.$store.state.permissions);
    },
  },
};
</script>
