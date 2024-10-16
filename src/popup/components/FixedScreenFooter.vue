<template>
  <div
    class="fixed-screen-footer"
    :class="{
      mobile: IS_MOBILE_DEVICE,
    }"
  >
    <div class="content">
      <slot />
    </div>
    <div class="padding" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IS_MOBILE_DEVICE } from '@/constants';

export default defineComponent({
  setup() {
    return {
      IS_MOBILE_DEVICE,
    };
  },
});

</script>

<style lang="scss" scoped>
.fixed-screen-footer {
  --footer-height: 80px;

  .content {
    position: fixed;
    bottom: 0;
    margin: auto 0 0; // Moves the footer to the bottom of the container
    display: flex;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: var(--screen-padding-x);
    padding-top: 24px;

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

  .padding {
    height: var(--footer-height);
  }

  &.mobile {
    --footer-height: 100px;

    .content {
      margin-bottom: 20px;
    }
  }
}
</style>
