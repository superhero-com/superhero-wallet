<template>
  <div class="info-group">
    <label>{{ label }}</label>
    <template v-if="$slots.default">
      <slot />
    </template>
    <span v-else @click="openTxExplorer">
      {{ value }}
    </span>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import openUrl from '../../utils/openUrl';
import { checkHashType } from '../../utils/helper';

export default {
  props: {
    value: { type: String, default: '' },
    label: { type: String, default: '' },
  },
  computed: mapGetters(['activeNetwork']),
  methods: {
    async openTxExplorer() {
      const { explorerUrl } = this.activeNetwork;
      const { endpoint, valid } = await checkHashType(this.value);
      if (valid) {
        const url = `${explorerUrl}/${endpoint}/${this.value}`;
        openUrl(url, true);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.info-group {
  text-align: left;
  margin: 20px 0;

  & > label {
    display: block;
    padding: 10px 0;
  }

  & > span {
    color: $accent-color;
    font-size: 11px;
    display: inline-block;
    width: 300px;
    white-space: nowrap;
    letter-spacing: -0.3px;
    cursor: pointer;
  }
}
</style>
