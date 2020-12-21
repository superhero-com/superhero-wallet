<template>
  <div class="popup popup-aex2" data-cy="popup-aex2">
    <h2 class="identity">
      <div class="flex flex-align-center flex-justify-content-center">
        <img :src="faviconUrl" @error="imageError = true" v-if="!imageError" />
        <div>
          <span class="secondary-text" data-cy="host">
            <!--eslint-disable-next-line vue-i18n/no-raw-text-->
            {{ data.host }} {{ data.name ? `(${data.name})` : '' }}
          </span>
          {{ $t('pages.popupMessageSign.heading') }}
        </div>
      </div>
    </h2>
    <ul>
      <ae-list-item fill="neutral" class="permission-set">
        <h4>{{ $t('pages.popupMessageSign.message') }}</h4>
        <p v-if="message || data.action" data-cy="message">
          {{ message || data.action.params.message }}
        </p>
      </ae-list-item>
    </ul>
    <div class="button-fixed">
      <Button half dark @click="cancel" :disabled="!data.reject" data-cy="deny">
        {{ $t('pages.signTransaction.reject') }}
      </Button>
      <Button half @click="accept" :disabled="!data.resolve" data-cy="accept">
        {{ $t('pages.signTransaction.confirm') }}
      </Button>
    </div>
  </div>
</template>

<script>
import Button from '../../components/Button';
import getPopupProps from '../../../utils/getPopupProps';
import { IN_POPUP } from '../../../utils/helper';

export default {
  components: { Button },
  props: {
    message: { type: String, default: null },
    origin: { type: String, default: null },
    resolve: { type: Function, default: null },
    reject: { type: Function, default: null },
  },
  data() {
    return {
      data: {},
      imageError: false,
    };
  },
  async created() {
    this.data =
      process.env.PLATFORM === 'web' && IN_POPUP
        ? {
            resolve: this.resolve,
            reject: this.reject,
            message: this.message,
            host: this.origin,
          }
        : await getPopupProps();
  },
  methods: {
    cancel() {
      this.data.reject(false);
    },
    async accept() {
      this.data.resolve(true);
    },
  },
  computed: {
    faviconUrl() {
      return typeof this.data.icons !== 'undefined'
        ? this.data.icons
        : `${this.data.protocol}//${this.data.host}/favicon.ico`;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../../styles/variables';

.identity img {
  width: 32px;
}
</style>
