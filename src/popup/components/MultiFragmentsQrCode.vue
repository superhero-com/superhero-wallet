<template>
  <div ref="canvas" />
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  onUnmounted,
  PropType,
  ref,
  watch,
} from '@vue/composition-api';
import QRCodeStyling, { TypeNumber } from 'qr-code-styling';
import SHLogo from '../../icons/logo-small-blue.png';

export default defineComponent({
  name: 'MultiFragmentsQrCode',
  props: {
    value: { type: Array as PropType<string[]>, required: true },
    size: { type: Number, required: true },
    typeNumber: { type: Number as PropType<TypeNumber>, default: 10 },
  },
  setup(props) {
    const canvas = ref<HTMLElement>();
    const updateQrCode = ref();
    const fragmentIndex = ref(0);

    const qrCode = new QRCodeStyling({
      data: props.value[fragmentIndex.value],
      width: props.size,
      height: props.size,
      margin: 0,
      qrOptions: {
        typeNumber: props.typeNumber,
        mode: 'Byte',
        errorCorrectionLevel: 'M',
      },
      imageOptions: {
        hideBackgroundDots: false,
        imageSize: 0.7,
        margin: 0,
      },
      image: SHLogo,
    });

    function updateQrCodeData() {
      if (props.value.length > 1) {
        updateQrCode.value = setInterval(() => {
          qrCode.update({ data: props.value[fragmentIndex.value] });
          fragmentIndex.value = (fragmentIndex.value + 1) % props.value.length;
        }, 500);
      } else {
        qrCode.update({ data: props.value[fragmentIndex.value] });
      }
    }

    watch(() => props.value, () => {
      if (updateQrCode.value) {
        clearTimeout(updateQrCode.value);
      }
    });

    onMounted(() => {
      qrCode.append(canvas.value);
      updateQrCodeData();
    });

    onUnmounted(() => {
      clearInterval(updateQrCode.value);
    });

    return {
      canvas,
    };
  },
});
</script>
