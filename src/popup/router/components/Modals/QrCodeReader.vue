<template>
  <Modal
    v-if="browserReader || !cameraAllowed"
    has-close-button
    class="qr-code-reader"
    @close="resolve"
  >
    <template slot="header">
      <QrScan class="icon" />
      {{ title }}
    </template>

    <div class="camera">
      <div v-show="cameraAllowed">
        <video
          v-show="cameraAllowed"
          ref="qrCodeVideo"
        />
      </div>
      <div v-if="!cameraAllowed">
        {{ $t('modals.qrCodeReader.cameraNotAllowed') }}
      </div>
    </div>

    <template
      v-if="!cameraAllowed"
      slot="footer"
    >
      <Button @click="cancelReading">
        {{ $t('ok') }}
      </Button>
      <Button
        v-if="mobile"
        @click="openSettings"
      >
        {{ $t('modals.qrCodeReader.settings') }}
      </Button>
    </template>
  </Modal>
</template>

<script>
import Modal from '../Modal.vue';
import Button from '../Button.vue';
import { handleUnknownError } from '../../../utils/helper';
import QrScan from '../../../../icons/qr-scan.svg?vue-component';

export default {
  components: { Modal, Button, QrScan },
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
    }

    this.cameraAllowed = true;
  },
  beforeDestroy() {
    this.stopReading();
  },
  methods: {
    async initBrowserReader() {
      const { BrowserQRCodeReader } = await import('@zxing/library');
      this.browserReader = new BrowserQRCodeReader();
    },
    async scan() {
      return this.mobile
        ? new Promise((resolve, reject) => {
          window.QRScanner.scan((error, text) => (!error && text ? resolve(text) : reject(error)));
          window.QRScanner.show();
          ['body', '#app'].forEach((s) => {
            document.querySelector(s).style = 'background: transparent';
          });
          document.querySelector('.main').style.display = 'none';
          this.$store.commit('setPageTitle', 'Scan QR');
        })
        : (
          await this.browserReader.decodeFromInputVideoDevice(undefined, this.$refs.qrCodeVideo)
        ).getText();
    },
    stopReading() {
      if (this.mobile) {
        ['body', '#app', '.main'].forEach((s) => {
          document.querySelector(s).style = '';
        });
        // https://github.com/bitpay/cordova-plugin-qrscanner/issues/234
        window.plugins.webviewcolor.change('#090909');
        this.$store.commit('setPageTitle', '');
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
@use "../../../../styles/variables";
@use "../../../../styles/mixins";

.qr-code-reader {
  .icon {
    color: variables.$color-blue;
  }

  .camera video {
    max-width: 70vw;

    @include mixins.desktop {
      max-width: 100%;
    }
  }
}
</style>
