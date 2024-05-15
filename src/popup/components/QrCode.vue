<template>
  <div class="qr-code">
    <div
      ref="canvas"
      class="canvas"
      @click="copyData()"
    />
    <div
      v-if="copied || externalCopied"
      class="copied"
    >
      <CopyOutlinedIcon class="copy-icon" />
      {{ $t('common.addressCopied') }}
    </div>
  </div>
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
import { useCopy } from '@/composables';

import SHLogo from '@/icons/logo-small-blue.webp';
import CopyOutlinedIcon from '@/icons/copy-outlined.svg?vue-component';

export default defineComponent({
  name: 'QrCode',
  components: {
    CopyOutlinedIcon,
  },
  props: {
    value: { type: Array as PropType<string[]>, required: true },
    size: { type: Number, required: true },
    typeNumber: { type: Number as PropType<TypeNumber>, default: 10 },
    externalCopied: Boolean,
  },
  setup(props) {
    const canvas = ref<HTMLElement>();
    const updateQrCode = ref();
    const fragmentIndex = ref(0);

    const { copy, copied } = useCopy();

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

    function copyData() {
      copy(props.value.join(''));
    }

    watch(() => props.value, () => {
      if (updateQrCode.value) {
        clearInterval(updateQrCode.value);
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
      copied,
      copyData,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/typography';
@use '../../styles/mixins';

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
