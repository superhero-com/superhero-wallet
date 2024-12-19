<template>
  <DetailsItem
    warning
    class="no-origin-warning"
  >
    <template #label>
      <div class="label">
        <WarningOutlineIcon class="icon" />
        {{ $t('pages.connectConfirm.unknownSource') }}
      </div>
    </template>

    <template #value>
      <div>
        <p>{{ $t('unknownDapp.request', { action }) }}</p>
        <p>{{ $t('unknownDapp.warning', { warning }) }}</p>
      </div>
    </template>
  </DetailsItem>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import DetailsItem from './DetailsItem.vue';

import WarningOutlineIcon from '../../icons/warning-outline.svg?vue-component';

export default defineComponent({
  components: {
    DetailsItem,
    WarningOutlineIcon,
  },
  props: {
    action: { type: String, required: true },
    warning: { type: String, required: true },
  },
});
</script>

<style lang="scss" scoped>
.no-origin-warning {
  .label {
    display: flex;
    align-items: center;
    gap: 8px;

    .icon {
      width: 24px;
      height: 24px;
      padding-right: 4px;
    }
  }
}
</style>
