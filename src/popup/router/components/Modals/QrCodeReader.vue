<template>
  <Modal v-if="browserReader || !cameraAllowed" @close="resolve" close>
    <template slot="header">{{ title }}</template>

    <div class="qr-code-reader">
      <div v-show="cameraAllowed">
        <video v-show="cameraAllowed" ref="qrCodeVideo" />
      </div>
      <div v-if="!cameraAllowed">
        {{ $t('modals.qrCodeReader.cameraNotAllowed') }}
      </div>
    </div>
  </Modal>
</template>

<script>
import { BrowserQRCodeReader } from '@zxing/library/esm/browser/BrowserQRCodeReader';
import Modal from '../Modal';
import openUrl from '../../../utils/openUrl';

const handleUnknownError = (error) => console.log(error);

export default {
  components: { Modal },
  props: {
    title: { type: String, required: true },
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
  },
  data: () => ({
    // allow camera while QRScanner is loading to not show cameraNotAllowed before actual check
    cameraAllowed: process.env.PLATFORM === 'cordova',
    browserReader: !(process.env.PLATFORM === 'cordova') && new BrowserQRCodeReader(),
    style: null,
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
              if (process.env.IS_EXTENSION) {
                openUrl(browser.extension.getURL('./popup/CameraRequestPermission.html'));
                reject();
              }
              if (navigator.mediaDevices.getUserMedia)
                navigator.mediaDevices.getUserMedia({ video: true }).then(resolve).catch(reject);
              else reject(new Error('Sorry, your browser does not support getUserMedia'));
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
    if (process.env.PLATFORM === 'cordova') {
      try {
        await new Promise((resolve, reject) =>
          window.QRScanner.prepare((error, status) =>
            !error && status.authorized
              ? resolve()
              : reject(error || new Error('Denied to use the camera')),
          ),
        );
      } catch {
        this.cameraAllowed = false;
      }
      this.resolve(await this.scan());
      return;
    }

    const status =
      navigator.permissions &&
      (await navigator.permissions.query({ name: 'camera' }).catch((error) => {
        const firefoxExceptionMessage =
          "'name' member of PermissionDescriptor 'camera' is not a valid value for enumeration PermissionName.";
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
    async scan() {
      return process.env.PLATFORM === 'cordova'
        ? new Promise((resolve, reject) => {
            window.QRScanner.scan((error, text) =>
              !error && text ? resolve(text) : reject(error),
            );
            window.QRScanner.show();
            this.style = document.createElement('style');
            this.style.type = 'text/css';
            this.style.appendChild(
              document.createTextNode('html, body, .ae-main { background: transparent }'),
            );
            document.head.appendChild(this.style);
            document.querySelector('.popup').style.display = 'none';
            document.querySelector('.header .content div:not(.title)').style.display = 'none';
            this.headerText = document.querySelector('.header .title').innerText;
            document.querySelector('.header .title').innerText = 'Scan QR';
          })
        : (
            await this.browserReader.decodeFromInputVideoDevice(undefined, this.$refs.qrCodeVideo)
          ).getText();
    },
    stopReading() {
      if (process.env.PLATFORM === 'cordova') {
        if (document.head.contains(this.style)) document.head.removeChild(this.style);
        document.querySelector('.popup').style.display = '';
        document.querySelector('.header .content div:not(.title)').style.display = '';
        document.querySelector('.header .title').innerText = this.headerText;
        window.QRScanner.destroy();
      } else this.browserReader.reset();
    },
    cancelReading() {
      this.stopReading();
      this.reject(new Error('Rejected by user'));
    },
  },
};
</script>

<style lang="scss" scoped>
.qr-code-reader video {
  max-width: 70vw;
}
</style>
