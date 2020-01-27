<template>
    <div class="popup">
        <div class="actions">
            <button class="backbutton toAccount" @click="navigateUtilities"><ae-icon name="back" />{{ $t('pages.signAndVerifyMsg.backToUtilities') }}</button>
        </div>
        <h3 style='text-align:center;'>{{$t('pages.namingSystemPage.heading') }}</h3>

        <div class="tab-holder">
            <ae-button :class="seeAllRegisteredNames ? 'activeTab': ''" face="flat" fill="primary" @click="seeAllRegisteredNamesHandler" >{{$t('pages.namingSystemPage.yourNamesBtn') }}</ae-button>
            <ae-button :class="seeAllActiveAuctions ? 'activeTab': ''" face="flat" fill="primary" @click="seeAllActiveAuctionsHandler" >{{$t('pages.namingSystemPage.allActiveAuctionsBtn') }}</ae-button>
            <ae-button :class="addNewName ? 'activeTab': ''" face="flat" fill="primary" @click="addNewNameHandler" >{{$t('pages.namingSystemPage.AddNewBtn') }}</ae-button>
        </div>
        <!-- if is clicked Your Names  -->
        <div class="seeAllRegisteredNames" v-if="seeAllRegisteredNames">
            <div class="maindiv_input-group-addon">
                <h4>{{$t('pages.namingSystemPage.registeredNames') }}</h4><hr>
                <ae-list v-if="haveRegisteredNames">
                    <ae-list-item fill="neutral" v-for="(name, key) in names" :key="key" >
                        <ae-identicon class="subAccountIcon" v-bind:address="name.owner" size="base" />
                        <div class="subAccountInfo">
                            <div class="subAccountName">{{name.name}}</div>
                            <ae-address :value="name.owner" length="short" />
                        </div>
                        <ae-button face="flat" fill="primary" @click="extend(name)">{{$t('pages.namingSystemPage.extend') }}</ae-button>
                        <ae-icon fill="primary" face="round" name="reload" class="name-pending" v-if="name.pending"/>
                    </ae-list-item>
                </ae-list>
                <p v-if="!haveRegisteredNames">{{ $t('pages.namingSystemPage.noNames') }}</p>
            </div>
        </div>
        
        <!-- if is clicked All Active  -->
        <div class="seeAllActiveAuctions" v-if="seeAllActiveAuctions">
            <div class="maindiv_input-group-addon">
                <h4 v-if="!moreAuInfo.visible">{{$t('pages.namingSystemPage.activeAuctions') }}</h4>
                <h4 v-if="moreAuInfo.visible">{{$t('pages.namingSystemPage.auctionInfo') }}</h4><hr>

                <ae-filter-list v-if="!moreAuInfo.visible">
                    <p style="margin:0">{{$t('pages.namingSystemPage.filtersBy') }}</p>
                    <ae-filter-item class="au-filter notround" @click.native="filterBySoonest" :active="bySoonest ? true : false">{{$t('pages.namingSystemPage.filterBySoonest') }}</ae-filter-item>
                    <ae-filter-item class="au-filter notround" @click.native="filterByCharLength" :active="byCharLength ? true : false">{{$t('pages.namingSystemPage.filterByCharLength') }}</ae-filter-item>
                    <ae-filter-item class="au-filter notround" @click.native="filterByBid" :active="byBid ? true : false">{{$t('pages.namingSystemPage.filterByBid') }}</ae-filter-item>
                </ae-filter-list>

                <ae-list v-if="!moreAuInfo.visible && activeAuctions != null">
                    <ae-list-item class="singleAuction" fill="neutral" v-for="(info, key) in (bySoonest ? filteredBySoonest : (byCharLength ? filteredByCharLen : (byBid ? filteredByBid : '')))" :key="key" @click="moreAuctionInfo(key,info)" >
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
                    <ae-panel>
                        <span>Expires in: </span><b>{{ moreAuInfo.info.expiration }} </b>blocks<br>
                        <hr>
                        <span>{{ $t('pages.namingSystemPage.currentBid') }}</span>
                        <ae-list-item style="border:none" fill="neutral">
                            <ae-identicon class="subAccountIcon" v-bind:address="moreAuInfo.info.winning_bidder" size="base" />
                            <div class="auctionInfo">
                                <div class="name">{{(moreAuInfo.info.winning_bid).toFixed(3)}} AE</div>
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
                        <ae-button style="width:100% !important" face="flat" fill="primary" @click="bidOnThisHandler(moreAuInfo)">
                            {{ $t('pages.namingSystemPage.goBiddingBtn') }}
                        </ae-button>
                    </ae-panel>
                </div>
            </div>
        </div>

        <!-- if is clicked Add New Name  -->
        <div class="addNewName" v-if="addNewName">
            <div class="maindiv_input-group-addon">
                <h4>{{$t('pages.namingSystemPage.registerName') }}</h4><hr>
                <div class="checkName namingsystem-input-group-addon">
                    <input v-model="name" class="namingsystem-addon-input" />
                    <label class="addon-lbl" >.chain</label>
                </div>
                <ae-button class="regbtn notround" face="icon" fill="primary" @click="registerName">
                    <ae-icon name="plus" />
                </ae-button>
                <small style="font-size:12px; display: inline-block;"><ae-icon style="font-size: 15px;" name="github" />{{$t('pages.namingSystemPage.registerNameRequirement') }}</small>
            </div>
        </div>

        <Loader size="big" :loading="loading" type="transparent" content="" ></Loader>
        <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { fetchData, convertToAE, addressToName } from '../../utils/helper'


