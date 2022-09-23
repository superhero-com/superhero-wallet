<template>
  <BtnPlain
    v-bind="$attrs"
    class="btn-pill"
    :to="to"
    :text="text"
  />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import BtnPlain from './BtnPlain.vue';

export default defineComponent({
  components: {
    BtnPlain,
  },
  props: {
    to: { type: [String, Object], default: null },
    text: { type: String, required: true },
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/mixins';
@use '../../../styles/typography';

.btn-pill {
  @extend %face-sans-14-regular;

  @include mixins.flex(center, center, row);

  padding: 2px 10px;
  gap: 4px;
  border-radius: 20px;
  background-color: rgba(variables.$color-white, 0.08);
  color: rgba(variables.$color-white, 0.5);

  &.router-link-active {
    background-color: rgba(variables.$color-white, 0.15);
    color: variables.$color-white;
  }
}
</style>
