<template>
  <div class="popup popup-no-padding">
    <div data-cy="top-up-container">
      <p class="primary-title primary-title-darker text-left mt-20 f-14 mx-20" style="margin-left:20px !important">
        {{ $t('pages.receive.heading') }}
      </p>
      <AccountInfo />
      <qrcode-vue :value="account.publicKey" size="140" class="my-25 qrcode"></qrcode-vue>
      <div class="text-left mx-20">
        <!-- <a @click="exchange" class="block mt-15">{{ $t('pages.receive.transferExchange') }}</a> -->
        <!-- <div class="flex flex flex-align-center flex-justify-between mt-20 mb-35">
          <a @click="purchase" class="block">{{ $t('pages.receive.purchase') }}</a>
          <img src="../../../icons/changelly.png" alt="" />
        </div> -->
      </div>
      <Button @click="purchase">{{ $t('pages.receive.purchase') }}</Button>
      <Button @click="exchange">{{ $t('pages.receive.transferExchange') }}</Button>
      <Button data-cy="home" @click="navigateAccount">{{ $t('pages.receive.home') }}</Button>
      <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
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
      changellyUrl: 'https://changelly.com/processing',
    };
  },
  computed: {
    ...mapGetters(['account', 'popup']),
  },
  methods: {
    copy() {
      this.$store.dispatch('popupAlert', { name: 'account', type: 'publicKeyCopied' });
    },
    navigateAccount() {
      this.$router.push('/account');
    },
    exchange() {
      openUrl(this.jellySwapUrl);
    },
    purchase() {
      openUrl(this.changellyUrl);
    },
  },
};
</script>
<style>
.qrcode canvas {
  border: 5px solid #fff;
}
</style>
