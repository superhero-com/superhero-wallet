<template>
  <div
    class="message-offline"
    :class="{
      horizontal,
      'colors-disabled': disableColors,
    }"
  >
    <OfflineIcon class="offline-icon" />

    <p
      v-if="text"
      class="text"
    >
      {{ text }}
    </p>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import OfflineIcon from '../../icons/offline.svg?vue-component';

export default defineComponent({
  components: {
    OfflineIcon,
  },
  props: {
    text: { type: String, default: null },
    horizontal: Boolean,
    disableColors: Boolean,
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/typography';

.message-offline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;

  &.horizontal {
    flex-direction: row;
    gap: 6px;
    text-align: left;

    .offline-icon {
      margin: 0;
      width: 26px;
    }
  }

  &.colors-disabled {
    .offline-icon {
      color: $color-white;
    }
  }

  .offline-icon {
    width: 40px;
    margin-bottom: 2px;
    color: $color-warning;
  }

  .text {
    @extend %face-sans-15-regular;

    opacity: 0.75;
    margin: 0 auto;
    max-width: 240px;
  }
}
</style>
