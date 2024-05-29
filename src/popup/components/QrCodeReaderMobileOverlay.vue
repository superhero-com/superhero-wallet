<template>
  <div
    v-if="isMobileQrScannerVisible"
    class="qr-code-reader-mobile-overlay"
  >
    <button
      id="camera-close-btn"
      class="close-button"
      type="button"
    >
      <CloseIcon />
    </button>

    <ProgressBar
      v-if="scanProgress >= 0"
      class="qr-progress-bar"
      :progress="scanProgress"
      :text="$t('modals.qrCodeReader.scanningProgress')"
      show-text
      is-big
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useUi } from '@/composables';
import ProgressBar from '@/popup/components/ProgressBar.vue';
import CloseIcon from '@/icons/close.svg?vue-component';

export default defineComponent({
  components: {
    ProgressBar,
    CloseIcon,
  },
  setup() {
    const { isMobileQrScannerVisible, scanProgress } = useUi();

    return {
      isMobileQrScannerVisible,
      scanProgress,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.qr-code-reader-mobile-overlay {
  height: 100%;

  .close-button {
    position: absolute;
    top: calc(10px + env(safe-area-inset-top));
    right: 10px;
    width: 28px;
    height: 28px;
    z-index: 10;
  }

  .qr-progress-bar {
    position: absolute;
    bottom: calc(10px + env(safe-area-inset-bottom));
    z-index: 10;
    margin: 0 10px;
    width: calc(100% - 20px);
  }
}
</style>
