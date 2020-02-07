<template>
  <div>
    <div v-if="loading" class="loading">
      <div class="center">
        <span v-if="content != ''">{{ content }}</span>
        <br v-if="content != ''" />
        <ae-loader v-if="size == 'small'" />
      </div>
      <transition name="fadeOut" v-if="size == 'big'">
        <span class="mainLoader mainLoaderTransparent" v-if="type == 'transparent'"><ae-loader /></span>
        <Welcome class="mainLoader" v-if="type !== 'transparent'" />
      </transition>
    </div>
  </div>
</template>

<script>
import Welcome from '../pages/Welcome';

export default {
  components: {
    Welcome,
  },
  data() {
    return {};
  },
  props: ['loading', 'content', 'size', 'type'],
  methods: {},
};
</script>

<style lang="scss">
@import '../../../common/variables';
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
.mainLoader {
  position: fixed;
  width: 100%;
  height: 100%;
  background-color: $bg-color;
  top: 0;
  z-index: 6;
}
.mainLoader .ae-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  margin: -1.5em;
  width: 3em !important;
  height: 3em !important;
  border-radius: 3em !important;
}
.mainLoader.mainLoaderTransparent {
  opacity: 0.6;
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
