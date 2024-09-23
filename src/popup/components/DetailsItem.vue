<template>
  <div
    class="details-item"
    :class="{
      expandable,
      expanded,
      warning,
    }"
  >
    <Component
      :is="expandable ? 'BtnPlain' : 'div'"
      class="text-label label"
      @click="toggleExpanded()"
    >
      {{ label }}
      <span
        v-if="$slots.label"
        :class="{ indent: label }"
      >
        <slot name="label" />
      </span>

      <ChevronDownIcon
        v-if="expandable"
        class="expand-arrow"
      />
    </Component>

    <Transition name="fade-transition">
      <div
        v-if="expanded"
        class="value"
        :class="{ small, highlight }"
      >
        <slot>
          {{ value }}
          <span
            v-if="secondary"
            class="secondary"
            v-text="secondary"
          />
          <slot name="value" />
        </slot>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import ChevronDownIcon from '../../icons/chevron-down.svg?vue-component';
import BtnPlain from './buttons/BtnPlain.vue';

export default defineComponent({
  name: 'DetailsItem',
  components: {
    ChevronDownIcon,
    BtnPlain,
  },
  props: {
    label: { type: String, default: '' },
    value: { type: [String, Number, Array], default: '' },
    secondary: { type: String, default: '' },
    expandable: Boolean,
    small: Boolean,
    highlight: Boolean,
    warning: Boolean,
  },
  setup(props) {
    const expanded = ref(!props.expandable);

    function toggleExpanded() {
      if (props.expandable) {
        expanded.value = !expanded.value;
      }
    }

    return {
      expanded,
      toggleExpanded,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.details-item {
  margin-top: 12px;

  .label {
    display: flex;
    align-items: center;
    margin-bottom: 4px;

    .indent {
      margin-left: 8px;
    }

    .expand-arrow {
      width: 14px;
      height: 14px;
      color: $color-grey-dark;
      opacity: 0.7;
      margin-left: 8px;
      transition: inherit;
    }
  }

  .value {
    @extend %face-sans-15-regular;

    letter-spacing: 0.05em;
    color: rgba($color-white, 0.85);
    margin-bottom: 8px;

    .secondary {
      color: $color-grey-light;
      margin-left: 4px;
      white-space: nowrap;
    }

    &.small {
      @extend %face-mono-10-medium;
    }

    &.highlight {
      color: $color-danger;
    }
  }

  &.expandable {
    > .label {
      &:hover {
        color: rgba($color-white, 0.8);

        .expand-arrow {
          opacity: 1;
        }
      }
    }

    > .value {
      margin-top: 10px;
      padding: 8px 12px;
      background: $color-border;
      border: 1px solid $color-border-hover;
      border-radius: 6px;
    }

    &.expanded {
      > .label {
        .expand-arrow {
          transform: scaleY(-1);
        }
      }
    }
  }

  &.warning {
    .label {
      color: $color-warning;
    }

    .value {
      color: rgba($color-warning, 0.85);
    }
  }
}
</style>
