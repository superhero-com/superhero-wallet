<template>
  <div class="popup popup-camera">
    <qrcode-stream @decode="onDecode" @init="onInit" @detect="onDetect"></qrcode-stream>
    <popup />
  </div>
</template>

<script>
import { QrcodeStream } from 'vue-qrcode-reader';
import { detectBrowser, checkAddress, chekAensName } from '../../utils/helper';

export default {
  components: {
    QrcodeStream,
  },
  props: {
    type: String,
  },
  data() {
    return {
      successMessage: '',
      errorMessage: '',
    };
  },
  created() {
    this.$store.commit('SET_MAIN_LOADING', true);
  },
  methods: {
    onDecode(address) {
      try {
        if (this.type == 'send' && (checkAddress(address) || chekAensName(address))) {
          return this.$router.push({ name: 'send', params: { address } });
        }
      } catch (err) {
        console.log(err);
      }
    },
    async onInit(promise) {
      const url = browser.extension.getURL('./popup/CameraRequestPermission.html');
      try {
        await promise;
        this.$store.commit('SET_MAIN_LOADING', false);
      } catch (error) {
        this.$store.commit('SET_MAIN_LOADING', false);
        browser.tabs.create({ url, active: true });
        if (error.name === 'NotAllowedError') {
          this.errorMessage = 'ERROR: you need to grant camera access permisson';
        } else if (error.name === 'NotFoundError') {
          this.errorMessage = 'ERROR: no camera on this device';
        } else if (error.name === 'NotSupportedError') {
          this.errorMessage = 'ERROR: secure context required (HTTPS, localhost)';
        } else if (error.name === 'NotReadableError') {
          this.errorMessage = 'ERROR: is the camera already in use?';
        } else if (error.name === 'OverconstrainedError') {
          this.errorMessage = 'ERROR: installed cameras are not suitable';
        } else if (error.name === 'StreamApiNotSupportedError') {
          this.errorMessage = 'ERROR: Stream API is not supported in this browser';
        }
        this.$store.dispatch('popupAlert', { name: 'account', type: 'error_qrcode', msg: this.errorMessage, data: this.errorMessage });
        this.$router.go(-1);
      }
    },
    async onDetect(promise) {
      try {
        const {
          imageData, // raw image data of image/frame
          content, // decoded String
          location, // QR code coordinates
        } = await promise;

        console.log(imageData);
        console.log(content);
        console.log(location);
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>

<style lang="scss">
.popup-camera .wrapper {
  position: fixed;
  top: 50px;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0;
  max-width: 380px;
}
</style>
