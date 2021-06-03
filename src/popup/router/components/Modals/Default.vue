<template>
  <Modal
    class="default"
    close
    @close="resolve"
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

    <Button
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
import QuestionCircle from '../../../../icons/question-circle.svg?vue-component';

export default {
  components: { Modal, Button },
  props: {
    resolve: { type: Function, required: true },
    title: { type: String, default: '' },
    msg: { type: String, default: '' },
    type: { type: String, default: '' },
    icon: { type: String, default: '' },
  },
  computed: {
    Icon() {
      switch (this.icon) {
        case 'info':
          return QuestionCircle;
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
    &.info {
      color: variables.$color-blue;
    }
  }
}
</style>
