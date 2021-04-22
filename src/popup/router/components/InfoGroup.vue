<template>
  <div class="info-group">
    <label>{{ label }}</label>
    <template v-if="$slots.default">
      <slot />
    </template>
    <a
      v-else
      :href="explorerPath"
      target="_blank"
    >
      {{ value }}
    </a>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  props: {
    value: { type: String, default: '' },
    label: { type: String, default: '' },
  },
  computed: mapState({
    explorerPath(state, { getExplorerPath }) {
      return getExplorerPath(this.value);
    },
  }),
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.info-group {
  text-align: left;
  margin: 20px 0;

  label {
    display: block;
    padding: 10px 0;
  }

  a {
    color: $color-green;
    font-size: 11px;
    letter-spacing: -0.3px;
  }
}
</style>
