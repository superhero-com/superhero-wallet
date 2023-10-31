<template>
  <BtnPlain
    v-if="isVisible"
    class="back-to-top"
    @click="scrollTop"
  >
    <Chevron class="chevron" />
  </BtnPlain>
</template>

<script>
import BtnPlain from './buttons/BtnPlain.vue';
import Chevron from '../../icons/chevron.svg?vue-component';

export default {
  components: {
    BtnPlain,
    Chevron,
  },
  data() {
    return {
      isVisible: false,
    };
  },
  mounted() {
    if (this.$el?.parentNode) {
      this.$el.parentNode.addEventListener('scroll', this.handleVisibility);
    }
  },
  beforeUnmount() {
    if (this.$el?.parentNode) {
      this.$el.parentNode.removeEventListener('scroll', this.handleVisibility);
    }
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
@use '../../styles/variables';
@use '../../styles/mixins';

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
    width: 22px;
    height: 22px;
    transform: rotate(-90deg);
    opacity: 0.5;
  }
}
</style>
