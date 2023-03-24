<template>
  <div ref="canvas" />
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  PropType,
  ref,
  watch,
} from 'vue';
import QRCodeStyling, { TypeNumber } from 'qr-code-styling';
import SHLogo from '../../icons/logo-small-blue.webp';

export default defineComponent({
  name: 'QrCode',
  props: {
    value: { type: String, required: true },
    size: { type: Number, required: true },
    typeNumber: { type: Number as PropType<TypeNumber>, default: 10 },
  },
  setup(props) {
    const canvas = ref<HTMLElement>();
    const updateQrCode = ref();

    const qrCode = new QRCodeStyling({
      data: props.value,
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

    watch(() => props.value, (data: string) => {
      if (updateQrCode.value) {
        clearTimeout(updateQrCode.value);
      }

      updateQrCode.value = setTimeout(() => {
        qrCode.update({ data });
      }, 500);
    });
    onMounted(() => qrCode.append(canvas.value));

    return {
      canvas,
    };
  },
});
</script>
