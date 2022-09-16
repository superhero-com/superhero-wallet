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
import AnimatedSpinner from '../../icons/animated-spinner.svg?skip-optimize';

export default {
  components: { AnimatedSpinner },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/mixins';

.loader {
  display: flex;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;

  .container {
    width: 100%;
    height: 100%;
    background-color: var(--screen-bg-color);
    opacity: 0.9;
    display: flex;
    align-items: center;
    justify-content: center;

    @include mixins.desktop {
      width: variables.$extension-width;
      height: 600px;
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
