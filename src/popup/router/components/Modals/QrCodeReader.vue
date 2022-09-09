<template>
  <Modal
    v-if="browserReader || !cameraAllowed"
    class="qr-code-reader"
    has-close-button
    centered
    from-bottom
    @close="resolve"
  >
    <div class="qr-scan-wrapper">
      <QrScan />
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

    <div class="button-wrapper">
      <Button
        :fill="mobile ? 'secondary' : 'primary'"
        :extend="!mobile"
        new-ui
        :text="$t('ok')"
        @click="cancelReading"
      />
      <Button
        v-if="mobile"
        new-ui
        :text="$t('modals.qrCodeReader.settings')"
        @click="openSettings"
      />
    </div>
  </Modal>
</template>

<script>
import { mapMutations } from 'vuex';
import Modal from '../Modal.vue';
import Button from '../Button.vue';
import { handleUnknownError } from '../../../utils/helper';
import QrScan from '../../../../icons/qr-scan.svg?vue-component';

export default {
  components: {
    Modal,
    Button,
    QrScan,
  },
  props: {
    title: { type: String, required: true },
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
  },
  data: () => ({
    // allow camera while QRScanner is loading to not show cameraNotAllowed before actual check
    cameraAllowed: process.env.PLATFORM === 'cordova',
    browserReader: null,
    headerText: '',
  }),
  computed: {
    mobile() {
      return process.env.PLATFORM === 'cordova';
    },
  },
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
              if (process.env.IS_EXTENSION) {
                window.open(
                  browser.extension.getURL('./CameraRequestPermission.html'),
                  '_blank',
                );
                reject();
              }
              if (navigator.mediaDevices.getUserMedia) {
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
    },
    async scan() {
      return this.mobile
        ? new Promise((resolve, reject) => {
          this.setQrScanner(true);
          window.plugins.webviewcolor.change('#00FFFFFF');

          window.QRScanner.scan((error, text) => (!error && text ? resolve(text) : reject(error)));
          window.QRScanner.show();
          ['body', '#app'].forEach((s) => {
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
      this.reject(new Error('Rejected by user'));
    },
    openSettings() {
      window.QRScanner.openSettings();
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';
@use '../../../../styles/mixins';
@use '../../../../styles/typography';

.qr-code-reader {
  .qr-scan-wrapper {
    @include mixins.flex(center, center);

    background-color: variables.$color-bg-1;
    border: 4px solid rgba(variables.$color-white, 0.05);
    border-radius: 50%;
    width: 56px;
    height: 56px;
    align-self: center;
    margin: 0 auto 16px auto;

    .qr-scan {
      margin-bottom: 0;
      width: 40px;
      height: 40px;
      color: variables.$color-blue;
    }
  }

  .button-wrapper {
    padding-top: 20px;
    padding-bottom: 0;
    width: 100%;
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
