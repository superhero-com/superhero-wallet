<template>
  <div
    class="icon-boxed"
    :class="{
      'bg-colored': bgColored,
      'icon-padded': iconPadded,
      'outline-colored': outlineColored,
      'outline-solid': outlineSolid,
      'bg-dimmed': bgDimmed,
      transparent,
    }"
  >
    <div class="icon-boxed-inner">
      <slot>
        <Component
          :is="icon"
          class="icon"
        />
      </slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    icon: { type: Object, default: null },
    /** Makes the icon background even more transparent */
    bgDimmed: Boolean,
    /** Makes the icon background to use the same color as the icon */
    bgColored: Boolean,
    /** Makes the icon outline to use the same color as the icon */
    outlineColored: Boolean,
    /** Makes the outline color non transparent */
    outlineSolid: Boolean,
    /** Makes the icon slightly smaller - useful with non circle icons */
    iconPadded: Boolean,
    transparent: Boolean,
  },
});
</script>

<style lang="scss">
@use '@/styles/variables' as *;

.icon-boxed {
  --inner-space-size: 4px; // Empty space between the outline and the icon (and the bg)

  --icon-size: 40px;
  --icon-padding: 0; // Increasing this makes the icon shape smaller in the bg circle
  --icon-bg-color: var(--screen-bg-color);

  --outline-color: #{$color-grey-border};
  --outline-size: 4px;
  --outline-opacity: 0.4;

  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--outline-size);
  border-radius: 50%;
  background-color: var(--screen-bg-color);

  // Outline
  &::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 0;
    border: var(--outline-size) solid var(--outline-color);
    border-radius: inherit;
    opacity: var(--outline-opacity);
  }

  // Actual icon wrapper with background
  &-inner {
    position: relative;
    box-sizing: content-box;
    width: var(--icon-size);
    height: var(--icon-size);
    border-radius: inherit;
    overflow: hidden;
    margin: var(--inner-space-size);

    // Icon background
    // Pseudo element used for the possibility of setting the opacity on the solid bg color
    &::before {
      content: '';
      position: absolute;
      z-index: -1;
      inset: 0;
      background-color: var(--icon-bg-color);
      opacity: 0.4;
    }

    > *,
    .icon {
      width: 100%;
      height: 100%;
      padding: var(--icon-padding);
    }
  }

  &.bg-dimmed .icon-boxed-inner::before {
    opacity: 0.1;
  }

  &.icon-padded {
    --icon-padding: 5px;
  }

  &.outline-solid {
    --outline-opacity: 1;
  }

  &.outline-colored {
    --outline-color: currentColor;
  }

  &.bg-colored {
    --icon-bg-color: currentColor;
  }

  &.transparent {
    background-color: transparent;
  }
}
</style>
