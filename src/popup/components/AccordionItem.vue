<template>
  <div class="accordion-item">
    <a
      class="accordion-label"
      data-cy="accordion-item-label"
      @click="toggleVisibility()"
    >
      <ChevronDownIcon
        class="accordion-label-chevron"
        :class="{ rotated: isVisible }"
      />
      <span class="accordion-label-text">{{ label }}</span>
    </a>

    <Transition name="fade-transition">
      <div
        v-if="isVisible"
        data-cy="accordion-item-content"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

import ChevronDownIcon from '../../icons/chevron-down.svg?vue-component';

export default defineComponent({
  components: {
    ChevronDownIcon,
  },
  props: {
    label: { type: String, required: true },
  },
  setup() {
    const isVisible = ref(false);

    function toggleVisibility() {
      isVisible.value = !isVisible.value;
    }

    return {
      isVisible,
      toggleVisibility,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.accordion-item {
  margin-bottom: 8px;

  .accordion-label {
    display: flex;
    align-items: center;
    margin-block: 5px;
    cursor: pointer;

    .accordion-label-chevron {
      width: 14px;
      height: 14px;
      margin-right: 8px;
      color: $color-grey-border-avatar;
      transition: 0.3s;

      &:not(.rotated) {
        transform: rotate(-90deg);
      }
    }

    .accordion-label-text {
      font-size: 14px;
      font-weight: 500;
      text-transform: uppercase;
      color: $color-success;
    }
  }
}
</style>
