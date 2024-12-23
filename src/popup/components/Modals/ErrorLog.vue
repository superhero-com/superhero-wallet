<template>
  <Default
    v-bind="{ ...$attrs, resolve }"
    :title="title"
    :msg="msg"
    icon="critical"
    text-center
    class="error-modal"
  >
    <template #footer>
      <BtnMain
        v-if="saveErrorLogEnabled"
        variant="muted"
        class="center-button"
        :text="$t('pages.errors-log-settings.exportErrorLog')"
        :icon="ExportIcon"
        @click="exportErrorLog"
      />
      <BtnMain
        class="center-button"
        :text="$t('common.ok')"
        @click="resolve"
      />
    </template>
  </Default>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import type { ResolveCallback } from '@/types';
import Logger from '@/lib/logger';

import Default from '@/popup/components/Modals/Default.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';

import ExportIcon from '@/icons/export-address-book.svg?vue-component';

export default defineComponent({
  components: {
    Default,
    BtnMain,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    title: { type: String, default: '' },
    msg: { type: String, default: '' },
  },
  setup({ resolve }) {
    const saveErrorLogEnabled = computed(() => Logger.saveErrorLog.value);

    function exportErrorLog() {
      Logger.exportErrorLog();
      resolve();
    }

    return {
      saveErrorLogEnabled,
      exportErrorLog,
      ExportIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
.error-modal {
  .center-button {
    width: auto;
    padding: 0 24px;
  }
}
</style>
