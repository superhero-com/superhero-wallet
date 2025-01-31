<template>
  <div
    class="fixed-screen-footer"
    :class="{
      mobile: IS_MOBILE_DEVICE,
      'has-status': status && !modalsOpen.length,
    }"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IS_MOBILE_DEVICE } from '@/constants';
import { useModals } from '@/composables';
import { useConnectionStatus } from '@/composables/connectionStatus';

export default defineComponent({
  setup() {
    const { status } = useConnectionStatus();
    const { modalsOpen } = useModals();

    return {
      IS_MOBILE_DEVICE,
      status,
      modalsOpen,
    };
  },
});

</script>

<style lang="scss" scoped>
.fixed-screen-footer {
  position: sticky;
  bottom: 0;
  margin: auto 0 0; // Moves the footer to the bottom of the container
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  padding: var(--screen-padding-x);
  padding-top: 24px;
  transition: all 0.15s linear;

  &.mobile {
    margin-bottom: 20px;
  }

  &.has-status {
    padding-bottom: 50px;
  }

  // Semi-transparent and gradient-like cover under the buttons
  &::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 0;
    background-color: var(--screen-bg-color);
    top: 40px;
    box-shadow: 0 -30px 20px var(--screen-bg-color);
    opacity: 0.9;
  }

  // Make the footer bottom rounded corners the same as the container
  &,
  &::before {
    border-bottom-left-radius: inherit;
    border-bottom-right-radius: inherit;
  }
}
</style>
