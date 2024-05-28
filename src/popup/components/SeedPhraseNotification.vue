<template>
  <div
    class="seed-phrase-notification"
    :class="{ error: hasError }"
  >
    <div class="icon-wrapper">
      <AlertIcon
        v-if="hasError"
        class="icon"
      />
      <CheckCircleIcon
        v-else
        class="icon"
      />
    </div>

    <div
      class="text"
      v-text="notificationMessage"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import CheckCircleIcon from '../../icons/check-circle.svg?vue-component';
import AlertIcon from '../../icons/alert.svg?vue-component';

export default defineComponent({
  components: {
    CheckCircleIcon,
    AlertIcon,
  },
  props: {
    hasError: Boolean,
  },
  setup(props) {
    const { t } = useI18n();

    const notificationMessage = computed(() => props.hasError
      ? t('pages.seed-phrase-settings.seed-phrase-incorrect')
      : t('pages.seed-phrase-settings.seed-phrase-correct'));

    return {
      notificationMessage,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.seed-phrase-notification {
  @extend %face-sans-16-medium;

  border: 2px solid $color-success-dark;
  border-radius: $border-radius-card;
  background: rgba($color-black, 0.85);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: $color-success-dark;

  &.error {
    border-color: $color-danger;
    color: $color-danger;
  }

  .text {
    padding: 16px;
    text-align: center;
  }

  .icon-wrapper {
    width: 40px;
    height: 40px;

    .icon {
      width: 40px;
      height: 40px;
    }
  }
}
</style>
