<template>
  <a
    class="copy-text"
    :class="{ 'has-icon': !hideIcon, disabled }"
    @click="copyText($event)"
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
  setup(props) {
    const { copied: copiedLocally, copy } = useCopy();

    function copyText(event: MouseEvent) {
      if (!props.disabled) {
        copy(props.value);
        event.preventDefault();
      }
    }

    return {
      copiedLocally,
      copyText,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.copy-text {
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
    background-color: variables.$color-bg-4;
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
