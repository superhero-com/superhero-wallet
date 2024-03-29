<template>
  <Modal
    v-if="browserReader || !cameraAllowed"
    class="qr-code-reader"
    has-close-button
    centered
    from-bottom
    @close="cancelReading"
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
      v-text="cameraAllowed ? title : $t('modals.qrCodeReader.subtitle')"
    />

    <div class="camera">
      <span class="video-loader">
        <AnimatedSpinnerIcon class="spinner" />
      </span>
      <div v-show="cameraAllowed">
        <video
          ref="qrCodeVideoEl"
          class="video"
        >
          <track kind="captions" title="Scanning Qr Code" />
        </video>
      </div>
    </div>
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
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  defineComponent,
} from 'vue';
import { useRoute } from 'vue-router';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Camera } from '@capacitor/camera';
import type { BrowserQRCodeReader as BrowserQRCodeReaderType, IScannerControls } from '@zxing/browser';
import { useI18n } from 'vue-i18n';

import { IS_EXTENSION, IS_MOBILE_APP } from '@/constants';
import { handleUnknownError, openInNewWindow } from '@/utils';
import { NoUserMediaPermissionError, RejectedByUserError } from '@/lib/errors';
import { useUi } from '@/composables';

import Modal from '@/popup/components/Modal.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import IconBoxed from '@/popup/components/IconBoxed.vue';

import AnimatedSpinnerIcon from '@/icons/animated-spinner.svg?skip-optimize';
import QrScanIcon from '@/icons/qr-scan.svg?vue-component';

const SCANNER_ACTIVE_CLASS = 'scanner-active';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    IconBoxed,
    AnimatedSpinnerIcon,
  },
  props: {
    title: { type: String, required: true },
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
  },
  setup(props) {
    // allow camera while QRScanner is loading to not show cameraNotAllowed before actual check
    // eslint-disable-next-line no-undef
    const cameraStatus = ref<PermissionState>(
      IS_MOBILE_APP ? 'granted' : 'denied',
    );
    const browserReader = ref<BrowserQRCodeReaderType>();
    const browserReaderControls = ref<IScannerControls>();
    const qrCodeVideoEl = ref<HTMLVideoElement>();

    const route = useRoute();
    const { t } = useI18n();
    const { setQrScanner } = useUi();

    const cameraAllowed = computed(() => cameraStatus.value === 'granted');
    const heading = computed(() => {
      if (cameraStatus.value === 'granted') return t('modals.qrCodeReader.scanQr');
      return t('modals.qrCodeReader.grantPermission');
    });

    async function initBrowserReader() {
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      browserReader.value = new BrowserQRCodeReader();
    }

    function stopReading() {
      if (IS_MOBILE_APP) {
        document.querySelector('body')?.classList.remove(SCANNER_ACTIVE_CLASS);
        BarcodeScanner.showBackground();
        setQrScanner(false);
        BarcodeScanner.stopScan();
      } else {
        browserReaderControls.value?.stop();
      }
    }

    async function scan() {
      if (IS_MOBILE_APP) {
        setQrScanner(true);

        document.querySelector('body')?.classList.add(SCANNER_ACTIVE_CLASS);
        await BarcodeScanner.hideBackground();
        setTimeout(() => {
          document.querySelector('#camera-close-btn')?.addEventListener('click', stopReading);
        }, 500);
        const result = await BarcodeScanner.startScan();
        if (result.hasContent) {
          return result.content;
        }
        return new Error('No content');
      }

      return new Promise((resolve) => {
        browserReader.value?.decodeFromVideoDevice(
          undefined,
          qrCodeVideoEl.value,
          (result, _, controls) => {
            browserReaderControls.value = controls;
            if (result) {
              controls?.stop();
              resolve(result.getText());
            }
          },
        ).catch((error) => {
          if (error.name === 'NotAllowedError') {
            cameraStatus.value = 'denied';
            return;
          }
          handleUnknownError(error);
        });
      });
    }

    async function hasPermission() {
      // check if user already granted permission
      const status = await Camera.checkPermissions();

      if (status.camera === 'granted') {
        return true;
      }

      const statusRequest = await Camera.requestPermissions({ permissions: ['camera'] });

      if (statusRequest.camera === 'granted') {
        return true;
      }
      return false;
    }

    function cancelReading() {
      stopReading();
      props.reject(new RejectedByUserError());
    }

    function openSettings() {
      BarcodeScanner.openAppSettings();
    }

    function getExtensionPermission() {
      if (IS_EXTENSION) {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then(() => {
            cameraStatus.value = 'granted';
          }).catch(() => {
            openInNewWindow(
              browser.runtime.getURL('./CameraRequestPermission.html'),
            );
            props.reject(new NoUserMediaPermissionError());
          });
      }
    }

    watch(cameraStatus, async (value) => {
      if (value === 'denied') {
        stopReading();
        return;
      }
      if (IS_EXTENSION && value === 'prompt') {
        getExtensionPermission();
      }

      try {
        props.resolve(await scan());
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          try {
            await new Promise((resolve, reject) => {
              if (IS_EXTENSION) {
                getExtensionPermission();
                reject();
              }
              if (navigator.mediaDevices?.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ video: true }).then(resolve, reject);
              } else reject(new Error('Sorry, your browser does not support getUserMedia'));
            });
          } catch {
            cameraStatus.value = 'denied';
          }
          return;
        }
        handleUnknownError(error);
      }
    });

    watch(() => route.fullPath, () => {
      props.resolve();
    });

    onMounted(async () => {
      if (IS_MOBILE_APP) {
        if (await hasPermission()) {
          cameraStatus.value = 'granted';
          await BarcodeScanner.prepare();
        } else {
          cameraStatus.value = 'denied';
          return;
        }
        props.resolve(await scan());
        return;
      }

      await initBrowserReader();
      const status = navigator.permissions
        // eslint-disable-next-line no-undef
        && (await navigator.permissions.query({ name: 'camera' as PermissionName }).catch((error) => {
          const firefoxExceptionMessage = "'camera' (value of 'name' member of PermissionDescriptor) is not a valid value for enumeration PermissionName.";
          if (error.message !== firefoxExceptionMessage) {
            handleUnknownError(error);
          }
          return null;
        }));
      if (status) {
        cameraStatus.value = status.state;
        status.onchange = () => {
          cameraStatus.value = status.state;
        };
        return;
      }
      cameraStatus.value = IS_EXTENSION ? 'prompt' : 'granted';
    });

    onBeforeUnmount(() => {
      stopReading();
    });

    return {
      cameraAllowed,
      browserReader,
      IS_MOBILE_APP,
      heading,
      QrScanIcon,
      cancelReading,
      openSettings,
      qrCodeVideoEl,
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

    .video-loader {
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      z-index: -1;

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
