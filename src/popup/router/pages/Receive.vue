<template>
  <div class="popup popup-no-padding">
    <div data-cy="top-up-container">
      <Button data-cy="buyAE" @click="buyAE">{{ $t('pages.receive.buyAE') }}</Button>
      <p class="primary-title text-left mt-20 f-14 mx-20" style="margin-left:20px !important">
        {{ $t('pages.receive.heading') }}
      </p>
      <AccountInfo />
      <qrcode-vue :value="account.publicKey" size="140" class="my-25 qrcode"></qrcode-vue>
      <Button @click="exchange">{{ $t('pages.receive.transferExchange') }}</Button>
      <Button data-cy="home" @click="navigateAccount">{{ $t('pages.receive.home') }}</Button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import QrcodeVue from 'qrcode.vue';
import AccountInfo from '../components/AccountInfo';
import openUrl from '../../utils/openUrl';

export default {
  name: 'Receive',
  components: {
    QrcodeVue,
    AccountInfo,
  },
  data() {
    return {
      jellySwapUrl: 'https://app.jelly.market',
      buyAe: '',
    };
  },
  computed: {
    ...mapGetters(['account']),
  },
  methods: {
    copy() {
      this.$store.dispatch('modals/open', { name: 'default', msg: 'Copied to clipboard' });
    },
    navigateAccount() {
      this.$router.push('/account');
    },
    exchange() {
      openUrl(this.jellySwapUrl);
    },
    buyAE() {
      // openUrl(this.buyAe);
      this.navigateAccount();
    },
  },
};
</script>
<style>
.qrcode canvas {
  border: 5px solid #fff;
}
</style>
