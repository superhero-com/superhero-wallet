<template>
  <Modal
    class="default"
    :class="{
      'text-center': textCenter,
    }"
    has-close-button
    :full-screen="fullScreen"
    v-on="{ close: close || resolve }"
  >
    <div
      v-if="icon"
      class="top-icon-wrapper"
    >
      <IconBoxed>
        <StatusIcon
          :status="icon"
          class="status-icon"
        />
      </IconBoxed>
    </div>

    <h2
      v-if="title"
      class="text-heading-4 text-center title"
      :class="{ 'without-margin': subtitle }"
      v-text="title"
    />

    <h2
      v-if="subtitle"
      class="text-heading-5 text-center subtitle"
      v-text="subtitle"
    />

    <slot name="msg">
      <TemplateRenderer
        :str="msg"
        data-cy="message"
      />
    </slot>

    <slot />

    <template #footer>
      <slot name="footer">
        <BtnMain
          :class="{ 'center-button': textCenter }"
          :text="buttonMessage || $t('common.ok')"
          @click="resolve"
        />
      </slot>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ResolveCallback, StatusIconType } from '@/types';
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import StatusIcon from '../StatusIcon.vue';
import TemplateRenderer from '../TemplateRenderer.vue';
import IconBoxed from '../IconBoxed.vue';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    TemplateRenderer,
    StatusIcon,
    IconBoxed,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    close: { type: Function, default: null },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    msg: { type: String, default: '' },
    icon: { type: String as PropType<StatusIconType>, default: '' },
    buttonMessage: { type: String, default: '' },
    textCenter: Boolean,
    fullScreen: Boolean,
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/mixins';

.default {
  .title {
    margin-bottom: 16px;

    &.without-margin {
      margin-bottom: 0;
    }
  }

  .subtitle {
    color: inherit;
    font-weight: 400;
    margin-bottom: 16px;
    margin-top: 4px;
  }

  .top-icon-wrapper {
    margin-bottom: 20px;
    text-align: center;
  }

  .center-button {
    width: auto;
    padding: 0 24px;
  }
}
</style>
