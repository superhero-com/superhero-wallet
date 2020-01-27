<template>
  <div class="popup">
    <div class="actions">
      <button class="backbutton toAccount" @click="navigateAccount"><ae-icon name="back" /> {{$t('pages.receive.backToAccount') }}</button>
    </div>
    <p>{{$t('pages.receive.heading') }}</p>
    <ae-card fill="neutral" align="center">
      <div class="qr-wrapper">
        <qrcode-vue :value="account.publicKey"></qrcode-vue>
      </div>
      <ae-address :value="account.publicKey" gap=0 />
      <ae-toolbar fill="neutral" align="right" slot="footer">
        <ae-button face="toolbar" v-clipboard:copy="account.publicKey" @click="copy">
          <ae-icon name="copy" />
          {{ $t('pages.receive.copy') }}
        </ae-button>
      </ae-toolbar>
    </ae-card>
    <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>

  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import QrcodeVue from 'qrcode.vue';

export default {
  name: 'Receive',
  components: {
    QrcodeVue
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters(['account','popup'])
  },
  methods: {
      copy(){
          this.$store.dispatch('popupAlert', { name: 'account', type: 'publicKeyCopied'});
      },
    navigateAccount() {
      this.$router.push('/account')
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';
.qr-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px;
  background-color: white;
  border-radius: 6px;
}


</style>