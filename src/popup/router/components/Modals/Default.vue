<template>
  <Modal
    :class="{
      'text-center': textCenter
    }"
    has-close-button
    :full-screen="fullScreen"
    v-on="{ close: close || resolve }"
  >
    <div class="icon-box">
      <StatusIcon
        :status="icon"
        class="icon"
      />
    </div>

    <h2 class="text-heading-2 text-center">
      {{ title }}
    </h2>

    <slot name="msg">
      {{ msg }}
    </slot>

    <slot />

    <slot
      v-if="$slots.footer"
      slot="footer"
      name="footer"
    />
    <Button
      v-else
      slot="footer"
      :class="{ 'center-button': textCenter }"
      @click="resolve"
    >
      {{ buttonMessage || $t('ok') }}
    </Button>
  </Modal>
</template>

<script>
import Modal from '../Modal.vue';
import Button from '../Button.vue';
import StatusIcon from '../StatusIcon.vue';

export default {
  components: { Modal, Button, StatusIcon },
  props: {
    resolve: { type: Function, required: true },
    close: { type: Function, default: null },
    title: { type: String, default: '' },
    msg: { type: String, default: '' },
    type: { type: String, default: '' },
    icon: { type: String, default: '' },
    buttonMessage: { type: String, default: '' },
    textCenter: Boolean,
    fullScreen: Boolean,
  },
};
</script>
<style lang="scss" scoped>
@use '../../../../styles/variables';
@use '../../../../styles/mixins';

.icon-box {
  @include mixins.flex(center, center, column);

  gap: 20px;

  .icon {
    padding: 4px;
    border: 4px solid variables.$color-disabled;
    border-radius: 200%;
    height: 64px;
    width: 64px;
    margin-bottom: 20px;
    background-color: variables.$color-bg-1;
  }

  .center-button {
    width: auto;
    padding: 0 24px;
  }
}
</style>