export default {
    data () {
        return {
            loading: false,
            name: '',
            ak_address: '',
            polling:null,
            seeAllRegisteredNames: false,
            seeAllActiveAuctions: false,
            addNewName: true,
            activeAuctions: null,
            moreAuInfo: {
                visible: false,
                key: null,
                info: null
            },
            bySoonest: true,
            byCharLength: false,
            byBid: false,
            bids: null,
            namesofaddresses: null
        }
    },
    computed: {
        ...mapGetters(['current', 'popup', 'names', 'sdk', 'network']),
        haveRegisteredNames() {
            return this.names.length > 0;
        },
        filteredBySoonest() {
            return this.activeAuctions;
        },
        filteredByCharLen() {
            return this.activeAuctions.sort((a,b) => {
                return a.name.length - b.name.length;
            })
        },
        filteredByBid() {
            return this.activeAuctions.sort((a,b) => {
                return a.winning_bid - b.winning_bid;
            })
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
            let middleWareBaseUrl = this.network[this.current.network].middlewareUrl; // later will be replaced with the temp one
            // let tempMiddleWareBaseUrl = 'https://testnet.aeternal.io/middleware';
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
        filterBySoonest () {
            this.bySoonest = true;
            this.byCharLength = false;
            this.byBid = false;
        },
        filterByCharLength () {
            this.byCharLength = true;
            this.byBid = false;
            this.bySoonest = false;
        },
        filterByBid () {
            this.byBid = true;
            this.byCharLength = false;
            this.bySoonest = false;
        },
        seeAllRegisteredNamesHandler() {
            this.seeAllRegisteredNames = true;
            this.seeAllActiveAuctions = false;
            this.addNewName = false;
        },
        seeAllActiveAuctionsHandler() {
            this.seeAllRegisteredNames = false;
            this.seeAllActiveAuctions = true;
            this.addNewName = false;
        },
        addNewNameHandler() {
            this.seeAllRegisteredNames = false;
            this.seeAllActiveAuctions = false;
            this.addNewName = true;
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
                const query = this.sdk.aensQuery(name)
                .then(async () => {
                    this.loading = false;
                    this.$store.dispatch('popupAlert', {
                        name: 'account',
                        type: 'name_exist'
                    });
                })
                .catch(async err => {
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
                })
            }
        },
        navigateUtilities(){
            this.$router.push('/utilities')
        },
        async extend({ name }) {
            try {
                let { id, pointers, ttl } = await this.sdk.getName(name)
                let tx = {
                    popup:false,
                    tx: {
                        name,
                        claim:{
                            id,
                            name,
                            pointers
                        }
                    },
                    type:'nameUpdate'
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

<style lang="scss">

@import '../../../common/base';

.singleAuction:hover {
    margin: 5px;
    transition: all-ease;
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
.ae-button.flat.primary {
    color: #F279A8 !important;
    width: 28% !important;
    word-break: break-word;
    box-sizing: border-box;
    border-color: #E72B6E !important;
    text-align: center;
    vertical-align: middle;
    border: 1px solid #f279a8 !important;
    margin: 0px 5px;
    padding: 5px;
    display: inline !important;
}
.ae-button.flat.primary:hover, 
.ae-button.flat.primary:active,
.activeTab  {
    background: #E72B6E !important;
    color: #fff !important;
}
.backbtn {
    width: 50%; margin-top: 5px;
}
.au-filter {
    cursor: pointer;
}
.regbtn{
    background: #FF0D6A;
    color: #ffffff;
    float: right;
    width: 19%;
    border-radius: 0 !important;
}
.maindiv_input-group-addon {
    text-align: center;
}
.maindiv_input-group-addon h4 {
    text-align: left;
    margin: 0 !important; 
}
.namingsystem-input-group-addon {
    background: #ececec;
    border: 1px solid #ccc;
    width: 79%;
    height: 56px;
    float: left;
}
.namingsystem-addon-input {
    width: 75%;
    outline: none;
    color: #828282;
    padding: 0;
    height: 55px;
    text-indent: 5px;
    caret-color: #ff0d6a;
}
.addon-lbl {
    font-weight: 600;
    color: #828282;
}
input:active,input:focus {
    border: none;
    outline: none;
}
.sett_info {
    color: #9c9c9c;
    text-align: left;
    width: 100%;
    margin: 0 0px 10px;
    display: block;
    word-break: break-word;
}

.notround { border-radius: 0 !important; }
.ae-list .ae-list-item:first-child {
    border-top:none !important
}
</style>

