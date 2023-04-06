<template>
  <a
    :href="to"
    target="_blank"
    class="platform-icon"
  >
    <img
      class="platform-icon-image"
      :class="{ grey: disabled }"
      :src="src"
      :alt="alt"
    >
  </a>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    to: { type: String, required: true },
    src: { type: String, required: true },
    alt: { type: String, required: true },
    disabled: Boolean,
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/mixins';

.platform-icon {
  height: 44px;

  .platform-icon-image {
    height: 40px;
    width: 40px;
    transition: all 0.15s ease-in-out;

    &.grey {
      filter: grayscale(1);
      opacity: 0.8;

      &:hover {
        filter: none;
        opacity: 1;
      }
    }
  }
}
</style>
