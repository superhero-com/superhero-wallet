<template>
  <Component
    :is="icon"
    v-if="icon"
    class="status-icon"
    :class="status"
    @click="$emit('click', $event)"
  />
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from '@vue/composition-api';
import { StatusIconType } from '../../types';
import TimesCircle from '../../icons/times-circle.svg?vue-component';
import QuestionCircle from '../../icons/question-circle.svg?vue-component';
import Alert from '../../icons/alert.svg?vue-component';
import Warning from '../../icons/warning.svg?vue-component';
import CheckCircle from '../../icons/check-circle.svg?vue-component';
import NotSecure from '../../icons/not-secure.svg?vue-component';
import Globe from '../../icons/globe.svg?vue-component';

export default defineComponent({
  props: {
    status: { type: String as PropType<StatusIconType>, required: true },
  },
  setup(props) {
    const icon = computed(() => {
      switch (props.status) {
        case 'critical':
          return TimesCircle;
        case 'alert':
          return Alert;
        case 'warning':
          return Warning;
        case 'info':
          return QuestionCircle;
        case 'success':
          return CheckCircle;
        case 'not-secure':
          return NotSecure;
        case 'help':
          return Globe;
        default:
          return null;
      }
    });

    return {
      icon,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

.status-icon {
  &.alert,
  &.critical {
    color: variables.$color-danger;
  }

  &.warning,
  &.not-secure {
    color: variables.$color-warning;
  }

  &.help,
  &.info {
    color: variables.$color-primary;
  }

  &.success {
    color: variables.$color-success-dark;
  }
}
</style>
