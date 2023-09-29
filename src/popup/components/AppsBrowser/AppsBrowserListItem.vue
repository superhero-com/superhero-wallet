<template>
  <button class="apps-browser-list-item">
    <div
      class="app-image-wrapper"
    >
      <IconWrapper
        v-if="appIcon"
        :icon="appIcon"
        class="app-image"
        is-full
      />
      <img
        v-else-if="appImage"
        :src="getImageUrl(appImage)"
        class="app-image"
      >
    </div>
    <div class="app-title">
      {{ appTitle }}
    </div>
  </button>
</template>

<script lang="ts">
import { Component, defineComponent, PropType } from 'vue';
import IconWrapper from '../IconWrapper.vue';

export default defineComponent({
  name: 'AppsBrowserListItem',
  components: { IconWrapper },
  props: {
    appTitle: { type: String, required: true },
    appIcon: { type: Object as PropType<Component>, default: null },
    /**
     * App image name, should be located in src\icons\dapp
     */
    appImage: { type: String, default: null },
  },
  setup() {
    function getImageUrl(name: string) {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      return require(`@/icons/dapp/${name}`);
    }

    return {
      getImageUrl,
    };
  },
});
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.apps-browser-list-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  margin-top: 4px;

  &:hover {
    cursor: pointer;

    .app-image-wrapper {
      background: $color-disabled;
    }

    .app-title,
    .app-image {
      opacity: 1;
    }
  }

  .app-image-wrapper {
    width: 88px;
    height: 88px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: $color-bg-6;
    border-radius: 10px;
  }

  .app-image {
    width: 40px;
    height: 40px;
    opacity: 0.85;
  }

  .app-title {
    padding: 4px 8px;
    font-size: 12px;
    line-height: 16px;
    text-align: center;
    color: $color-white;
    opacity: 0.7;
  }
}
</style>
