<template>
  <Modal
    v-if="browserReader || !cameraAllowed"
    class="qr-code-reader"
    has-close-button
    centered
    from-bottom
    @close="resolve"
  >
    <div class="top-icon-wrapper">
      <IconBoxed :icon="QrScanIcon" />
    </div>

    <span v-if="cameraAllowed">{{ title }}</span>
    <span v-else>
      {{ $t('modals.qrCodeReader.grantPermission') }}
      <div class="subtitle">{{ $t('modals.qrCodeReader.subtitle') }}</div>
    </span>

    <div class="camera">
      <span
        v-if="!cameraAllowed"
        class="video-title"
      >
        {{ $t('modals.qrCodeReader.cameraNotAllowedFirst') }}
        <p class="second-text">
          {{ $t('modals.qrCodeReader.cameraNotAllowedSecond') }}
        </p>
      </span>
      <div v-show="cameraAllowed">
        <video
          ref="qrCodeVideo"
          class="video"
        />
      </div>
    </div>
    <template #footer>
      <BtnMain
        :variant="mobile ? 'secondary' : 'primary'"
        :extend="!mobile"
        :text="$t('common.ok')"
        @click="cancelReading"
      />
      <BtnMain
        v-if="mobile"
        :text="$t('modals.qrCodeReader.settings')"
        @click="openSettings"
      />
    </template>
  </Modal>
</template>

<script>
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { mapMutations } from 'vuex';
import { RejectedByUserError } from '../../../lib/errors';
import { IS_EXTENSION, IS_MOBILE_APP } from '../../../lib/environment';
import { handleUnknownError, openInNewWindow } from '../../utils';
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import QrScanIcon from '../../../icons/qr-scan.svg?vue-component';
import IconBoxed from '../IconBoxed.vue';

export default {
  components: {
    Modal,
    BtnMain,
    IconBoxed,
  },
  props: {
    title: { type: String, required: true },
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
  },
  setup() {
    return {
      QrScanIcon,
    };
  },
  data: () => ({
    mobile: IS_MOBILE_APP,
    // allow camera while QRScanner is loading to not show cameraNotAllowed before actual check
    cameraAllowed: IS_MOBILE_APP,
    browserReader: null,
    videoInputDevices: [],
    headerText: '',
  }),
  watch: {
    async cameraAllowed(value) {
      if (!value) {
        this.stopReading();
        return;
      }

      try {
        this.resolve(await this.scan());
      } catch (error) {
        if (error.name === 'NotAllowedError') {
          try {
            await new Promise((resolve, reject) => {
              if (IS_EXTENSION) {
                openInNewWindow(
                  browser.extension.getURL('./CameraRequestPermission.html'),
                );
                reject();
              }
              if (navigator.mediaDevices?.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ video: true }).then(resolve, reject);
              } else reject(new Error('Sorry, your browser does not support getUserMedia'));
            });
          } catch {
            this.cameraAllowed = false;
          }
          return;
        }
        handleUnknownError(error);
      }
    },
    $route() {
      this.resolve();
    },
  },
  async mounted() {
    if (this.mobile) {
      try {
        await new Promise((resolve, reject) => BarcodeScanner.prepare((error, status) => (
          !error && status.authorized
            ? resolve() : reject(error || new Error('Denied to use the camera'))
        )));
      } catch {
        this.cameraAllowed = false;
      }
      this.resolve(await this.scan());
      return;
    }

    await this.initBrowserReader();
    const status = navigator.permissions
      && (await navigator.permissions.query({ name: 'camera' }).catch((error) => {
        const firefoxExceptionMessage = "'name' member of PermissionDescriptor 'camera' is not a valid value for enumeration PermissionName.";
        if (error.message !== firefoxExceptionMessage) handleUnknownError(error);
        return null;
      }));
    if (status) {
      this.cameraAllowed = status.state !== 'denied';
      status.onchange = () => {
        this.cameraAllowed = status.state !== 'denied';
      };
      return;
    }
    this.cameraAllowed = true;
  },
  beforeUnmount() {
    this.stopReading();
  },
  methods: {
    ...mapMutations(['setQrScanner']),
    async initBrowserReader() {
      const { BrowserQRCodeReader } = await import('@zxing/library');

      this.browserReader = new BrowserQRCodeReader();
    },
    async scan() {
      return this.mobile
        ? new Promise((resolve, reject) => {
          this.setQrScanner(true);
          window.plugins.webviewcolor.change('#00FFFFFF');
          BarcodeScanner.startScan((error, text) => (!error && text)
            ? resolve(text)
            : reject(error));
          BarcodeScanner.show();
          ['body', '#app', '.app-wrapper'].forEach((s) => {
            document.querySelector(s).style = 'background: transparent';
          });

          setTimeout(() => {
            document.querySelector('.camera-close-button').addEventListener('click', this.stopReading);
          }, 500);
        })
        : (
          await this.browserReader.decodeFromInputVideoDevice(undefined, this.$refs.qrCodeVideo)
        ).getText();
    },
    async stopReading() {
      if (this.mobile) {
        ['body', '#app', '.app-wrapper'].forEach((s) => {
          document.querySelector(s).style = 'background: #141414';
        });
        BarcodeScanner.showBackground();
        window.plugins.webviewcolor.change('#141414');
        this.setQrScanner(false);
        BarcodeScanner.stopScan();
      } else this.browserReader.reset();
    },
    cancelReading() {
      this.stopReading();
      this.reject(new RejectedByUserError());
    },
    openSettings() {
      BarcodeScanner.openAppSettings();
    },
  },
};
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
    margin-top: 20px;

    .video {
      max-width: 70vw;

      @include mixins.desktop {
        max-width: 100%;
      }
    }

    .video-title {
      @extend %face-sans-14-regular;

      color: rgba(variables.$color-white, 0.85);
      line-height: 20px;
    }

    .second-text {
      margin-top: 20px;
    }
  }

  .subtitle {
    @extend %face-sans-16-medium;

    margin-top: 4px;
    margin-bottom: 20px;
    line-height: 24px;
    color: rgba(variables.$color-white, 0.75);
  }
}
</style>
