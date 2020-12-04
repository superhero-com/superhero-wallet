<template>
  <div class="loading" data-cy="loader">
    <div class="center">
      <span v-if="content != ''">{{ content }}</span>
      <br v-if="content != ''" />
      <ae-loader v-if="size == 'small'" />
    </div>
    <transition name="fadeOut" v-if="size == 'big'">
      <span v-if="type == 'transparent'" class="main-loader main-loader-transparent">
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

<style lang="scss">
@import '../../../styles/variables';

.fadeOut-enter-active,
.fadeOut-leave-active {
  transition: all 0.5s ease-in-out;
}

.fadeOut-leave-to {
  opacity: 0;
}

.ae-loader {
  border: 0.2em solid $secondary-color !important;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
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
    width: 3em !important;
    height: 3em !important;
    border-radius: 3em !important;
  }

  &.main-loader-transparent {
    opacity: 0.6;
  }

  &.main-loader-solid {
    padding-top: 50px;
    padding-top: calc(50px + env(safe-area-inset-top));
  }
}

.loader .loading {
  width: 32px;
  margin-right: 15px;
}

.center {
  position: relative;
  z-index: 5;
  word-break: break-word;
}
</style>
