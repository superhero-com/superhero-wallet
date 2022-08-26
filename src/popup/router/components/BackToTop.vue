<template>
  <ButtonPlain
    v-if="isVisible"
    class="back-to-top"
    @click="scrollTop"
  >
    <Chevron />
  </ButtonPlain>
</template>

<script>
import ButtonPlain from './ButtonPlain.vue';
import Chevron from '../../../icons/chevron.svg?vue-component';

export default {
  components: { ButtonPlain, Chevron },
  data() {
    return {
      isVisible: false,
    };
  },
  mounted() {
    if (!this.$el?.parentNode) return;
    this.$el.parentNode.addEventListener('scroll', this.handleVisibility);
    this.$on('beforeDestroy', () => {
      this.$el.parentNode.removeEventListener('scroll', this.handleVisibility);
    });
  },
  methods: {
    handleVisibility() {
      const parent = this.$el?.parentNode;
      if (!parent) return;
      this.isVisible = parent.scrollTop > 0;
    },
    scrollTop() {
      const parent = this.$el.parentNode;
      parent.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/mixins';

.back-to-top {
  @include mixins.flex(center, center);

  width: 100%;
  height: 40px;
  background: rgba(variables.$color-white, 0.1);

  &:hover {
    background: rgba(variables.$color-white, 0.08);

    .chevron {
      opacity: 0.75;
    }
  }

  .chevron {
    transform: rotate(-90deg);
    opacity: 0.5;
  }
}
</style>
