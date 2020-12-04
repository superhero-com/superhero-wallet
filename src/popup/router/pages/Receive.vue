<template>
  <div class="popup popup-no-padding top-up-container" data-cy="top-up-container">
    <p class="primary-title text-left mt-20 f-14 mx-20">
      {{ $t('pages.receive.heading') }}
    </p>
    <AccountInfo />
    <qrcode-vue :value="account.publicKey" size="140" class="my-25 qrcode"></qrcode-vue>

    <Button @click="openUrl(changeCryptoToAeUrl, true)">
      {{ $t('pages.receive.transferExchange') }}
    </Button>
    <Button data-cy="home" @click="$router.push('/account')">
      {{ $t('pages.receive.home') }}
    </Button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import QrcodeVue from 'qrcode.vue';
import AccountInfo from '../components/AccountInfo';
import Button from '../components/Button';
import openUrl from '../../utils/openUrl';
import { CHANGE_CRYPTO_AE_URL } from '../../utils/constants';

export default {
  name: 'Receive',
  components: { QrcodeVue, AccountInfo, Button },
  data: () => ({
    changeCryptoToAeUrl: CHANGE_CRYPTO_AE_URL,
    openUrl,
  }),
  computed: mapGetters(['account']),
};
</script>

<style lang="scss" scoped>
.top-up-container {
  p.primary-title {
    margin-left: 20px;
  }

  ::v-deep .qrcode canvas {
    border: 5px solid #fff;
  }
}
</style>
