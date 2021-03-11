<template>
  <div class="popup popup-aex2" data-cy="popup-aex2">
    <h2 class="identity">
      <div class="flex flex-align-center flex-justify-content-center">
        <img :src="faviconUrl" @error="imageError = true" v-if="!imageError" />
        <div>
          <span class="secondary-text" data-cy="host">
            <!--eslint-disable-next-line vue-i18n/no-raw-text-->
            {{ app.host }} {{ app.name ? `(${app.name})` : '' }}
          </span>
          {{ $t('pages.popupMessageSign.heading') }}
        </div>
      </div>
    </h2>
    <ul>
      <ae-list-item fill="neutral" class="permission-set">
        <h4>{{ $t('pages.popupMessageSign.message') }}</h4>
        <p v-if="message" data-cy="message">
          {{ message }}
        </p>
      </ae-list-item>
    </ul>
    <div class="button-fixed">
      <Button half dark @click="cancel()" data-cy="deny">
        {{ $t('pages.signTransaction.reject') }}
      </Button>
      <Button half @click="resolve()" data-cy="accept">
        {{ $t('pages.signTransaction.confirm') }}
      </Button>
    </div>
  </div>
</template>

<script>
import Button from '../../components/Button';
import mixin from './mixin';

export default {
  mixins: [mixin],
  components: { Button },
  props: {
    name: { type: String, default: null },
    message: { type: String, required: true },
  },
  data: () => ({ imageError: false }),
};
</script>

<style lang="scss" scoped>
@import '../../../../styles/variables';

.identity img {
  width: 32px;
}
</style>
