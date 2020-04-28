<template>
  <div class="popup">
    <h2>
      <span class="secondary-text">{{ data.host }} ({{ data.name }}) </span>
      {{ $t('pages.connectConfirm.websiteRequestAccounts') }}
    </h2>
    <ul>
      <ae-list-item fill="neutral" class="permission-set">
        <h4>{{ $t('pages.connectConfirm.addressesLabel') }}</h4>
        <p>{{ $t('pages.connectConfirm.addressesRequest') }}</p>
      </ae-list-item>
    </ul>
    <ae-button-group class="btnFixed">
      <ae-button face="round" fill="primary" @click="cancel">{{
        $t('pages.connectConfirm.cancelButton')
      }}</ae-button>
      <ae-button face="round" fill="alternative" @click="connect">{{
        $t('pages.connectConfirm.confirmButton')
      }}</ae-button>
    </ae-button-group>
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
    async connect() {
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
h2 {
  word-break: break-word;
  line-height: 1.8rem;
  font-size: 1.5rem;
}
p {
  font-weight: normal;
  word-break: break-word;
  font-size: 0.9rem;
}
</style>
