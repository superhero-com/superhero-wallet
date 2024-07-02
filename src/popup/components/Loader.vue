<template>
  <div
    class="loader"
    data-cy="loader"
  >
    <div class="container">
      <AnimatedSpinner class="spinner" />
    </div>
  </div>
</template>

<script>
import AnimatedSpinner from '../../icons/animated-spinner.svg?vue-component';

export default {
  components: { AnimatedSpinner },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/mixins';

.loader {
  position: fixed;
  z-index: $z-index-loader;
  top: 0;
  left: 0;
  display: flex;
  width: 100%;
  height: 100%;

  .container {
    width: 100%;
    height: 100%;
    background-color: var(--screen-bg-color);
    opacity: 0.9;
    display: flex;
    align-items: center;
    justify-content: center;

    @include mixins.desktop {
      width: $extension-width;
      height: $extension-height;
      border-radius: 10px;
      margin: auto;
    }

    .spinner {
      width: 72px;
      height: 72px;
    }
  }
}
</style>
