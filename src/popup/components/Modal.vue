<template>
  <transition
    appear
    :name="fromBottom ? 'from-bottom-transition' : 'pop-in-transition'"
    @after-enter="$emit('opened')"
  >
    <div
      class="modal"
      :class="{
        'full-screen': fullScreen,
        'from-bottom': fromBottom,
        'has-header': showHeader,
        'has-close-button': hasCloseButton,
        'no-padding': noPadding,
        dense,
        'blur-bg': !(IS_FIREFOX && IS_EXTENSION)
      }"
    >
      <div class="container">
        <div
          v-if="showHeader"
          class="header"
          :class="{ transparent: hasCloseButton && !($slots.header || header) }"
        >
          <div
            v-if="$slots.icon"
            class="header-icon"
          >
            <slot name="icon" />
          </div>

          <slot name="header">
            <div class="header-default-text">
              {{ header }}
            </div>
          </slot>

          <BtnClose
            v-if="hasCloseButton"
            @click="$emit('close')"
          />
        </div>

        <div
          v-if="$slots.default"
          class="body"
          :class="{ 'text-center': centered }"
        >
          <slot />
        </div>

        <div
          v-if="$slots.footer"
          :class="['footer', { mobile: IS_MOBILE_DEVICE }]"
        >
          <slot name="footer" />
        </div>
      </div>

      <div
        class="cover"
        @click="$emit('close')"
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
} from '@vue/composition-api';
import { IS_MOBILE_DEVICE, IS_FIREFOX, IS_EXTENSION } from '../../lib/environment';
import BtnClose from './buttons/BtnClose.vue';

export default defineComponent({
  components: {
    BtnClose,
  },
  props: {
    hasCloseButton: Boolean,
    fullScreen: Boolean,
    fromBottom: Boolean,
    dense: Boolean,
    noPadding: Boolean,
    centered: Boolean,
    header: { type: String, default: null },
  },
  emits: [
    'close',
  ],
  setup(props, { slots }) {
    const showHeader = computed(() => props.hasCloseButton || props.header || slots.header);

    onMounted(() => {
      if (!document.body.style.overflow) {
        document.body.style.overflow = 'hidden';
      }
    });

    onBeforeUnmount(() => {
      document.body.style.overflow = '';
    });

    return {
      IS_MOBILE_DEVICE,
      IS_FIREFOX,
      IS_EXTENSION,
      showHeader,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.modal {
  --screen-padding-x: 24px; // Default spacing
  --screen-bg-color: #{variables.$color-bg-modal};
  --footer-padding-bottom: 36px;

  position: fixed;
  z-index: variables.$z-index-modal;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  min-width: variables.$extension-width;
  background-color: rgba(variables.$color-black, 0.7);
  display: flex;
  will-change: backdrop-filter;

  .container {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 92%;
    margin: auto;
    background-color: var(--screen-bg-color);
    border-radius: variables.$border-radius-modal;
    box-shadow:
      0 0 0 1px variables.$color-border,
      2px 4px 12px rgba(variables.$color-black, 0.22);
    will-change: transform;

    @include mixins.desktop {
      width: calc(#{variables.$extension-width} - 32px);
    }

    .close-button {
      position: absolute;
      z-index: 3;
      right: 8px;
      top: 8px;
      color: variables.$color-white;

      &-icon {
        width: 100%;
      }
    }

    .header {
      flex-basis: 32px;
      flex-shrink: 0;
      color: variables.$color-white;
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

      padding: var(--screen-padding-x);
      color: variables.$color-grey-light;
      word-break: break-word;
    }

    .footer {
      position: sticky;
      bottom: 0;
      margin: auto 0 0 0; // Move the footer to the bottom of the container
      display: flex;
      justify-content: center;
      gap: 8px;
      padding: 24px;

      &.mobile {
        margin-bottom: 20px;
      }

      // Semi-transparent and gradient-like cover under the buttons
      &::before {
        content: '';
        position: absolute;
        z-index: -1;
        inset: 0;
        background-color: var(--screen-bg-color);
        top: 40px;
        box-shadow: 0 -30px 20px var(--screen-bg-color);
        opacity: 0.9;
      }

      // Make the footer bottom rounded corners the same as the container
      &,
      &::before {
        border-bottom-left-radius: inherit;
        border-bottom-right-radius: inherit;
      }
    }
  }

  .cover {
    position: fixed;
    z-index: -1;
    inset: 0;
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

  &.full-screen {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom) !important; // needed to overwrite #app .main styles

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

    .container {
      border-bottom-left-radius: var(--screen-border-radius);
      border-bottom-right-radius: var(--screen-border-radius);
    }
  }

  &.has-header {
    .body {
      padding-top: 0;
    }
  }

  &.dense {
    --screen-padding-x: 8px;
  }

  &.no-padding {
    --screen-padding-x: 0;
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

    &-enter,
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

    &-enter,
    &-leave-to {
      opacity: 0;

      .container {
        transform: translateY(70%);
      }
    }
  }
}
</style>
