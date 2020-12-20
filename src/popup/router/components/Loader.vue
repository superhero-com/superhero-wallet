<template>
  <div class="loader" data-cy="loader">
    <div class="center">
      <span v-if="content !== ''">{{ content }}</span>
      <br v-if="content !== ''" />
      <ae-loader v-if="size === 'small'" />
    </div>
    <transition v-if="size === 'big'">
      <span v-if="type === 'transparent'" class="main-loader main-loader-transparent">
        <ae-loader />
      </span>
      <Welcome v-else class="main-loader main-loader-solid" />
    </transition>
  </div>
</template>

<script>
import Welcome from './Welcome';

export default {
  components: {
    Welcome,
  },
  props: {
    content: { type: String, default: '' },
    size: { type: String, default: 'big' },
    type: { type: String, default: 'transparent' },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.loader {
  .center {
    position: relative;
    z-index: 5;
    word-break: break-word;
  }

  .ae-loader {
    border: 0.2em solid $secondary-color;
    border-left-color: transparent;
    border-right-color: transparent;
  }

  .main-loader {
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: $bg-color;
    top: 0;
    z-index: 8;

    .ae-loader {
      position: absolute;
      top: 50%;
      left: 50%;
      margin: -1.5em;
      width: 3em;
      height: 3em;
      border-radius: 3em;
    }

    &.main-loader-transparent {
      opacity: 0.6;
    }

    &.main-loader-solid {
      padding-top: 50px;
      padding-top: calc(50px + env(safe-area-inset-top));
    }

    &.v-enter-active,
    &.v-leave-active {
      transition: all 0.5s ease-in-out;
    }

    &.v-leave-to {
      opacity: 0;
    }
  }
}
</style>
