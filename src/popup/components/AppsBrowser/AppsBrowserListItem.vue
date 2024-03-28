<template>
  <button
    class="apps-browser-list-item"
    type="button"
  >
    <div
      class="app-image-wrapper"
    >
      <img
        :src="imageUrl"
        class="app-image"
        alt="Dapp favicon"
      >
    </div>
    <div class="app-title">
      {{ title }}
    </div>
  </button>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';

export default defineComponent({
  name: 'AppsBrowserListItem',
  props: {
    title: { type: String, required: true },
    /**
     * App image name, should be located in src\icons\dapp
     */
    image: { type: String, default: null },
  },
  setup(props) {
    const imageUrl = computed(() => {
      if (props.image) {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        return require(`@/icons/dapp/${props.image}`);
      }

      return null;
    });

    return {
      imageUrl,
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
