<template>
  <BtnPlain
    class="btn-help"
    :class="{ small }"
    @click="showHelpModal"
  >
    <QuestionCircle class="icon" />
  </BtnPlain>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useModals } from '../../../composables';
import { MODAL_HELP } from '../../utils';
import BtnPlain from './BtnPlain.vue';
import QuestionCircle from '../../../icons/question-circle-border.svg?vue-component';

export default defineComponent({
  components: { BtnPlain, QuestionCircle },
  props: {
    title: { type: String, default: '' },
    msg: { type: String, default: '' },
    icon: { type: String, default: '' },
    option: { type: Object, default: null },
    small: Boolean,
  },
  setup(props, { emit }) {
    const { openModal } = useModals();

    function showHelpModal() {
      emit('help');

      if (props.title.length || props.msg.length) {
        openModal(MODAL_HELP, {
          icon: props.icon || 'info',
          title: props.title,
          msg: props.msg,
          option: props.option,
          textCenter: true,
        });
      }
    }

    return {
      showHelpModal,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.btn-help {
  display: inline-flex;

  svg {
    width: 24px;
    height: 24px;
    opacity: 0.5;
    color: variables.$color-white;
  }

  &.small svg {
    width: 20px;
    height: 20px;
  }

  &:hover svg {
    opacity: 1;
  }
}
</style>
