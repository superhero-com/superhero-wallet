<template>
  <DetailsItem
    :label="$t('pages.connectConfirm.unknownSource')"
    warning
    class="no-origin-warning"
  >
    <template #before-label>
      <WarningOutlineIcon class="icon" />
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
.no-origin-warning .icon {
  width: 24px;
  height: 24px;
  padding-right: 4px;
}
</style>
