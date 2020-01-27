<template>
    <div class="popup">
        <div class="actions" >
            <button class="backbutton toAccount" @click="back"><ae-icon name="back" />{{ $t('pages.auctionBid.backToAuctions') }}</button>
        </div>
        <h3 class="transactionsPadding"> {{ $t('pages.auctionBid.bidding') }} </h3>
        <div class="addNewName">
            <div class="maindiv_input-group-addon">
                <h4>{{ $t('pages.auctionBid.bidOn') }} {{auctionInfo.info.name}}</h4><hr>
                <ae-input v-model="auctionInfo.info.name" style="margin: 10px 0 10px 0; pointer-events: none;" label="Name" placeholder="..." error>
                </ae-input>
                <ae-input style="margin: 10px 0 10px 0;" label="Component" placeholder="0.0" v-model="amount" aemount error>
                    <ae-text slot="header" fill="black">AE</ae-text>
                    <ae-toolbar v-if="err.amount" slot="footer">
                        {{ errtext.amount }}
                    </ae-toolbar>
                    <ae-toolbar v-else slot="footer">
                        {{ $t('pages.auctionBid.requiredField') }}
                    </ae-toolbar>
                </ae-input>
                <ae-button @click="nextStepBiddingHandler" class="notround" face="flat" fill="primary">
                    {{ $t('pages.auctionBid.next') }}
                </ae-button>
                <div style="display:inline-block; margin:20px 0; width:100%;">
                    <ae-text class="lefttext" align="left">
                        {{ $t('pages.auctionBid.current-highest-bid') }}
                    </ae-text>
                    <ae-text class="righttext" align="right">
                        {{ auctionInfo.info.winning_bid }} AE
                    </ae-text>
                </div>
                <div>
                    <ae-text class="lefttext" align="left">
                        {{ $t('pages.auctionBid.remaining-time') }}
                    </ae-text>
                    <ae-text class="righttext" align="right">
                        {{ (expiration /* - topBlockHeight */ ) }}
                    </ae-text>
                </div>
            </div>
        </div>
        <Loader size="big" :loading="loading" type="transparent" content="" ></Loader>
        <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
    </div>

</template>

<script>
import { mapGetters } from 'vuex';
import { MAGNITUDE } from '../../utils/constants';
import BigNumber from 'bignumber.js';
import { pick } from 'lodash-es';
import { convertToAE } from '../../utils/helper'


export default {
    data() {
        return {
            loading: false,
            expiration: 0,
            bids: null,
            highestBid: null,
            expiration: 0,
            amount: '',
            MAGNITUDE,
            err:{
                amount:false
            },
            errtext: {
                amount: ''
            }
        }
    },
    subscriptions() {
        return pick(this.$store.state.observables, ['topBlockHeight']);
    },
    props: ['auctionInfo'],
    computed: {
        ...mapGetters(['account','current','network' ,'popup', 'sdk'])
    },
    mounted() {
        this.loading = true

        const id = setInterval(() => this.updateAuctionEntry() , 3000);
        this.$once('hook:destroyed', () => clearInterval(id));
        this.$watch(
            ({ name }) => this.auctionInfo.info.name,
            () => this.updateAuctionEntry(),
            { immediate: true },
        );
        this.loading = false
    },
    methods: {
        async updateAuctionEntry() {
            const res = await this.$store.dispatch('names/fetchAuctionEntry', this.auctionInfo.info.name);
            this.expiration = res.expiration;
            this.bids = res.bids;
            this.highestBid = res.bids
                .map(({ nameFee }) => nameFee)
                .reduce((a, b) => (a.isGreaterThan(b) ? a : b));
        },
        async nextStepBiddingHandler() {
            if (this.amount == '') {
                this.errtext.amount = 'Please add some amount';
                this.err.amount = true;
            } else if (this.amount <= this.highestBid.multipliedBy(1.05)) {
                this.errtext.amount = 'This field must be more than '+this.highestBid.multipliedBy(1.05).toString()+ 'AE';
                this.err.amount = true;
            } else {
                let name = this.auctionInfo.info.name;
                let amount = convertToAE(BigNumber(this.amount).shiftedBy(MAGNITUDE));
                let BigNumberAmount = BigNumber(this.amount).shiftedBy(MAGNITUDE);

                let tx = {
                    popup:false,
                    tx: {
                        name,
                        BigNumberAmount,
                        amount
                    },
                    type:'nameBid',
                    bid: true
                }
                this.$store.commit('SET_AEPP_POPUP',true)
                this.$router.push({'name':'sign', params: {
                    data:tx,
                    type:tx.type
                }});
            }
        },
        back() {
            this.$router.push('/aens');
        },
    }
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';

.lefttext {
    float: left;
    text-align: left;
    width: 50%;
    color: #888888;
}

.righttext {
    float: right;
    text-align: right;
    width: 50%;
    color: #888888;
}

</style>
