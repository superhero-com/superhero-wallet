<template>
  <div
    :class="['seed-phrase-notification', { error: hasError }]"
    :style="{ bottom: `${positionBottom}px`, minHeight: `${phraserElHeight}px` }"
  >
    <div class="icon-wrapper">
      <AlertIcon v-if="hasError" />
      <CheckCircleIcon v-else />
    </div>
    <div class="text">
      <div>
        {{ notificationMessage }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  onMounted,
  ref,
} from 'vue';
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
    phraserEl: { type: HTMLElement, default: null },
  },
  setup(props) {
    const { t } = useI18n();

    const positionBottom = ref(90);
    const phraserElHeight = ref(176);

    const notificationMessage = computed(() => props.hasError
      ? t('pages.seed-phrase-settings.seed-phrase-incorrect')
      : t('pages.seed-phrase-settings.seed-phrase-correct'));

    onMounted(() => {
      if (props.phraserEl) {
        phraserElHeight.value = props.phraserEl.getBoundingClientRect().height;
        const { bottom } = props.phraserEl.getBoundingClientRect();
        const ionicWrapperBottom = document.querySelector('#app-wrapper')?.getBoundingClientRect()?.bottom;
        positionBottom.value = Math.floor(ionicWrapperBottom! - bottom - 2); // 2px is border width
      }
    });

    return {
      notificationMessage,
      positionBottom,
      phraserElHeight,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.seed-phrase-notification {
  border: 2px solid variables.$color-success-dark;
  border-radius: variables.$border-radius-card;
  background: rgba(variables.$color-black, 0.85);
  position: absolute;
  width: calc(100% - (2 * var(--screen-padding-x)));
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: variables.$color-success-dark;

  @extend %face-sans-16-medium;

  &.error {
    border-color: variables.$color-danger;
    color: variables.$color-danger;
  }

  .text {
    padding: 16px;
    text-align: center;
  }

  .icon-wrapper {
    width: 40px;
    height: 40px;
    background: rgba(variables.$color-black, 0.3);
    border-radius: 20px;

    .icon {
      width: 40px;
      height: 40px;
    }
  }
}
</style>
