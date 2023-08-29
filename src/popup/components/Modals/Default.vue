<template>
  <Modal
    class="default"
    :class="{
      'text-center': textCenter
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

    <h2 class="text-heading-2 text-center title">
      {{ title }}
    </h2>

    <slot name="msg">
      <TemplateRenderer
        :str="msg"
      />
    </slot>

    <slot />

    <template #footer>
      <slot name="footer">
        <BtnMain
          :class="{ 'center-button': textCenter }"
          @click="resolve"
        >
          {{ buttonMessage || $t('common.ok') }}
        </BtnMain>
      </slot>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ResolveCallback, StatusIconType } from '../../../types';
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
    msg: { type: String, default: '' },
    icon: { type: String as PropType<StatusIconType>, default: '' },
    buttonMessage: { type: String, default: '' },
    textCenter: Boolean,
    fullScreen: Boolean,
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/mixins';

.default {
  .title {
    margin-bottom: 16px;
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
