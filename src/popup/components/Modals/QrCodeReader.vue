<template>
  <!--
    Web and extension:
      Display the video stream inside of the modal box.

    Mobile:
      Display the device settings button if user has no camera access.
      The camera stream is placed as separate full screen layer above the app.
      (see QrCodeReaderMobileOverlay.vue)
  -->
  <Modal
    v-if="!IS_MOBILE_APP || !cameraPermissionGranted"
    class="qr-code-reader"
    has-close-button
    centered
    from-bottom
    semi-dense
    @close="closeQrCodeReaderModal()"
  >
    <div class="top-icon-wrapper">
      <IconBoxed :icon="QrScanIcon" />
    </div>
    <div
      class="heading"
      v-text="$t('modals.qrCodeReader.scanQr')"
    />
    <div
      v-if="title"
      class="title"
      v-text="title"
    />

    <div class="camera">
      <div class="camera-inner">
        <div
          v-if="!hasDeviceCamera"
          class="camera-message"
        >
          <AlertIcon class="icon-alert color-warning" />
          <p class="text-heading-1 color-warning">{{ $t('modals.qrCodeReader.noWebcam') }}</p>
          <p class="color-warning-muted">{{ $t('modals.qrCodeReader.noWebcamSubtitle') }}</p>
        </div>
        <div
          v-else-if="!cameraPermissionGranted"
          class="camera-message"
        >
          <AlertIcon class="icon-alert color-warning" />
          <p class="text-heading-1 color-warning">{{ $t('modals.qrCodeReader.grantPermission') }}</p>
        </div>
        <AnimatedSpinnerIcon
          v-else
          class="spinner"
        />

        <video
          v-show="isCameraReady"
          ref="qrCodeVideoEl"
          class="video"
        >
          <track kind="captions" title="Scanning Qr Code" />
        </video>
      </div>
    </div>

    <!--
      Allow user to open mobile device settings if no camera permission is granted.
    -->
    <template
      v-if="IS_MOBILE_APP"
      #footer
    >
      <BtnMain
        :text="$t('modals.qrCodeReader.settings')"
        @click="openSettings"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  defineComponent,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import type QrScannerType from 'qr-scanner';

import type { RejectCallback, ResolveCallback } from '@/types';
import { IS_EXTENSION, IS_MOBILE_APP } from '@/constants';
import { checkOrRequestDeviceCameraPermission, checkDeviceHasCamera } from '@/utils';
import { NoUserMediaPermissionError, RejectedByUserError } from '@/lib/errors';
import { useUi } from '@/composables';

import Modal from '@/popup/components/Modal.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import IconBoxed from '@/popup/components/IconBoxed.vue';

import AnimatedSpinnerIcon from '@/icons/animated-spinner.svg?vue-component';
import QrScanIcon from '@/icons/qr-scan.svg?vue-component';
import AlertIcon from '@/icons/alert.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    IconBoxed,
    AnimatedSpinnerIcon,
    AlertIcon,
  },
  props: {
    title: { type: String, required: true },
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
  },
  setup(props) {
    const route = useRoute();
    const { setMobileQrScannerVisible } = useUi();

    const qrCodeVideoEl = ref<HTMLVideoElement>();
    const hasDeviceCamera = ref(false);
    const isCameraReady = ref(false);
    const cameraPermissionGranted = ref(true);

    let browserReader: QrScannerType | null = null;

    function stopReading() {
      if (IS_MOBILE_APP) {
        setMobileQrScannerVisible(false);
        BarcodeScanner.stopScan();
        BarcodeScanner.removeAllListeners();
      } else {
        browserReader?.stop();
        browserReader?.destroy();
        browserReader = null;
      }
    }

    async function scanMobile(): Promise<string | Error> {
      setMobileQrScannerVisible(true);
      setTimeout(() => {
        document.querySelector('#camera-close-btn')?.addEventListener('click', stopReading);
      }, 500);

      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve) => {
        const listener = await BarcodeScanner.addListener(
          'barcodeScanned',
          async ({ barcode }) => {
            if (barcode.displayValue) {
              await listener.remove();
              stopReading();
              resolve(barcode.displayValue);
            }
          },
        );
        await BarcodeScanner.startScan();
      });
    }

    async function scanWeb() {
      const { default: QrScanner } = await import('qr-scanner');
      return new Promise<string>((resolve) => {
        browserReader = new QrScanner(
          qrCodeVideoEl.value!,
          (result) => {
            if (result.data) {
              stopReading();
              resolve(result.data);
            }
          },
          {},
        );
        browserReader.start();
      });
    }

    function closeQrCodeReaderModal() {
      stopReading();
      props.reject(new RejectedByUserError());
    }

    function openSettings() {
      BarcodeScanner.openSettings();
    }

    watch(() => route.fullPath, () => {
      props.resolve();
    });

    onMounted(async () => {
      hasDeviceCamera.value = await checkDeviceHasCamera();
      if (!hasDeviceCamera.value) {
        return;
      }

      cameraPermissionGranted.value = await checkOrRequestDeviceCameraPermission();
      if (!cameraPermissionGranted.value) {
        if (IS_EXTENSION) {
          // Lack of permission causes the extension window to close.
          // Rejecting the modal allows to save the form data before this happens.
          props.reject(new NoUserMediaPermissionError());
        }
        return;
      }

      isCameraReady.value = true;
      props.resolve((IS_MOBILE_APP) ? await scanMobile() : await scanWeb());
    });

    onBeforeUnmount(() => {
      stopReading();
    });

    return {
      IS_MOBILE_APP,
      isCameraReady,
      hasDeviceCamera,
      cameraPermissionGranted,
      QrScanIcon,
      qrCodeVideoEl,
      closeQrCodeReaderModal,
      openSettings,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/mixins';
@use '@/styles/typography';

.qr-code-reader {
  .top-icon-wrapper {
    margin: 0 auto 16px auto;
    text-align: center;
    color: $color-primary;
  }

  .camera {
    position: relative;
    padding-top: 100%; // Aspect ratio 1:1
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: $border-radius-interactive;
    background: rgba($color-white, 0.05);
    overflow: hidden;

    .camera-inner {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      .camera-message {
        padding-inline: 20px;

        .icon-alert {
          width: 48px;
        }
      }

      .video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .spinner {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 56px;
        transform: translateX(-50%) translateY(-50%);
      }
    }
  }

  .heading {
    @extend %face-sans-19-medium;

    color: $color-white;
  }

  .title {
    @extend %face-sans-16-regular;

    margin-top: 4px;
    margin-bottom: 20px;
    line-height: 24px;
    color: rgba($color-white, 0.75);
  }
}
</style>
