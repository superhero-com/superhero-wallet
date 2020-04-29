<template>
  <div class="popup popup-aex2" data-cy="popup-aex2">
    <h2 class="identity">
      <div class="flex flex-align-center flex-justify-content-center">
        <img :src="faviconUrl" @error="imageError = true" v-if="!imageError" />
        <div>
          <span class="secondary-text" data-cy="host">{{ data.host }} ({{ data.name }}) </span>
          {{ $t('pages.popupMessageSign.heading') }}
        </div>
      </div>
    </h2>
    <ul>
      <ae-list-item fill="neutral" class="permission-set">
        <h4>{{ $t('pages.popupMessageSign.message') }}</h4>
        <p v-if="data.action" data-cy="message">{{ data.action.params.message }}</p>
      </ae-list-item>
    </ul>
    <div class="btnFixed">
      <Button half @click="cancel" data-cy="deny" class="reject">{{
        $t('pages.signTransaction.reject')
      }}</Button>
      <Button half @click="accept" data-cy="accept">{{
        $t('pages.signTransaction.confirm')
      }}</Button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import getPopupProps from '../../../utils/getPopupProps';

export default {
  data() {
    return {
      data: {},
      imageError: false,
    };
  },
  async created() {
    this.data = await getPopupProps();
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
    ...mapGetters(['account', 'activeAccountName']),
    faviconUrl() {
      return typeof this.data.icons !== 'undefined'
        ? this.data.icons
        : `${this.data.protocol}//${this.data.host}/favicon.ico`;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../../common/variables';
.identity {
  img {
    width: 32px;
  }
}
</style>
