<template>
  <a
    class="copy-text"
    :class="{ 'has-icon': !hideIcon, disabled }"
    :role="isInteractive() ? 'button' : undefined"
    :tabindex="isInteractive() ? 0 : undefined"
    @click="copyText($event)"
    @keydown="handleKeydown"
  >
    <div
      v-if="copied || copiedLocally"
      class="copied"
    >
      <CopyOutlinedIcon class="copy-icon-copied" />
      {{ copiedText || $t('common.addressCopied') }}
    </div>

    <slot>{{ value }}</slot>

    <CopyOutlinedIcon
      v-if="!hideIcon && !disabled"
      class="copy-icon-indicator"
    />
  </a>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useCopy } from '../../composables';
import CopyOutlinedIcon from '../../icons/copy-outlined.svg?vue-component';

export default defineComponent({
  name: 'CopyText',
  components: {
    CopyOutlinedIcon,
  },
  props: {
    value: { type: String, default: null },
    copiedText: { type: String, default: '' },
    copied: Boolean,
    disabled: Boolean,
    hideIcon: Boolean,
  },
  setup(props, { attrs }) {
    const { copied: copiedLocally, copy } = useCopy();

    /**
     * A caller's click handler acts even when the component does not copy.
     * The root is not a button element, so the text stays selectable.
     */
    function isInteractive() {
      return !props.disabled || !!attrs.onClick;
    }

    function copyText(event: MouseEvent) {
      if (!props.disabled) {
        copy(props.value);
        event.preventDefault();
      }
    }

    function handleKeydown(event: KeyboardEvent) {
      // A link inside handles its own keys
      if (event.target !== event.currentTarget || event.repeat) {
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        // Runs this component's and the caller's click handlers, like a mouse click
        (event.currentTarget as HTMLElement).click();
      }
    }

    return {
      copiedLocally,
      isInteractive,
      copyText,
      handleKeydown,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.copy-text {
  @include mixins.focus-ring;

  position: relative;
  display: inline-block;
  cursor: pointer;
  color: inherit;

  .copy-icon-indicator,
  .copy-icon-copied {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
  }

  .copy-icon-copied {
    margin-left: 2px;
  }

  .copied {
    @extend %face-sans-12-regular;

    @include mixins.dashed-border;

    position: absolute;
    z-index: 1;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    background-color: $color-bg-4;
    text-transform: uppercase;
  }

  &.has-icon {
    padding-right: 24px;

    .copy-icon-indicator {
      position: absolute;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
    }
  }

  &.disabled {
    cursor: inherit;
  }
}
</style>
