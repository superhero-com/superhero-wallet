<template>
    <div class="popup">
        <div class="tab-holder flex flex-justify-between">
            <Button :class="tab == 'registered' ? 'danger': ''" @click="tab = 'registered'" third>{{$t('pages.namingSystemPage.yourNamesBtn') }}</Button>
            <Button :class="tab == 'auctions' ? 'danger': ''" @click="tab = 'auctions'" third>{{$t('pages.namingSystemPage.allActiveAuctionsBtn') }}</Button>
            <Button :class="tab == 'claim' ? 'danger': ''" @click="tab = 'claim'" third>{{$t('pages.namingSystemPage.AddNewBtn') }}</Button>
        </div>

        <!-- if is clicked Your Names  -->
        <div class="seeAllRegisteredNames" v-if="tab == 'registered'">
            <h4>{{$t('pages.namingSystemPage.registeredNames') }}</h4><hr>
            <ae-list v-if="names.length">
                <ae-list-item fill="neutral" v-for="(name, key) in names" :key="key" >
                    <ae-identicon v-bind:address="name.owner" size="base" />
                    <div class="text-left ml-10">
                        <div class="">{{name.name}}</div>
                        <ae-address :value="name.owner" length="short" />
                    </div>
                    <Button class="danger" @click="extend(name)" small>{{ $t('pages.namingSystemPage.extend') }}</Button>
                    <ae-icon fill="primary" face="round" name="reload" class="name-pending" v-if="name.pending"/>
                </ae-list-item>
            </ae-list>
            <p v-if="!names.length">{{ $t('pages.namingSystemPage.noNames') }}</p>
        </div>

        <!-- if is clicked All Active  -->
        <div class="seeAllActiveAuctions" v-if="tab == 'auctions'">

            <h4 v-if="!moreAuInfo.visible">{{$t('pages.namingSystemPage.activeAuctions') }}</h4>
            <h4 v-if="moreAuInfo.visible">{{$t('pages.namingSystemPage.auctionInfo') }}</h4><hr>

            <ae-filter-list v-if="!moreAuInfo.visible">
                <p style="margin:0">{{$t('pages.namingSystemPage.filtersBy') }}</p>

                <Button @click="filterType = 'soonest'" :class="filterType == 'soonest' ? 'danger': ''" third small>{{ $t('pages.namingSystemPage.filterBySoonest') }}</Button>
                <Button @click="filterType = 'length'" :class="filterType == 'length' ? 'danger': ''" third small>{{ $t('pages.namingSystemPage.filterByCharLength') }}</Button>
                <Button @click="filterType = 'bid'" :class="filterType == 'bid' ? 'danger': ''" third small>{{ $t('pages.namingSystemPage.filterByBid') }}</Button>
            </ae-filter-list>

            <ae-list v-if="!moreAuInfo.visible && activeAuctions != null">
                <ae-list-item class="singleAuction" fill="neutral" v-for="(info, key) in auctions" :key="key" @click="moreAuctionInfo(key,info)" >
                    <ae-identicon class="subAccountIcon" v-bind:address="info.winning_bidder" size="base" />
                    <div class="auctionInfo">
                        <div class="name">{{info.name}}</div>
                        <div class="expiration">Expires in {{info.expiration}} blocks</div>
                    </div>
                </ae-list-item>
            </ae-list>

            <p v-if="activeAuctions == null">{{ $t('pages.namingSystemPage.noAuctions') }}</p>

            <div v-if="moreAuInfo.visible">
                <div class="actions">
                    <button class="backbutton toAccount" @click="moreAuInfo.visible = false"><ae-icon name="back" />{{ $t('pages.namingSystemPage.backButton') }}</button>
                </div>
                <div>
                    <span>Expires in: </span><b>{{ moreAuInfo.info.expiration }} </b>blocks<br>
                    <hr>
                    <span>{{ $t('pages.namingSystemPage.currentBid') }}</span>
                    <ae-list-item style="border:none" fill="neutral">
                        <ae-identicon class="subAccountIcon" v-bind:address="moreAuInfo.info.winning_bidder" size="base" />
                        <div class="auctionInfo">
                            <div class="name">{{(moreAuInfo.info.winning_bid).toFixed(3)}} {{ $t('pages.appVUE.aeid') }}</div>
                            <div style="color:#aba9a9" class="expiration"><small>{{moreAuInfo.info.winning_bidder}}</small></div>
                        </div>
                    </ae-list-item>
                    <hr>
                    <span>{{ $t('pages.namingSystemPage.previousBids') }}</span>
                    <div v-if="previousBids" >
                        <ae-list-item v-for="(bid, idx) in previousBids" v-bind:key="idx" style="border:none" fill="neutral">
                            <ae-identicon class="subAccountIcon" v-bind:address="bid.accountId" size="base" />
                            <div class="auctionInfo">
                                <div class="name">{{ (bid.nameFee).toFixed(3) }} AE</div>
                                <div style="color:#aba9a9" class="expiration"><small>{{ bid.accountId }}</small></div>
                            </div>
                        </ae-list-item>
                    </div>
                    <div  v-if="!previousBids">
                        <p>{{ $t('pages.namingSystemPage.noPreviousBids') }}</p>
                    </div>
                    <hr>
                    <Button class="danger" extend @click="bidOnThisHandler(moreAuInfo)">{{ $t('pages.namingSystemPage.goBiddingBtn') }}</Button>
                </div>
            </div>

        </div>

        <!-- if is clicked Add New Name  -->
        <div class="addNewName" v-if="tab == 'claim'">
            <div class="maindiv_input-group-addon">
                <h4>{{ $t('pages.namingSystemPage.registerName') }}</h4><hr>
                <div class="flex flex-align-center flex-justify-content-center">
                    <Input v-model="name" :placeholder="$t('pages.namingSystemPage.namePlaceholder')" label=".chain" labelPosition="right"/>
                    <Button @click="registerName" small class="danger">
                        <ae-icon name="plus" />
                    </Button>
                </div>

            </div>
        </div>

        <Loader size="big" :loading="loading || sdk === null" type="transparent" content="" ></Loader>
        <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { fetchData, convertToAE, addressToName } from '../../utils/helper'
