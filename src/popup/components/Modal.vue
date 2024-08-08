<template>
  <transition
    appear
    :name="fromBottom ? 'from-bottom-transition' : 'pop-in-transition'"
    @after-enter="$emit('open')"
  >
    <div
      v-if="show"
      class="modal"
      :class="{
        'full-screen': fullScreen,
        'from-bottom': fromBottom,
        'has-header': showHeader,
        'has-close-button': hasCloseButton,
        'no-padding': noPadding,
        'no-padding-bottom': noPaddingBottom,
        transparent,
        dense,
        'semi-dense': semiDense,
        'blur-bg': !(IS_FIREFOX && IS_EXTENSION),
        'min-height': minHeight,
      }"
    >
      <div class="container">
        <div
          v-if="showHeader"
          class="header"
          :class="{
            transparent: hasCloseButton && !($slots.header || header),
          }"
        >
          <div
            v-if="$slots.icon"
            class="header-icon"
          >
            <slot name="icon" />
          </div>

          <slot name="header">
            <div
              class="header-default-text"
              v-text="header"
            />
          </slot>

          <BtnClose
            v-if="hasCloseButton"
            data-cy="btn-close"
            class="close-button"
            @click="handleClose"
          />
        </div>

        <div
          v-if="$slots.default"
          class="body"
          :class="{
            'text-center': centered,
          }"
        >
          <slot />
        </div>

        <FixedScreenFooter
          v-if="$slots.footer"
        >
          <slot name="footer" />
        </FixedScreenFooter>

        <BackToTop sticky />
      </div>

      <div
        class="cover"
        @click="handleClose"
      />
    </div>
  </transition>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
} from 'vue';
import { BackButtonEvent } from '@ionic/vue';
import { IS_FIREFOX, IS_EXTENSION } from '@/constants';
import BtnClose from './buttons/BtnClose.vue';
import FixedScreenFooter from './FixedScreenFooter.vue';
import BackToTop from './BackToTop.vue';

export default defineComponent({
  components: {
    FixedScreenFooter,
    BtnClose,
    BackToTop,
  },
  props: {
    show: Boolean,
    hasCloseButton: Boolean,
    fullScreen: Boolean,
    fromBottom: Boolean,
    dense: Boolean,
    semiDense: Boolean,
    noPadding: Boolean,
    noPaddingBottom: Boolean,
    centered: Boolean,
    minHeight: Boolean,
    transparent: Boolean,
    header: { type: String, default: null },
  },
  emits: ['close', 'open'],
  setup(props, { slots, emit }) {
    const showHeader = computed(() => props.hasCloseButton || props.header || slots.header);

    function handleClose() {
      emit('close');
    }

    function onBackButtonHandler(event: BackButtonEvent) {
      event.detail.register(100, handleClose);
    }

    onMounted(() => {
      document.addEventListener('ionBackButton', onBackButtonHandler);
      if (!document.body.style.overflow) {
        document.body.style.overflow = 'hidden';
      }
    });

    onBeforeUnmount(() => {
      document.removeEventListener('ionBackButton', onBackButtonHandler);
      document.body.style.overflow = '';
    });

    return {
      handleClose,
      IS_FIREFOX,
      IS_EXTENSION,
      showHeader,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.modal {
  --screen-padding-x: 24px; // Default spacing
  --screen-bg-color: #{$color-bg-modal};
  --footer-padding-bottom: 36px;

  position: fixed;
  z-index: $z-index-modal;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  min-width: $extension-width;
  background-color: rgba($color-black, 0.7);
  display: flex;
  will-change: backdrop-filter;

  .container {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 92%;
    margin: auto;
    background-color: var(--screen-bg-color);
    border-radius: $border-radius-modal;
    box-shadow:
      0 0 0 1px $color-border,
      2px 4px 12px rgba($color-black, 0.22);

    @include mixins.desktop {
      width: calc(#{$extension-width} - 32px);
    }

    .header {
      flex-basis: 32px;
      flex-shrink: 0;
      color: $color-white;
      font-size: 19px;
      line-height: 24px;
      font-weight: 500;
      word-break: break-word;
      text-align: center;
      display: flex;
      flex-direction: column;
      background-color: var(--screen-bg-color);
      position: relative;

      &-icon {
        margin: 0 auto 10px;
        width: 48px;
        height: 48px;
      }

      &.transparent {
        background-color: transparent;
      }
    }

    .body {
      @extend %face-sans-15-regular;

      display: flex;
      flex-direction: column;
      padding: var(--screen-padding-x);
      color: $color-grey-light;
      word-break: break-word;
    }

    .close-button {
      position: absolute;
      top: 4px;
      right: 8px;
    }
  }

  .cover {
    position: fixed;
    z-index: -1;
    inset: 0;
  }

  &.min-height {
    .container {
      min-height: 480px;
    }
  }

  &.full-screen,
  &.from-bottom {
    --footer-padding-bottom: 24px;

    .container {
      width: 100%;
      max-height: 100%;
      margin-top: 0;
      margin-bottom: 0;
      overflow: hidden auto;
    }

    .header {
      position: sticky;
      z-index: 3;
      top: 0;
    }
  }

  &.transparent {
    .container {
      box-shadow: none;
      background: transparent;
    }
  }

  &.full-screen {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom); // needed to overwrite .app-wrapper .main styles

    @include mixins.desktop {
      position: absolute;
    }

    .container {
      height: 100%;
      border-radius: 0;
    }
  }

  &.from-bottom {
    position: absolute;
    align-items: end;
  }

  &.has-header {
    .body {
      padding-top: 0;
    }
  }

  &.dense {
    --screen-padding-x: 8px;
  }

  &.semi-dense {
    --screen-padding-x: 12px;
  }

  &.no-padding {
    --screen-padding-x: 0;
  }

  &.no-padding-bottom {
    .body {
      padding-bottom: 0;
    }
  }

  // This is not working correctly in Firefox extension
  &.blur-bg {
    backdrop-filter: blur(5px);
  }

  &.pop-in-transition {
    &-enter-active,
    &-leave-active {
      transition: opacity 0.3s;

      .container {
        transition: transform 0.3s;
      }
    }

    &-enter-from,
    &-leave-to {
      opacity: 0;

      .container {
        transform: scale(1.1);
      }
    }
  }

  &.from-bottom-transition {
    &-enter-active,
    &-leave-active {
      transition: opacity 0.3s;

      .container {
        transition: transform 0.3s cubic-bezier(0.65, 0, 0.35, 1);
      }
    }

    &-enter-from,
    &-leave-to {
      opacity: 0;

      .container {
        transform: translateY(70%);
      }
    }
  }
}
</style>
