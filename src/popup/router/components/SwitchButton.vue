<template>
  <div :class="['switch-button', { disabled: disabled, active: !!value }]">
    <div class="label">
      {{ label }}
    </div>
    <label class="switch">
      <input
        v-model="active"
        type="checkbox"
        :disabled="disabled"
      >
      <span class="slider round" />
    </label>
  </div>
</template>

<script>
export default {
  props: {
    value: { type: Boolean },
    label: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
  },
  computed: {
    active: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit('input', value);
      },
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables.scss';
@use '../../../styles/typography.scss';

.switch-button {
  width: 100%;
  display: inline-flex;
  justify-content: space-between;
  align-items: center;

  &.disabled {
    opacity: 0.75;
  }

  .label {
    color: rgba(variables.$color-white, 0.5);

    @extend %face-sans-15-regular;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 20px;

    input {
      opacity: 0;
      width: 0;
      height: 0;

      &:checked + .slider {
        background-color: variables.$color-primary;

        &::before {
          -webkit-transform: translateX(16px);
          -ms-transform: translateX(16px);
          transform: translateX(16px);
        }
      }
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(variables.$color-white, 0.15);
      -webkit-transition: 0.4s;
      transition: 0.4s;

      &::before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 2px;
        bottom: 2px;
        background-color: rgba(variables.$color-white, 0.75);
        -webkit-transition: 0.4s;
        transition: 0.4s;
      }
      &.round {
        border-radius: 12px;

        &::before {
          border-radius: 50%;
        }
      }
    }
  }

  &.active {
    .label {
      color: rgba(variables.$color-white, 1);
    }

    .switch .slider::before {
      background-color: rgba(variables.$color-white, 1);
    }
  }
}
</style>
