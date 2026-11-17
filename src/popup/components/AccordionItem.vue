<template>
  <div
    class="accordion-item"
    :class="`variant-${variant}`"
  >
    <button
      type="button"
      class="accordion-label"
      data-cy="accordion-item-label"
      :aria-expanded="isVisible"
      :aria-controls="isVisible ? contentId : undefined"
      @click="toggleVisibility()"
    >
      <ChevronDownIcon
        class="accordion-label-chevron"
        :class="{ rotated: isVisible }"
      />
      <span class="accordion-label-text">{{ label }}</span>
    </button>

    <Transition name="fade-transition">
      <div
        v-if="isVisible"
        :id="contentId"
        data-cy="accordion-item-content"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  useId,
} from 'vue';

import ChevronDownIcon from '../../icons/chevron-down.svg?vue-component';

export const ACCORDION_ITEM_VARIANT = [
  'default',
  'muted',
] as const;

export type AccordionItemVariant = typeof ACCORDION_ITEM_VARIANT[number];

export default defineComponent({
  components: {
    ChevronDownIcon,
  },
  props: {
    label: { type: String, required: true },
    variant: {
      type: String as PropType<AccordionItemVariant>,
      validator: (value: AccordionItemVariant) => ACCORDION_ITEM_VARIANT.includes(value),
      default: ACCORDION_ITEM_VARIANT[0],
    },
  },
  setup() {
    const contentId = useId();
    const isVisible = ref(false);

    function toggleVisibility() {
      isVisible.value = !isVisible.value;
    }

    return {
      contentId,
      isVisible,
      toggleVisibility,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/mixins';

.accordion-item {
  margin-bottom: 8px;

  .accordion-label {
    @include mixins.focus-ring;

    display: flex;
    align-items: center;
    // A button shrinks to its content and Ionic sets its line-height to 1
    width: 100%;
    margin-block: 5px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    line-height: inherit;
    color: inherit;
    text-align: start;
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

  &.variant {
    &-muted {
      .accordion-label {
        .accordion-label-text {
          color: rgba($color-white, 0.75);
        }

        &:hover {
          .accordion-label-text {
            color: $color-white;
          }
        }
      }
    }
  }
}
</style>
