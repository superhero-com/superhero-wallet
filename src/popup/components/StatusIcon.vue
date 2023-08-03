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
import {
  Component,
  computed,
  defineComponent,
  PropType,
} from 'vue';
import type { StatusIconType } from '@/types';
import { ALLOWED_ICON_STATUSES } from '@/constants';

import TimesCircle from '../../icons/times-circle.svg?vue-component';
import QuestionCircle from '../../icons/question-circle.svg?vue-component';
import Alert from '../../icons/alert.svg?vue-component';
import Warning from '../../icons/warning.svg?vue-component';
import CheckCircle from '../../icons/check-circle.svg?vue-component';
import NotSecure from '../../icons/not-secure.svg?vue-component';
import Globe from '../../icons/globe.svg?vue-component';

export default defineComponent({
  props: {
    status: {
      type: String as PropType<StatusIconType>,
      required: true,
      validator: (val: StatusIconType) => ALLOWED_ICON_STATUSES.includes(val),
    },
  },
  setup(props) {
    const statusIcons: Record<StatusIconType, Component> = {
      critical: TimesCircle,
      alert: Alert,
      warning: Warning,
      info: QuestionCircle,
      success: CheckCircle,
      'not-secure': NotSecure,
      help: Globe,
    };

    const icon = computed(() => statusIcons[props.status]);

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
