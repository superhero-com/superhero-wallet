<template>
  <div class="apps-browser-list-item-wrapper">
    <!-- TODO add image -->
    <div class="app-image" />
    <div class="app-title">
      {{ appTitle }}
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'AppsBrowserListItem',
  components: {},
  props: {
    appTitle: { type: String, required: true },
  },
  setup() {
  },
});
</script>
<style scoped lang="scss">
@use '../../styles/variables' as *;

.apps-browser-list-item-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding-top: 4px;

  &:hover {
    .app-image {
      border-radius: 10px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      opacity: 1;
    }

    .app-title {
      opacity: 1;
    }
  }
}

.app-image {
  width: 88px;
  height: 88px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  opacity: 0.75;
  background: lightgray 50% / cover no-repeat;
  box-shadow: 2px 2px 6px 0 rgba(0, 0, 0, 0.4);
}

.app-title {
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  text-align: center;
  color: $color-white;
  opacity: 0.75;
}

</style>
