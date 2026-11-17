<template>
  <transition
    appear
    :name="transitionName"
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
        'no-bg-blur': (IS_FIREFOX && IS_EXTENSION) || noBgBlur,
        'no-padding': noPadding,
        'no-padding-bottom': noPaddingBottom,
        transparent,
        dense,
        'semi-dense': semiDense,
        'min-height': minHeight,
      }"
    >
      <div
        ref="scrollElem"
        class="container"
        @focusin="scheduleFocusedFieldReveal"
      >
        <div
          v-if="showHeader"
          ref="headerElem"
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
          ref="footerComponent"
        >
          <slot name="footer" />
        </FixedScreenFooter>

        <BackToTop sticky />
      </div>

      <!-- Keyboard users close with Escape or the close button -->
      <div
        class="cover"
        aria-hidden="true"
        @click="handleClose"
      />
    </div>
  </transition>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  onBeforeUnmount,
  onMounted,
  watch,
} from 'vue';
import { BackButtonEvent } from '@ionic/vue';

import { IS_EXTENSION, IS_FIREFOX } from '@/constants';
import { useScrollConfig, useViewport } from '@/composables';

import BtnClose from './buttons/BtnClose.vue';
import FixedScreenFooter from './FixedScreenFooter.vue';
import BackToTop from './BackToTop.vue';

const NON_TEXT_INPUT_TYPES = [
  'button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit',
];

function isTextField(el: Element | null): el is HTMLInputElement | HTMLTextAreaElement {
  return el instanceof HTMLTextAreaElement
    || (el instanceof HTMLInputElement && !NON_TEXT_INPUT_TYPES.includes(el.type));
}

/** Shown modals in opening order; Escape closes only the last one. */
const shownModals: symbol[] = [];

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
    /** Disable the cover backdrop blur effect */
    noBgBlur: Boolean,
    noPadding: Boolean,
    noPaddingBottom: Boolean,
    centered: Boolean,
    minHeight: Boolean,
    transparent: Boolean,
    initializeViewport: Boolean,
    header: { type: String, default: null },
  },
  emits: ['close', 'open'],
  setup(props, { slots, emit }) {
    const scrollElem = ref<HTMLElement>();
    const headerElem = ref<HTMLElement>();
    const footerComponent = ref<InstanceType<typeof FixedScreenFooter>>();
    let revealFrame: number | undefined;

    const { setScrollConf } = useScrollConfig();
    const { initViewport } = useViewport();

    const showHeader = computed(() => props.hasCloseButton || props.header || slots.header);

    /** Only these variants scroll inside the container, under the sticky footer. */
    const isScrollable = computed(() => props.fromBottom || props.fullScreen);

    const transitionName = computed(() => props.fromBottom ? 'from-bottom-transition' : 'pop-in-transition');

    function handleClose() {
      emit('close');
    }

    const modalKey = Symbol('modal');

    function forgetModal() {
      const idx = shownModals.indexOf(modalKey);
      if (idx > -1) {
        shownModals.splice(idx, 1);
      }
    }

    // `show` turns false before the leave transition, while the modal is still mounted
    watch(
      () => props.show,
      (show) => {
        if (!show) {
          forgetModal();
        } else if (!shownModals.includes(modalKey)) {
          shownModals.push(modalKey);
        }
      },
      { immediate: true },
    );

    function handleKeydown(event: KeyboardEvent) {
      if (
        event.key !== 'Escape'
        || event.defaultPrevented
        || event.isComposing
        || event.repeat
        || shownModals.at(-1) !== modalKey
        // Stands in for the close button or the backdrop, which full-screen modals cover
        || (props.fullScreen && !props.hasCloseButton)
      ) {
        return;
      }
      event.preventDefault();
      handleClose();
    }

    /**
     * Native focus scrolling ignores the sticky footer, and the iOS keyboard
     * shrinks the view only after the field is focused.
     */
    function revealFocusedField() {
      revealFrame = undefined;
      const container = scrollElem.value;
      const footer: HTMLElement | undefined = footerComponent.value?.$el;
      const field = document.activeElement;
      if (!container || !footer || !isTextField(field) || !container.contains(field)) {
        return;
      }
      // InputField's visible box
      const fieldRect = (field.closest('.input-wrapper') ?? field).getBoundingClientRect();
      const visibleTop = headerElem.value?.getBoundingClientRect().bottom
        ?? container.getBoundingClientRect().top;
      const lift = Math.min(
        fieldRect.bottom - footer.getBoundingClientRect().top,
        fieldRect.top - visibleTop,
      );
      if (lift > 0) {
        // A fractional scroll offset can be rounded down
        container.scrollTop += Math.ceil(lift);
      }
    }

    function scheduleFocusedFieldReveal() {
      if (isScrollable.value && revealFrame === undefined) {
        revealFrame = requestAnimationFrame(revealFocusedField);
      }
    }

    function onBackButtonHandler(event: BackButtonEvent) {
      event.detail.register(100, handleClose);
    }

    onMounted(() => {
      if (props.initializeViewport) {
        setScrollConf(false);
        initViewport(scrollElem.value!);
      }
      document.addEventListener('ionBackButton', onBackButtonHandler);
      document.addEventListener('keydown', handleKeydown);
      window.addEventListener('resize', scheduleFocusedFieldReveal);
      if (!document.body.style.overflow) {
        document.body.style.overflow = 'hidden';
      }
    });

    onBeforeUnmount(() => {
      if (props.initializeViewport) {
        setScrollConf(false);
        initViewport(undefined);
      }
      document.removeEventListener('ionBackButton', onBackButtonHandler);
      document.removeEventListener('keydown', handleKeydown);
      forgetModal();
      window.removeEventListener('resize', scheduleFocusedFieldReveal);
      if (revealFrame !== undefined) {
        cancelAnimationFrame(revealFrame);
      }
      document.body.style.overflow = '';
    });

    return {
      handleClose,
      scheduleFocusedFieldReveal,
      IS_FIREFOX,
      IS_EXTENSION,
      scrollElem,
      headerElem,
      footerComponent,
      showHeader,
      transitionName,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

$container-shadow: 0 0 0 1px $color-border, 2px 4px 12px rgba($color-black, 0.22);

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
  backdrop-filter: blur(5px); // This is not working correctly in Firefox extension
  will-change: backdrop-filter;

  .container {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 92%;
    margin: auto;
    background-color: var(--screen-bg-color);
    border-radius: $border-radius-modal;
    box-shadow: $container-shadow;

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
      overflow-wrap: anywhere;
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
      overflow-wrap: anywhere;
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

    &:not(.transparent) .container {
      // Fill the home-indicator area without changing the content or footer position.
      box-shadow: 0 env(safe-area-inset-bottom) 0 var(--screen-bg-color), $container-shadow;
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

  &.semi-dense {
    --screen-padding-x: 12px;
  }

  &.no-bg-blur {
    backdrop-filter: none;
  }

  &.no-padding {
    --screen-padding-x: 0;
  }

  &.no-padding-bottom {
    .body {
      padding-bottom: 0;
    }
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
