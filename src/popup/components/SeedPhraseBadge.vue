<template>
  <BtnPlain
    :class="['seed-phrase-badge', { selected, editable }]"
    v-bind="$attrs"
    @click="$emit('click', $event)"
  >
    <div>{{ text }}</div>
    <CloseIcon
      v-if="editable"
      class="close-icon"
    />
  </BtnPlain>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import BtnPlain from './buttons/BtnPlain.vue';
import CloseIcon from '../../icons/close.svg?vue-component';

export default defineComponent({
  components: {
    BtnPlain,
    CloseIcon,
  },
  props: {
    selected: Boolean,
    editable: Boolean,
    text: { type: String, required: true },
  },
  emits: ['click'],
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.seed-phrase-badge {
  @extend %face-sans-16-light;

  display: inline-flex;
  align-items: center;
  height: 30px;
  border: 1px solid rgba($color-white, 0.44);
  border-radius: 4px;
  padding: 4px 6px;
  margin-right: 4px;
  margin-bottom: 8px;
  color: $color-white;
  background-color: $color-black;
  cursor: pointer;
  letter-spacing: 0.1rem;
  line-height: 100%;

  &.selected {
    opacity: 0.44;
    cursor: unset;
    background: transparent;
    border-color: $color-grey-light;
    color: $color-white;
  }

  &.editable {
    background: rgba($color-black, 0.25);
    border: none;

    .close-icon {
      color: rgba($color-white, 0.44);
      width: 24px;
      height: 24px;
    }
  }
}
</style>
