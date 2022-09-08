<template>
  <Component
    :is="icon"
    v-if="icon"
    class="status-icon"
    :class="status"
    @click="$emit('click', $event)"
  />
</template>

<script>
import TimesCircle from '../../../icons/times-circle.svg?vue-component';
import QuestionCircle from '../../../icons/question-circle.svg?vue-component';
import Alert from '../../../icons/alert.svg?vue-component';
import Warning from '../../../icons/warning.svg?vue-component';
import CheckCircle from '../../../icons/check-circle.svg?vue-component';
import NotSecure from '../../../icons/not-secure.svg?vue-component';
import Globe from '../../../icons/globe.svg?vue-component';

export default {
  props: {
    status: { type: String, required: true },
  },
  computed: {
    icon() {
      switch (this.status) {
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
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.status-icon {
  &.alert,
  &.critical {
    color: variables.$color-error;
  }

  &.warning,
  &.not-secure {
    color: variables.$color-warning;
  }

  &.help,
  &.info {
    color: variables.$color-blue;
  }

  &.success {
    color: variables.$color-green-dark;
  }
}
</style>
