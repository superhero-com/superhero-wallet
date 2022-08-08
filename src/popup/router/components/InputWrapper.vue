<template>
  <div
    class="input-wrapper"
    :style="wrapperCssProps"
  >
    <label
      v-if="label || $slots.label"
      class="label"
    >
      {{ label }}
      <slot name="label" />
    </label>
    <div class="main-wrapper">
      <main
        :class="{ error, warning, plain }"
        data-cy="input-wrapper"
      >
        <slot
          v-if="!error && !warning"
          name="left"
        />
        <StatusIcon
          v-else
          :status="error && 'alert' || warning && 'warning'"
        />
        <slot :id="_uid" />
        <slot name="right" />
      </main>
      <slot name="buttons" />
    </div>
    <div
      v-if="error && errorMessage || warning && warningMessage"
      :class="['message', { error, warning }]"
    >
      {{ error ? errorMessage : warningMessage }}
    </div>
  </div>
</template>

<script>
import StatusIcon from './StatusIcon.vue';

export default {
  components: { StatusIcon },
  props: {
    error: Boolean,
    errorMessage: { type: String, default: '' },
    warning: Boolean,
    warningMessage: { type: String, default: '' },
    label: { type: String, default: '' },
    plain: Boolean,
    height: { type: String, default: '40px' },
  },
  methods: {
    wrapperCssProps() {
      return {
        '--height': this.height,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.input-wrapper {
  .label {
    margin: 8px 0;
    display: block;

    @extend %face-sans-15-medium;

    color: variables.$color-dark-grey;
    text-align: left;
  }

  .main-wrapper {
    display: flex;
    width: 312px;

    main {
      display: flex;
      align-items: center;
      flex-grow: 1;
      padding: 8px 16px;
      height: var(--height);
      background-color: variables.$color-bg-2;
      border: 1px solid transparent;
      border-left: 0;
      border-right: 0;
      border-radius: 6px;

      &:not(:only-child) {
        border-radius: 6px 2px 2px 6px;
      }

      &:focus-within {
        border-color: variables.$color-blue;
        background-color: variables.$color-black;
      }

      &.error,
      &.error.plain {
        border-color: variables.$color-error;
      }

      &.warning {
        border-color: variables.$color-warning;
      }

      &.plain {
        height: 24px;
        background: transparent;
        border-top: none;
        padding: 0;
        border-radius: unset;
        border-color: variables.$color-blue;
      }
    }

    main,
    button {
      ::v-deep svg {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }
    }

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      margin-left: 1px;
      width: 40px;
      background-color: variables.$color-bg-2;
      border-radius: 2px;
      cursor: pointer;

      &:last-child {
        border-radius: 2px 6px 6px 2px;
      }

      &:hover {
        color: variables.$color-green;
        background-color: variables.$color-border;
      }
    }
  }

  .message {
    margin-top: 9px;

    @extend %face-sans-12-regular;

    text-align: left;

    &.error {
      color: variables.$color-error;
    }

    &.warning {
      color: variables.$color-warning;
    }
  }
}
</style>
