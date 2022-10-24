<template>
  <div ref="canvas" />
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  watch,
} from '@vue/composition-api';
import QRCodeStyling from '@solana/qr-code-styling';
import SHLogo from '../../icons/logo-small-blue.png';

export default defineComponent({
  name: 'QrCode',
  props: {
    value: { type: String, required: true },
    size: { type: Number, required: true },
  },
  setup(props) {
    const canvas = ref<HTMLElement>();

    const qrCode = new QRCodeStyling({
      data: props.value,
      width: props.size,
      height: props.size,
      margin: 0,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: 'Q',
      },
      imageOptions: {
        hideBackgroundDots: false,
        imageSize: 0.4,
        margin: 0,
      },
      dotsOptions: { type: 'square', color: '#1161fe' },
      image: SHLogo,
      cornersSquareOptions: { type: 'square', color: '#6da0fe' },
      cornersDotOptions: { type: 'square', color: '#1161fe' },
    });

    watch(() => props.value, (data: string) => qrCode.update({ data }));
    onMounted(() => qrCode.append(canvas.value));

    return {
      canvas,
    };
  },
});
</script>
