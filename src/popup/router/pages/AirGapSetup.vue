<template>
<div class="popup">
    <div class="actions">
        <button class="backbutton toAccount" @click="navigateAccount"><ae-icon name="back" /> {{$t('pages.airGapSetup.backToAccount') }}</button>
    </div>
    <h3>{{$t('pages.airGapSetup.heading') }}</h3>

    <div v-if="step == 1" class="step1">
        <h4>{{$t('pages.airGapSetup.step1heading') }}</h4>
        <p class="airgap-setup-definitions">{{$t('pages.airGapSetup.step1info') }}</p>
        <div class="qr-wrapper">
            <qrcode-vue :value="this.airgap_it" foreground="#14CCB7" :size="180" level="H"></qrcode-vue>
        </div>
        <ae-button class="step-button" face="flat" fill="alternative" @click="next">{{$t('pages.airGapSetup.step1buttonNext') }} <ae-icon name="left-more" /></ae-button>
    </div>

    <div v-if="step == 2" class="step2">
        <h5 class="airgap-setup-titles">{{$t('pages.airGapSetup.setupSteps1heading') }}</h5>
        <p class="airgap-setup-definitions">
            <ae-badge class="airgap-setup-badge"><span style="font-weight:bold; display: contents;">1</span> {{$t('pages.airGapSetup.setupSteps1') }}</ae-badge>
        </p>
        <ae-divider />
        <h5 class="airgap-setup-titles">{{$t('pages.airGapSetup.setupSteps2heading') }}</h5>
        <p class="airgap-setup-definitions">
            <ae-badge class="airgap-setup-badge"><span style="font-weight:bold; display: contents;">2</span> {{$t('pages.airGapSetup.setupSteps2') }}</ae-badge>
        </p>
        <ae-divider />
        <h5 class="airgap-setup-titles">{{$t('pages.airGapSetup.setupSteps3heading') }}</h5>
        <p class="airgap-setup-definitions">
            <ae-badge class="airgap-setup-badge"><span style="font-weight:bold; display: contents;">3</span> {{$t('pages.airGapSetup.setupSteps3') }}</ae-badge>
        </p>
        <ae-divider />
        <h5 class="airgap-setup-titles">{{$t('pages.airGapSetup.setupSteps4heading') }}</h5>
        <p class="airgap-setup-definitions">
            <ae-badge class="airgap-setup-badge"><span style="font-weight:bold; display: contents;">4</span> {{$t('pages.airGapSetup.setupSteps4') }}</ae-badge>
        </p>
        <ae-divider />
        <h5 class="airgap-setup-titles">{{$t('pages.airGapSetup.setupSteps5heading') }}</h5>
        <p class="airgap-setup-definitions">
            <ae-badge class="airgap-setup-badge"><span style="font-weight:bold; display: contents;">5</span> {{$t('pages.airGapSetup.setupSteps5') }}</ae-badge>
        </p>
        <br>
        <ae-button class="step-button" face="flat" fill="alternative" @click="linkVault">{{$t('pages.airGapSetup.linkVault') }} <ae-icon name="left-more" /></ae-button>
    </div>

</div>
</template>

<script>
import { mapGetters } from 'vuex';
import QrcodeVue from 'qrcode.vue';

export default {
    components: {
        QrcodeVue
    },
    data () {
        return {
            step: 1,
            airgap_it: 'https://airgap.it'
        }
    },
    methods: {
        navigateAccount() {
            this.$router.push('/account')
        },
        next(){
            this.step = this.step + 1;
            if (this.step > 3)
                this.step = 1;
        },
        linkVault() {
            this.$router.push('/qrCodeReader')
        }
    }
}
</script>



<style lang="scss" scoped>
@import '../../../common/base';
.airgap-setup-definitions {
    font-weight: normal;
    word-break: break-word;
    margin: 0;
    text-align: left;
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