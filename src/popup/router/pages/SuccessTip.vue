<template>
    <div class="popup">
        <BackLink to="/account">
           SEND
        </BackLink>
        <h3>Transaction completed</h3>
        <h4>You’ve successfully sent {{ amountTip }} AE in <b>TIPS</b> to (URL)</h4>
        <small>Sent to: {{ domain }}</small>
        <h3>Let them know!</h3>
        <div>
            <ae-button face="round" fill="primary" @click="toTips">{{$t('pages.successTip.sendMore')}}</ae-button>
            <ae-button face="round" fill="secondary" @click="toDashboard" >{{$t('pages.appVUE.dashboard')}}</ae-button>
            <br><br>
            <ae-button face="round" fill="alternative" >{{$t('pages.successTip.feed')}}</ae-button>
        </div>
    </div>
</template>

<script>
import { MAGNITUDE } from '../../utils/constants';
import BigNumber from 'bignumber.js';

export default {
    props: ['amount','domain'],
    data () {
        return {
            
        }
    },
    computed: {
        amountTip() {
            return BigNumber(this.amount).shiftedBy(-MAGNITUDE)
        }
    },
    created() {

    },
    methods: {
        toTips() {
            this.$router.push('/tip')
        },
        toDashboard() {
            this.$router.push('/account')
        }
    }
}
</script>
