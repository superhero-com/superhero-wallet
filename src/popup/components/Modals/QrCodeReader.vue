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
    <InfoBox v-if="isMultiFragmentQr">
      {{ $t('modals.qrCodeReader.qrCodeHasMultipleFragments') }}
      <b>{{ scanProgress }}%</b>
    </InfoBox>

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
import { mapMutations } from 'vuex';
import { URDecoder } from '@ngraveio/bc-ur';
import { SerializerV3 } from '@airgap/serializer';
import bs58check from 'bs58check';
import { IS_EXTENSION, IS_CORDOVA } from '../../../lib/environment';
import { handleUnknownError, openInNewWindow } from '../../utils';
import { RejectedByUserError } from '../../../lib/errors';
import Modal from '../Modal.vue';
import InfoBox from '../InfoBox.vue';
import BtnMain from '../buttons/BtnMain.vue';
import QrScanIcon from '../../../icons/qr-scan.svg?vue-component';
import IconBoxed from '../IconBoxed.vue';

export default {
  components: {
    Modal,
    InfoBox,
    BtnMain,
    IconBoxed,
  },
  props: {
    title: { type: String, required: true },
    heading: { type: String, required: false, default: null },
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
  },
  setup() {
    return {
      QrScanIcon,
    };
  },
  data: () => ({
    mobile: IS_CORDOVA,
    // allow camera while QRScanner is loading to not show cameraNotAllowed before actual check
    cameraAllowed: IS_CORDOVA,
    browserReader: null,
    videoInputDevices: [],
    headerText: '',
    isMultiFragmentQr: false,
    scanProgress: 0,
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
        await new Promise((resolve, reject) => window.QRScanner.prepare((error, status) => (
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
  beforeDestroy() {
    this.stopReading();
  },
  methods: {
    ...mapMutations(['setQrScanner']),
    async initBrowserReader() {
      const { BrowserQRCodeReader } = await import('@zxing/library');

      this.browserReader = new BrowserQRCodeReader();
      this.decoder = new URDecoder();
    },
    async scan() {
      return this.mobile
        ? new Promise((resolve, reject) => {
          this.setQrScanner(true);
          window.plugins.webviewcolor.change('#00FFFFFF');

          window.QRScanner.scan(async (error, text) => {
            if (!error && text) {
              if (String(text).includes('BYTES/')) {
                this.decoder.receivePart(text);
                if (this.decoder.isComplete()) {
                  resolve(await this.getEncoderData());
                } else {
                  this.isMultiFragmentQr = true;
                  this.scanProgress = Math.floor(this.decoder.getProgress() * 100);
                }
              } else {
                resolve(text);
              }
            } else {
              reject(error);
            }
          });
          window.QRScanner.show();
          ['body', '#app'].forEach((s) => {
            document.querySelector(s).style = 'background: transparent';
          });

          setTimeout(() => {
            document.querySelector('.camera-close-button').addEventListener('click', this.stopReading);
          }, 500);
        })
        : new Promise((resolve) => {
          this.browserReader.decodeFromVideoDevice(
            undefined,
            this.$refs.qrCodeVideo,
            async (result) => {
              if (result) {
                const text = result.getText();
                if (String(text).includes('BYTES/')) {
                  this.decoder.receivePart(text);
                  if (this.decoder.isComplete()) {
                    resolve(await this.getEncoderData());
                  } else {
                    this.isMultiFragmentQr = true;
                    this.scanProgress = Math.floor(this.decoder.getProgress() * 100);
                  }
                } else {
                  resolve(text);
                }
              }
            },
            (error) => {
              reject(error);
            },
          );
        });
    },
    async stopReading() {
      if (this.mobile) {
        ['body', '#app'].forEach((s) => {
          document.querySelector(s).style = 'background: #141414';
        });
        await window.QRScanner.pausePreview();
        window.plugins.webviewcolor.change('#141414');
        this.setQrScanner(false);
        window.QRScanner.destroy();
      } else this.browserReader.reset();
    },
    cancelReading() {
      this.stopReading();
      this.reject(new RejectedByUserError());
    },
    openSettings() {
      window.QRScanner.openSettings();
    },
    async getEncoderData() {
      const combinedData = this.decoder.resultUR().decodeCBOR();
      const resultUr = bs58check.encode(combinedData);

      const serializer = SerializerV3.getInstance();
      return serializer.deserialize(resultUr);
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

  .heading {
    @extend %face-sans-19-medium;

    color: variables.$color-white;
  }

  .subtitle {
    @extend %face-sans-16-medium;

    margin-top: 4px;
    margin-bottom: 20px;
    line-height: 24px;
    color: rgba(variables.$color-white, 0.75);
  }

  .info-box {
    text-align: left;
  }
}
</style>
