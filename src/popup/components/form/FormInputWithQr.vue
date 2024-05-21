<template>
  <FormTextarea
    class="form-input-with-qr"
    :model-value="modelValue"
    :label="label"
    :placeholder="placeholder"
    size="xxs"
    resizable
    @input="$emit('update:modelValue', $event.target.value)"
  >
    <template #label-after>
      <BtnPlain
        class="scan-button"
        data-cy="scan-button"
        @click="scanQr()"
      >
        <QrScanIcon />
      </BtnPlain>
    </template>
  </FormTextarea>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { MODAL_READ_QR_CODE } from '@/constants';
import { useModals } from '@/composables';

import FormTextarea from './FormTextarea.vue';
import BtnPlain from '../buttons/BtnPlain.vue';

import QrScanIcon from '../../../icons/qr-scan.svg?vue-component';

export default defineComponent({
  components: {
    FormTextarea,
    BtnPlain,
    QrScanIcon,
  },
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    label: { type: String, default: '' },
    qrIcon: { type: String, default: '' },
    qrTitle: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { openModal } = useModals();

    async function scanQr() {
      const result = await openModal(MODAL_READ_QR_CODE, {
        title: props.qrTitle,
        icon: props.qrIcon,
      }).catch(() => null); // closing the modal rejects the promise
      if (result) {
        emit('update:modelValue', result);
      }
    }

    return {
      scanQr,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.form-input-with-qr{
  .scan-button {
    color: $color-white;
    display: block;
    width: 32px;
    height: 24px;
  }
}
</style>
