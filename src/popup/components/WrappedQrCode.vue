<template>
  <div class="qrcode-wrapper">
    <QrCode
      v-if="value"
      class="qrcode"
      :value="value"
      :size="size"
      :type-number="typeNumber"
      :external-copied="externalCopied"
    />
    <slot />
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { TypeNumber } from 'qr-code-styling';

import QrCode from '@/popup/components/QrCode.vue';

export default defineComponent({
  name: 'WrappedQrCode',
  components: {
    QrCode,
  },
  props: {
    value: { type: Array as PropType<string[]>, required: true },
    size: { type: Number, required: true },
    typeNumber: { type: Number as PropType<TypeNumber>, default: 10 },
    externalCopied: Boolean,
  },
});
</script>
<style lang="scss" scoped>
@use '@/styles/variables' as *;

  .qrcode-wrapper {
    margin-top: 10px;
    text-align: center;

    .qrcode {
      display: inline-flex;
      padding: 8px;
      background-color: $color-white;
      border-radius: 12px;
    }
  }
</style>
