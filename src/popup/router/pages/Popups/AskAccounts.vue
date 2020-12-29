<template>
  <div class="popup">
    <h2>
      <!--eslint-disable-next-line vue-i18n/no-raw-text-->
      <span class="secondary-text">{{ data.host }} ({{ data.name }}) </span>
      {{ $t('pages.connectConfirm.websiteRequestAccounts') }}
    </h2>
    <ul>
      <ae-list-item fill="neutral" class="permission-set">
        <h4>{{ $t('pages.connectConfirm.addressesLabel') }}</h4>
        <p>{{ $t('pages.connectConfirm.addressesRequest') }}</p>
      </ae-list-item>
    </ul>
    <div class="button-fixed">
      <Button half dark @click="cancel" :disabled="!data.reject">
        {{ $t('pages.connectConfirm.cancelButton') }}
      </Button>
      <Button half @click="connect" :disabled="!data.resolve">
        {{ $t('pages.connectConfirm.confirmButton') }}
      </Button>
    </div>
  </div>
</template>

<script>
import getPopupProps from '../../../utils/getPopupProps';
import Button from '../../components/Button';

export default {
  components: { Button },
  data() {
    return {
      data: {},
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
};
</script>

<style lang="scss" scoped>
@import '../../../../styles/variables';

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
