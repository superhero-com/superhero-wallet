<template>
  <Default
    v-bind="$attrs"
    :icon="icon || 'info'"
    :full-screen="fullScreen"
    class="help-modal"
    :class="{ 'show-above-all': showAboveAll }"
  >
    <template #msg>
      <TemplateRenderer
        :str="msg"
        :option="option"
        class="help-template-renderer"
      />
    </template>
  </Default>
</template>

<script>
import Default from './Default.vue';
import TemplateRenderer from '../TemplateRenderer.vue';

export default {
  components: {
    Default,
    TemplateRenderer,
  },
  props: {
    msg: { type: String, default: '' },
    option: { type: Object, default: null },
    icon: { type: String, default: null },
    fullScreen: Boolean,
    showAboveAll: Boolean,
  },
};
</script>

<style lang="scss">
@use '@/styles/variables' as *;

.help-modal {
  &.show-above-all {
    z-index: $z-index-login-modal;
  }

  .help-template-renderer {
    p {
      margin-top: 8px;
    }

    ol {
      text-align: left;
      list-style-type: none;
      counter-reset: list-number;

      li {
        margin-bottom: 18px;

        &::before {
          counter-increment: list-number;
          content: counter(list-number);
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 2px;
          width: 24px;
          height: 24px;
          position: absolute;
          left: 24px;
          background: rgba($color-white, 0.03);
          border: 2px solid rgba($color-white, 0.15);
          border-radius: 28px;
        }
      }
    }
  }
}
</style>
