<template>
  <div
    class="fixed-screen-footer"
    :class="{
      mobile: IS_MOBILE_DEVICE,
      'no-padding-top': noPaddingTop,
    }"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IS_MOBILE_DEVICE } from '@/constants';

export default defineComponent({
  props: {
    noPaddingTop: Boolean,
  },
  setup() {
    return {
      IS_MOBILE_DEVICE,
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
  justify-content: center;
  gap: 8px;
  padding: var(--screen-padding-x);
  padding-top: 24px;

  &.no-padding-top {
    padding-top: 0;
  }

  &.mobile {
    margin-bottom: 20px;
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
