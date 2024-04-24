<template>
  <!--
    Web and extension:
      Display the video stream inside of the modal box.

    Mobile:
      Display the device settings button if user has no camera access.
      The camera stream is placed as separate full screen layer above the app (see App.vue).
  -->
  <Modal
    v-if="!IS_MOBILE_APP || !cameraPermissionGranted"
    class="qr-code-reader"
    has-close-button
    centered
    from-bottom
    @close="closeQrCodeReaderModal"
  >
    <div class="top-icon-wrapper">
      <IconBoxed :icon="QrScanIcon" />
    </div>
    <div
      v-if="heading"
      class="heading"
      v-text="heading"
    />
    <div
      class="subtitle"
      v-text="subtitle"
    />

    <div class="camera">
      <span class="video-loader">
        <AnimatedSpinnerIcon class="spinner" />
      </span>
      <div
        v-show="isCameraReady"
        class="video-wrapper"
      >
        <video
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
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import type { BrowserQRCodeReader as BrowserQRCodeReaderType, IScannerControls } from '@zxing/browser';
import { useI18n } from 'vue-i18n';

import type { RejectCallback, ResolveCallback } from '@/types';
import { IS_EXTENSION, IS_MOBILE_APP } from '@/constants';
import {
  checkOrRequestDeviceCameraPermission,
  checkDeviceHasCamera,
  handleUnknownError,
} from '@/utils';
import { NoUserMediaPermissionError, RejectedByUserError } from '@/lib/errors';
import { useUi } from '@/composables';

import Modal from '@/popup/components/Modal.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import IconBoxed from '@/popup/components/IconBoxed.vue';

import AnimatedSpinnerIcon from '@/icons/animated-spinner.svg?skip-optimize';
import QrScanIcon from '@/icons/qr-scan.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    IconBoxed,
    AnimatedSpinnerIcon,
  },
  props: {
    title: { type: String, required: true },
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
  },
  setup(props) {
    const route = useRoute();
    const { t } = useI18n();
    const { setMobileQrScannerVisible } = useUi();

    const qrCodeVideoEl = ref<HTMLVideoElement>();
    const hasDeviceCamera = ref(false);
    const isCameraReady = ref(false);
    const cameraPermissionGranted = ref(true);

    let browserReader: BrowserQRCodeReaderType | null = null;
    let browserReaderControls: IScannerControls | null = null;

    const heading = computed((): string => {
      switch (true) {
        case !hasDeviceCamera.value: return t('modals.qrCodeReader.noWebcam');
        case !cameraPermissionGranted.value: return t('modals.qrCodeReader.grantPermission');
        default: return t('modals.qrCodeReader.scanQr');
      }
    });

    const subtitle = computed((): string => {
      switch (true) {
        case !hasDeviceCamera.value: return t('modals.qrCodeReader.noWebcamSubtitle');
        case isCameraReady.value: return props.title;
        default: return t('modals.qrCodeReader.subtitle');
      }
    });

    function stopReading() {
      if (IS_MOBILE_APP) {
        setMobileQrScannerVisible(false);
        BarcodeScanner.showBackground();
        BarcodeScanner.stopScan();
      } else {
        browserReaderControls?.stop();
      }
    }

    async function scanMobile(): Promise<string | Error> {
      setMobileQrScannerVisible(true);
      await BarcodeScanner.hideBackground();
      setTimeout(() => {
        document.querySelector('#camera-close-btn')?.addEventListener('click', stopReading);
      }, 500);
      const result = await BarcodeScanner.startScan();
      return (result.hasContent)
        ? result.content
        : new Error('No content');
    }

    function scanWeb() {
      return new Promise<string>((resolve) => {
        browserReader?.decodeFromVideoDevice(
          undefined,
          qrCodeVideoEl.value,
          (result, _, controls) => {
            browserReaderControls = controls;
            if (result) {
              controls?.stop();
              resolve(result.getText());
            }
          },
        ).catch((error) => {
          if (error.name === 'NotAllowedError') {
            cameraPermissionGranted.value = false;
          } else {
            handleUnknownError(error);
          }
        });
      });
    }

    function closeQrCodeReaderModal() {
      stopReading();
      props.reject(new RejectedByUserError());
    }

    function openSettings() {
      BarcodeScanner.openAppSettings();
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

      if (IS_MOBILE_APP) {
        // TODO Research if the BarcodeScanner could be imported dynamically
        await BarcodeScanner.prepare();
        isCameraReady.value = true;
        props.resolve(await scanMobile());
      } else {
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        browserReader = new BrowserQRCodeReader();
        isCameraReady.value = true;
        props.resolve(await scanWeb());
      }
    });

    onBeforeUnmount(() => {
      stopReading();
    });

    return {
      IS_MOBILE_APP,
      isCameraReady,
      hasDeviceCamera,
      cameraPermissionGranted,
      heading,
      subtitle,
      QrScanIcon,
      qrCodeVideoEl,
      closeQrCodeReaderModal,
      openSettings,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/mixins';
@use '../../../styles/typography';

.qr-code-reader {
  .top-icon-wrapper {
    margin: 0 auto 16px auto;
    text-align: center;
    color: variables.$color-primary;
  }

  .camera {
    --camera-size: 312px;

    margin: 20px auto 0;
    width: var(--camera-size);
    height: var(--camera-size);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
    background: rgba(variables.$color-white, 0.05);
    overflow: hidden;

    .video {
      height: var(--camera-size);

      @include mixins.mobile {
        height: unset;
        width: var(--camera-size);
      }
    }

    .video-wrapper {
      z-index: 1;
    }

    .video-loader {
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      z-index: 0;

      .spinner {
        width: 56px;
        height: 56px;
      }
    }
  }

  .heading {
    @extend %face-sans-19-medium;

    color: variables.$color-white;
  }

  .subtitle,
  .title {
    @extend %face-sans-16-regular;

    margin-top: 4px;
    margin-bottom: 20px;
    line-height: 24px;
    color: rgba(variables.$color-white, 0.75);
  }
}
</style>
