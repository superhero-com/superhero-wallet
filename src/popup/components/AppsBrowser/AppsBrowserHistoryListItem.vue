<template>
  <button
    class="apps-browser-history-list-item"
    :class="{ 'no-title': !title }"
    type="button"
  >
    <div class="app-image-wrapper">
      <img
        v-if="image"
        :src="imageUrl"
        class="app-image"
        alt="Dapp favicon"
      >
      <IconWrapper
        v-else
        :icon="GlobeSmallIcon"
        class="app-image default"
        is-full
      />
    </div>
    <div class="app-info">
      <div
        v-if="title"
        class="app-title"
      >
        {{ title }}
      </div>
      <div class="app-url">
        {{ url }}
      </div>
    </div>
  </button>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import IconWrapper from '@/popup/components/IconWrapper.vue';
import GlobeSmallIcon from '@/icons/globe-small.svg?vue-component';

export default defineComponent({
  name: 'AppsBrowserHistoryListItem',
  components: { IconWrapper },
  props: {
    url: { type: String, required: true },
    title: { type: String, default: null },
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
      GlobeSmallIcon,
    };
  },
});
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;
@use '@/styles/typography';

.apps-browser-history-list-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: 100%;
  margin: 4px 0;
  cursor: pointer;

  &.no-title {
    align-items: center;
  }

  &:hover {
    .app-title {
      opacity: 0.7;
    }

    .app-url {
      opacity: 0.5;
    }
  }

  .app-image-wrapper {
    margin-right: 6px;

    .app-image {
      width: 22px;
      height: 22px;

      &.default {
        opacity: 0.5;
      }
    }
  }

  .app-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    text-align: left;
    flex: 1;
    gap: 4px;
    color: $color-white;
  }

  .app-title {
    @extend %face-sans-15-medium;

    line-height: 16px;
    opacity: 1;
  }

  .app-url {
    @extend %face-sans-12-medium;

    opacity: 0.7;
  }
}
</style>
