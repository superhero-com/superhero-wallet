<template>
  <button class="apps-browser-list-item">
    <IconWrapper
      v-if="appIcon"
      :icon="appIcon"
      class="app-image"
      is-boxed
    />
    <div
      v-else
      class="app-image"
    />
    <div class="app-title">
      {{ appTitle }}
    </div>
  </button>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { VueI18nTranslation } from 'vue-i18n';
import IconWrapper from './IconWrapper.vue';

export default defineComponent({
  name: 'AppsBrowserListItem',
  components: { IconWrapper },
  props: {
    appTitle: { type: String as PropType<string | VueI18nTranslation>, required: true },
    appIcon: { type: Object as PropType<Object>, default: null },
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
    .app-image {
      border-radius: 10px;
      box-shadow: inset 0 0 0 1px $color-white;
      opacity: 1;
    }

    .app-title {
      opacity: 1;
    }
  }

  .app-image {
    width: 88px;
    height: 88px;
    border-radius: 10px;
    opacity: 0.75;
    box-shadow: inset 2px 2px 6px 0 rgba($color-black, 0.4);
    box-shadow: 2px 2px 6px 0 rgba($color-black, 0.4);
  }

  .app-title {
    padding: 4px 8px;
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    text-align: center;
    color: $color-white;
    opacity: 0.75;
  }
}

:deep(.icon-wrapper .icon-wrapper-icon) {
  width: 100%;
  height: 100%;
}
</style>
