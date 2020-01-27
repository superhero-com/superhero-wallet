<template>
<div class="popup">
    <div class="actions">
        <button v-if="step == 1" class="backbutton toAccount" @click="navigateAccount"><ae-icon name="back" /> {{$t('pages.signTransactionByQrCode.backToAccount')}}</button>
        <button v-if="step == 2" class="backbutton toAccount" @click="step = 1"><ae-icon name="back" />{{$t('pages.signTransactionByQrCode.backToScan')}}</button>
    </div>
    <h3 class="breakword">{{$t('pages.signTransactionByQrCode.heading')}}</h3>
    <div>
        <div v-if="step == 1">
            <div class="qr-wrapper">
                <qrcode-vue :value="url" foreground="#000" :size="200" level="H"></qrcode-vue>
            </div>
                <ae-button class="step-button" face="flat" fill="alternative" @click="step = 2">{{$t('pages.signTransactionByQrCode.doneBtn')}} <ae-icon name="left-more" /></ae-button>
        </div>
        <div v-if="step == 2" class="qr-wrapper">
            <qrcode-stream @decode="onDecode" @init="onInit"></qrcode-stream>
            <p v-if="errorMessage != ''" class="error">
                <b>{{ errorMessage }}</b>
            </p>
        </div>
    </div>
    <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
    <Loader class="onlyForThisPageLoader" size="big" :loading="loading" type="transparent" ></Loader>
</div>
</template>

<script>
import { mapGetters } from 'vuex';
import QrcodeVue from 'qrcode.vue';
import { QrcodeStream, QrcodeDropZone, QrcodeCapture } from 'vue-qrcode-reader';
import {
  getPublicKeyByResponseUrl, getSignedTransactionByResponseUrl, generateSignRequestUrl,
} from '../../utils/airGap';
import Wallet from '@aeternity/aepp-sdk/es/ae/wallet';
import { MemoryAccount } from '@aeternity/aepp-sdk';

export default {
    props: ['url'],
    components: {
        QrcodeVue
    },
    data () {
        return {
            loading: false,
            successMessage: '',
            errorMessage: '',
            step: 1
        }
    },
    computed: {
        ...mapGetters(['sdk', 'current', 'network', 'account','activeAccount','wallet','popup'])
    },
    methods: {
        navigateAccount() {
            this.$router.push('/account')
        },
        async onDecode (content) {
            this.loading = true;
            const signed = getSignedTransactionByResponseUrl(content);
            let transaction = await this.sdk.sendTransaction(signed);
            let amount = transaction.tx['amount'] / 1000000000000000000;
            let txUrl = this.network[this.current.network].explorerUrl + '/transactions/' + transaction.hash;
            let msg = 'You have sent ' + amount + ' AE';
            this.$store.dispatch('popupAlert', { name: 'spend', type: 'success_transfer',msg,data:txUrl});
            this.$router.push('/account')
        },
        onInit (promise) {
            promise.then(() => {
                this.successMessage = 'Camera successfully initilized! Ready for scanning now!';
            })
            .catch(error => {
                browser.tabs.create({url: 'chrome-extension://'+browser.runtime.id+'/popup/CameraRequestPermission.html', active: true});
                if (error.name === 'NotAllowedError') {
                    this.errorMessage = 'Hey! I need access to your camera'
                } else if (error.name === 'NotFoundError') {
                    this.errorMessage = 'Do you even have a camera on your device?'
                } else if (error.name === 'NotSupportedError') {
                    this.errorMessage = 'Seems like this page is served in non-secure context (HTTPS, localhost or file://)'
                } else if (error.name === 'NotReadableError') {
                    this.errorMessage = 'Couldn\'t access your camera. Is it already in use?'
                } else if (error.name === 'OverconstrainedError') {
                    this.errorMessage = 'Constraints don\'t match any installed camera. Did you asked for the front camera although there is none?'
                } else {
                    this.errorMessage = 'UNKNOWN ERROR: ' + error.message
                }
            })
        },
    }
}
</script>



<style lang="scss" scoped>
@import '../../../common/base';
.breakword {
    word-break: break-word;
}
.airgap-setup-titles {
    color: #9d3fc0;
    margin:0;
}
.airgap-setup-badge {
    background: none !important;
}
.step-button {
    font-size: 14px !important;
    margin-top: 2rem;
}
.qr-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 5px;
    border-radius: 6px;
}


</style>