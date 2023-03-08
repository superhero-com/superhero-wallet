<template>
  <BtnPlain
    class="btn-help"
    :class="{ small }"
    @click="showHelpModal"
  >
    <QuestionCircle class="icon" />
  </BtnPlain>
</template>

<script>
import BtnPlain from './BtnPlain.vue';
import QuestionCircle from '../../../icons/question-circle-border.svg?vue-component';

export default {
  components: { BtnPlain, QuestionCircle },
  props: {
    title: { type: String, default: '' },
    msg: { type: String, default: '' },
    icon: { type: String, default: '' },
    option: { type: Object, default: null },
    small: Boolean,
  },
  methods: {
    async showHelpModal() {
      await this.$store.dispatch('modals/open', {
        name: 'help',
        icon: this.icon || 'info',
        title: this.title,
        msg: this.msg,
        option: this.option,
        textCenter: true,
      });
    },
  },
};
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
