<template>
  <CopyText
    :value="getURFromFragments(value)"
    :copied="externalCopied"
    hide-icon
  >
    <div class="qr-code">
      <div
        ref="canvas"
        class="canvas"
      />
    </div>
  </CopyText>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  onUnmounted,
  PropType,
  ref,
  watch,
} from 'vue';
import QRCodeStyling, { TypeNumber } from 'qr-code-styling';

import { getURFromFragments } from '@/utils';

import CopyText from '@/popup/components/CopyText.vue';

import SHLogo from '@/icons/logo-small-blue.webp';

export default defineComponent({
  name: 'QrCode',
  components: {
    CopyText,
  },
  props: {
    value: { type: Array as PropType<string[]>, required: true },
    size: { type: Number, required: true },
    typeNumber: { type: Number as PropType<TypeNumber>, default: 10 },
    externalCopied: Boolean,
  },
  setup(props) {
    const canvas = ref<HTMLElement>();
    const fragmentIndex = ref(0);
    let qrCodeRefreshTimer: NodeJS.Timeout;

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

    async function updateQrCodeData() {
      if (props.value.length > 1) {
        qrCode.update({ data: props.value[fragmentIndex.value] });
        await qrCode._canvasDrawingPromise;
        qrCodeRefreshTimer = setTimeout(() => {
          fragmentIndex.value = (fragmentIndex.value + 1) % props.value.length;
        }, 750);
      } else {
        qrCode.update({ data: props.value[fragmentIndex.value] });
      }
    }

    watch([fragmentIndex, () => props.value], () => {
      if (qrCodeRefreshTimer) {
        clearInterval(qrCodeRefreshTimer);
      }
      updateQrCodeData();
    });

    onMounted(() => {
      qrCode.append(canvas.value);
      updateQrCodeData();
    });

    onUnmounted(() => {
      clearInterval(qrCodeRefreshTimer);
    });

    return {
      canvas,
      getURFromFragments,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.qr-code {
  position: relative;

  .canvas {
    cursor: pointer;
    display: contents;
  }

  .copied {
    @extend %face-sans-12-regular;
    @include mixins.dashed-border;

    position: absolute;
    z-index: 1;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    background-color: $color-bg-4;
    text-transform: uppercase;

    .copy-icon {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
    }
  }
}
</style>
