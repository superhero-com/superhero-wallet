<template>
  <DetailsItem
    v-if="payload && payload.length"
    class="payload-details"
    :class="{ 'has-actions': Boolean($slots.default) }"
    :label="$t('modals.send.payload')"
    :value="payload"
  >
    <template
      v-if="$slots.default"
      #label
    >
      <slot />
    </template>
  </DetailsItem>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import DetailsItem from './DetailsItem.vue';

export default defineComponent({
  name: 'PayloadDetails',
  components: { DetailsItem },
  props: {
    payload: { type: String, default: '' },
  },
});
</script>

<style lang="scss" scoped>
.payload-details {
  &:deep(.value) {
    word-break: break-all;
  }

  &.has-actions:deep(.label) {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
