<template>
  <FormTextarea
    class="form-scan-qr-result"
    :model-value="modelValue"
    :label="label"
    :placeholder="placeholder"
    :auto-height="autoHeight"
    size="xxs"
    resizable
    @input="$emit('update:modelValue', $event.target.value)"
  >
    <template #label-after>
      <BtnIcon
        :icon="QrScanIcon"
        data-cy="scan-button"
        @click="scanQr()"
      />
    </template>
  </FormTextarea>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useModals } from '@/composables';

import FormTextarea from './FormTextarea.vue';
import BtnIcon from '../buttons/BtnIcon.vue';

import QrScanIcon from '../../../icons/qr-scan.svg?vue-component';

export default defineComponent({
  components: {
    FormTextarea,
    BtnIcon,
  },
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    label: { type: String, default: '' },
    qrTitle: { type: String, default: '' },
    autoHeight: Boolean,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { openScanQrModal } = useModals();

    async function scanQr() {
      const result = await openScanQrModal({
        title: props.qrTitle,
      }).catch(() => null); // closing the modal rejects the promise
      if (result) {
        emit('update:modelValue', result);
      }
    }

    return {
      QrScanIcon,
      scanQr,
    };
  },
});
</script>
