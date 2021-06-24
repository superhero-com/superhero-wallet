<template>
  <Modal
    class="default"
    close
    v-on="{ close: close || resolve }"
  >
    <template slot="header">
      <Component
        :is="Icon"
        v-if="Icon"
        class="icon"
        :class="icon"
      />
      {{ title }}
    </template>

    <slot
      v-if="$slots.msg"
      name="msg"
    />
    <template v-else>
      {{ msg || $t(`modals.${type}.msg`) }}
    </template>

    <slot
      v-if="$slots.footer"
      slot="footer"
      name="footer"
    />
    <Button
      v-else
      slot="footer"
      @click="resolve"
    >
      {{ $t('ok') }}
    </Button>
  </Modal>
</template>

<script>
import Modal from '../Modal';
import Button from '../Button';
import TimesCircle from '../../../../icons/times-circle.svg?vue-component';
import QuestionCircle from '../../../../icons/question-circle.svg?vue-component';
import Alert from '../../../../icons/alert.svg?vue-component';
import Warning from '../../../../icons/warning.svg?vue-component';
import CheckCircle from '../../../../icons/check-circle.svg?vue-component';
import NotSecure from '../../../../icons/not-secure.svg?vue-component';

export default {
  components: { Modal, Button },
  props: {
    resolve: { type: Function, required: true },
    close: { type: Function, default: null },
    title: { type: String, default: '' },
    msg: { type: String, default: '' },
    type: { type: String, default: '' },
    icon: { type: String, default: '' },
  },
  computed: {
    Icon() {
      switch (this.icon) {
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
        default:
          return null;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';

.default {
  .icon {
    &.alert,
    &.critical {
      color: variables.$color-error;
    }

    &.warning,
    &.not-secure {
      color: variables.$color-warning;
    }

    &.info {
      color: variables.$color-blue;
    }

    &.success {
      color: variables.$color-green;
    }
  }
}
</style>
