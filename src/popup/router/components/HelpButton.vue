<template>
  <ButtonPlain
    class="help-button"
    @click="showHelpModal"
  >
    <QuestionCircle class="icon" />
  </ButtonPlain>
</template>

<script>
import ButtonPlain from './ButtonPlain.vue';
import QuestionCircle from '../../../icons/question-circle-border.svg?vue-component';

export default {
  components: { ButtonPlain, QuestionCircle },
  props: {
    title: { type: String, default: '' },
    msg: { type: String, default: '' },
    icon: { type: String, default: '' },
    option: { type: Object, default: null },
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

.help-button {
  svg {
    width: 24px;
    height: 24px;
    color: rgba(variables.$color-blue, 0.7);
  }

  &:hover svg {
    color: variables.$color-blue;
  }
}
</style>
