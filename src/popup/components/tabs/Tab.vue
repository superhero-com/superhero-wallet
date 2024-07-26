<template>
  <BtnPlain
    v-bind="$attrs"
    class="tab"
    :class="[{ active }, exactPath ? 'exact' : 'not-exact']"
    :text="text"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import BtnPlain from '../buttons/BtnPlain.vue';

export default defineComponent({
  components: {
    BtnPlain,
  },
  props: {
    text: { type: String, required: true },
    active: Boolean,
    exactPath: Boolean,
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.tab {
  @extend %face-sans-14-medium;

  @include mixins.flex(center, center, row);

  flex: 1 1 0;
  padding: 4px 10px;
  border-radius: $border-radius-interactive - 3px;
  color: rgba($color-white, 0.75);
  transition: all 100ms;

  &:hover {
    color: $color-white;
  }

  &.router-link-active {
    &.not-exact {
      background-color: rgba($color-white, 0.15);
      color: $color-white;
    }

    &.exact {
      &.active {
        background-color: transparent;
        color: $color-white;
      }
    }
  }

  &.router-link-exact-active,
  &.active {
    background-color: rgba($color-white, 0.15);
    color: $color-white;
    font-weight: 600;
  }
}
</style>