import { TX_TYPES, basicTxParams } from '../../utils/constants'
import { TxBuilder } from '@aeternity/aepp-sdk/es';
import Input from '../components/Input';
import Button from '../components/Button';
export default {
    components: {
        Input
    },
    data () {
        return {
            tab:'claim',
            loading: false,
            name: '',
            ak_address: '',
            polling:null,
            activeAuctions: null,
            moreAuInfo: {
                visible: false,
                key: null,
                info: null
            },
            filterType:'soonest',
            bySoonest: true,
            byCharLength: false,
            byBid: false,
            bids: null,
            namesofaddresses: null
        }
    },
    computed: {
        ...mapGetters(['current', 'popup', 'names', 'sdk', 'network', 'account']),
        auctions() {
            if(this.filterType == 'soonest') return this.activeAuctions
            else if(this.filterType == 'length') return this.activeAuctions.sort((a,b) => ( a.name.length - b.name.length ))
            else if(this.filterType == 'bid')  return this.activeAuctions.sort((a,b) => ( a.winning_bid - b.winning_bid ))
        },
        currentBid() {
            if (!this.bids) {
                this.loading = true;
                return null;
            }
            else {
                this.loading = false;
                return this.bids.reduce((a, b) => (a.nameFee.isGreaterThan(b.nameFee) ? a : b));
            }
        },
        previousBids() {
            if (!this.bids) {
                this.loading = true;
                return null;
            }
            else {
                this.loading = false;
                return this.bids.filter(bid => bid !== this.currentBid);
            }
        }
    },
    created() {
        this.loading = true;
        this.polling = setInterval(async () => {
            if (this.moreAuInfo.info != null) {
                this.updateAuctionEntry();
            }
            let middleWareBaseUrl = this.network[this.current.network].middlewareUrl; 
            const fetched = await fetchData(middleWareBaseUrl + '/middleware/names/auctions/active','get','')
            this.activeAuctions = fetched;
            this.$store.dispatch('getRegisteredNames')
            this.loading = false;
        },3000)
    },
    methods: {
        async updateAuctionEntry() {
            const res = await this.$store.dispatch('names/fetchAuctionEntry', this.moreAuInfo.info.name);
            this.expiration = res.expiration;
            this.bids = res.bids;
        },
        bidOnThisHandler(info) {
            this.$router.push({'name':'auction-bid',params: { auctionInfo: info }});
        },
        moreAuctionInfo(key,info) {
            this.moreAuInfo.visible = true;
            this.moreAuInfo.key = key;
            var exists = Object.keys(info).some(function(k) {
                if (k == 'winning_bid') {
                    info[k] = convertToAE(info[k]);
                }
            });
            this.moreAuInfo.info = info;
        },
        async registerName() {
            this.name = this.name.trim();
            var onlyLettersAndNums = /^[A-Za-z0-9]+$/;
            if (this.name == '') {
                this.$store.dispatch('popupAlert', {
                    name: 'account',
                    type: 'requiredField'
                });
            }
            else if (!onlyLettersAndNums.test(this.name)) {
                this.$store.dispatch('popupAlert', {
                    name: 'account',
                    type: 'only_allowed_chars'
                });
            }
            else {
                this.loading = true;
                let name = `${this.name}.chain`
                try {
                    const query = await this.sdk.aensQuery(name)
                    this.loading = false;
                    this.$store.dispatch('popupAlert', { name: 'account', type: 'name_exist' });
                } catch(err) {
                    let tx = {
                        popup:false,
                        tx: {
                            name,
                            recipientId:''
                        },
                        type:'namePreClaim'
                    }
                    this.$store.commit('SET_AEPP_POPUP',true)
                    this.$router.push({'name':'sign', params: {
                        data:tx,
                        type:tx.type
                    }});
                }
            }
        },
        async extend({ name }) {
            try {
                let { id, pointers, ttl } = await this.sdk.getName(name)
                let tx = {
                    popup:false,
                    tx: {
                        name,
                        claim:{ id, name, pointers }
                    },
                    type:'nameUpdate',
                    nameUpdateType:'extend'
                }
                this.$store.commit('SET_AEPP_POPUP',true)
                this.$router.push({'name':'sign', params: {
                    data:tx,
                    type:tx.type
                }}).catch(err => {});
            } catch(e) {
                this.$store.dispatch('popupAlert', { name: 'spend', type: 'transaction_failed'})
            }
            
        }
    },
    beforeDestroy() {
        window.clearTimeout(this.polling)
    }
}
</script>

<style lang="scss" scoped>
.ae-identicon.base{
    width:2rem;
}
.seeAllActiveAuctions li {
    margin-bottom: 5px;
    .auctionInfo {
        width: 100%;
        text-align: left;
        .name { font-weight: bold; }
    } 
}
.tab-holder { margin:2rem auto; }
.au-filter {
    cursor: pointer;
}
.ae-list .ae-list-item:first-child {
    border-top:none !important
}
</style>