<template>
    <div class="popup">
        <div class="actions">
            <button class="backbutton toAccount" @click="navigateUtilities"><ae-icon name="back" /> {{$t('pages.tipPage.backToUtilities')}}</button>
        </div>
        <div>
            <h3>{{$t('pages.tipPage.heading') }}</h3>
            <ae-panel>
                <div class="tipWebsiteHeader flex flex-align-center ">
                    <Loader size="small" class="loader" v-if="loadFavicon" :loading="loadFavicon" v-bind="{'content':''}"></Loader>
                    <img :src="favicon" v-if="!loadFavicon && typeof favicon !== 'undefined'" class="domainFavicon"/>
                    <div v-if="!loadFavicon && typeof favicon == 'undefined' " class="domainFavicon noFavicon">{{$t('pages.tipPage.noImage')}}</div>
                    <div class="domainInfo text-left">
                        <div class="domain">
                            <h3>
                                {{ domain }}
                                <span class="full-domain">{{ domain }}</span>
                            </h3>
                        </div>
                        <h6>{{ title }}</h6>
                        <!-- <p class="balance"></p> -->
                        <p>
                            <!-- <div class="verifyRow">
                                <ae-icon fill="alternative" face="round" name="aeternity" /> 
                                {{ unpaid }}
                            </div> -->
                            <div v-if="canClaim" class="verified verifyRow">
                                <ae-icon fill="alternative" face="round" name="check" /> 
                                {{$t('pages.tipPage.domainVerified')}}
                            </div>
                            <div v-else class="notVerified verifyRow">
                                <ae-icon fill="alternative"  face="round" name="close" /> 
                                {{$t('pages.tipPage.domainNotVerified')}}
                            </div>
                            <!-- <span class="verifyBtn" @click="checkDomain"> {{$t('pages.tipPage.check')}}</span> -->
                        </p>
                        <!-- <div class="small-checkbox">
                            <ae-check v-model="tipDomain" @change="tipWebsiteType">
                                {{$t('pages.tipPage.tipDomain') }}
                            </ae-check>
                        </div> -->
                    </div>
                </div>
                <ae-divider />
                <div class="claim-info">
                    <div class="balance">{{ unpaid }}</div>
                    <small>  {{ $t('pages.tipPage.claimInfo') }} </small>
                    <ae-button-group class="claimTips">
                        <ae-button face="round" fill="primary" :class="!canClaim ? 'disabled' : ''" @click="claimTips">{{ $t('pages.tipPage.claim') }}</ae-button>
                    </ae-button-group>
                </div>
            </ae-panel>
            <ae-panel>
                <div class="tabs">
                    <span :class="activeTab == 'details' ? 'tab-active' : ''" @click="selectActiveTab('details')">{{ $t('pages.tipPage.sendHeading') }}</span>
                    <span :class="activeTab == 'tips' ? 'tab-active' : ''" @click="selectActiveTab('tips')">{{ $t('pages.tipPage.tipsForDomain') }}</span>
                </div>
                <div v-if="activeTab == 'details'">
                    <ae-input label="More info" class="my-2">
                        <textarea class="ae-input textarea" v-model="note" slot-scope="{ context }" @focus="context.focus = true" @blur="context.focus = false" />
                    </ae-input>
                    <!-- <h4> {{$t('pages.tipPage.sendHeading')}}</h4>
                    <hr> -->
                    <div class="flex flex-justify-between tipWebisteAmount">  
                        <ae-badge :class="selectedTip == index ? 'alternative' : ''" @click.native="selectTip(index)" v-for="(tip,index) in tips" :key="index">{{tip == 0 ? 'other' : `${tip} ${tokenSymbol}`}} </ae-badge>
                    </div>
                    <div>
                        <div class="range-slider" :class="!showSlider ? 'hideSlider' : '' ">
                            <div class="sliderOver"></div>
                            <span class="tipMin tipAmount">1 {{tokenSymbol}}</span>
                            <span class="tipMax tipAmount">100 {{tokenSymbol}}</span>
                            <input class="range-slider__range" type="range"  min="1" max="100" step="1"  v-model="finalAmount" @input="setTip" ref="tipSlider">
                        </div>
                        
                        <div class="amount-container" :class="!showSlider ? 'hideSlider' : '' ">
                            <!-- <h4>{{$t('pages.tipPage.amountToTip')}}</h4> -->
                            <div class="sliderOver"></div>
                            <ae-input label="Tip amount" placeholder="0.0" aemount v-model="finalAmount" disabled="true" class="finalAmount">
                                <ae-text slot="header" fill="black">{{tokenSymbol}}</ae-text>
                                <ae-toolbar slot="footer" class="flex-justify-between">
                                <div>
                                    {{$t('pages.tipPage.transactionFee')}}
                                    </div>
                                    <div>
                                        {{txFee}} AE
                                    </div>
                                </ae-toolbar>
                            </ae-input>
                        </div>
                        
                    </div>
                    <div class="flex flex-justify-between balanceInfo">
                        <div>
                            {{$t('pages.tipPage.balance')}}
                        </div>
                        <div class="balance no-sign">
                            {{tokenBalance}} {{tokenSymbol}}
                        </div>
                    </div>
                    <ae-button face="round" fill="alternative" extend class="sendTip" @click="sendTip">{{$t('pages.tipPage.sendTipBtn')}}</ae-button>
                </div>

                <div v-if="activeTab == 'tips'">   
                    <div v-if="loadingTips" class="text-center">
                        <Loader size="small" :loading="loadingTips"></Loader>
                    </div>
                    <div v-else>
                        <ae-list v-if="websiteTips && websiteTips.length">
                            <ae-list-item fill="neutral" v-for="(tip,index) in websiteTips" :key="index">
                                <ae-identicon class="identicon" :address="tip.sender" size="base" />
                                <div class="text-left mr-auto tip-content">
                                    <ae-address :value="tip.sender" length="short" />
                                    <ae-text face="mono-xs" class="transactionDate">{{ new Date(tip.received_at).toLocaleString() }}</ae-text>
                                    <ae-text face="mono-xs"> {{ tip.note }} </ae-text>
                                </div>
                                <div>
                                    <span class="balance">{{ tip.amount }}</span>
                                </div>
                            </ae-list-item>
                        </ae-list>
                        <p v-else>
                            {{ $t('pages.tipPage.noTips') }}
                        </p>
                    </div>
                </div>
            </ae-panel>
        </div>
        <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { extractHostName, convertToAE } from '../../utils/helper';
import { setInterval, setTimeout, setImmediate, clearInterval } from 'timers';
import { MAGNITUDE, MIN_SPEND_TX_FEE, MIN_SPEND_TX_FEE_MICRO, TIPPING_CONTRACT, toMicro } from '../../utils/constants';
import BigNumber from 'bignumber.js';

export default {
    data() {
        return {
            domain:'',
            favicon:undefined,
            title:'',
            url:'',
            loadFavicon:true,
            domainVerified:true,
            tips: [1,5,10,0],
            selectedTip:0,
            tipAmount:0,
            finalAmount:1,
            showSlider:false,
            txFee:MIN_SPEND_TX_FEE,
            tipDomain: false,
            note:undefined,
            unpaid:0,
            domainDataInterval:null,
            websiteTips:undefined,
            loadingTips: true,
            activeTab:'details',
            canClaim: false
        }
    },
    computed: {
        ...mapGetters(['balance','account','tokenSymbol','tokenBalance','popup', 'network', 'tipping', 'current', 'tippingReceiver']),
        maxValue() {
            let calculatedMaxValue = this.balance - MIN_SPEND_TX_FEE
            return calculatedMaxValue > 0 ? calculatedMaxValue.toString() : 0;
        }
    },
    watch:{
        finalAmount() {
           setTimeout(() => {
                let elem = this.$refs["tipSlider"];
                this.setSliderBackground(elem);
            },10);
        }
    },
    created() {
        this.getDomainData()
        this.domainDataInterval = setInterval(() => {
            this.getDomainData()
        }, 5000)
    },
    mounted() {
        let elem = this.$refs["tipSlider"];
        this.setSliderBackground(elem);
    },  
    methods: {
        getDomainData() {
            browser.tabs.query({active:true,currentWindow:true}).then( async (tabs) => {
                var currentTabUrl = tabs[0].url;
                this.favicon = tabs[0].favIconUrl;
                this.title = tabs[0].title
                this.url = tabs[0].url
                
                await this.tipWebsiteType();

                this.unpaid = convertToAE((await this.tipping.methods['unpaid'](this.domain)).decodedResult)
                if(this.activeTab == 'tips') {
                    this.fetchTips()
                }

                if(this.tippingReceiver && 
                    (this.tippingReceiver.address == this.account.publicKey || 
                        (Array.isArray(this.tippingReceiver.address) && 
                        this.tippingReceiver.address.includes(this.account.publicKey))) 
                    && extractHostName(this.tippingReceiver.host) == extractHostName(currentTabUrl))
                {
                  this.canClaim = true
                }
                setTimeout(() => {
                    this.loadFavicon = false;
                },1500)
            });
        },
        navigateUtilities() {
            this.$router.push('/utilities')
        },
        checkDomain() {
            this.domainVerified = true;
        },
        selectTip(index) {
            this.selectedTip = index;
            if(this.tips[index] == 0) {
                this.showSlider = true;
            }else {
                this.finalAmount = this.tips[index];
                this.showSlider = false;
            }
            setTimeout(() => {
                let elem = this.$refs["tipSlider"];
                this.setSliderBackground(elem);
            },10);
        },
        sendTip() {
            let amount = this.finalAmount;
            
            if (this.maxValue - amount <= 0 || isNaN (amount) || amount <= 0) {
                this.$store.dispatch('popupAlert', { name: 'spend', type: 'insufficient_balance'});
                return;
            } 
            amount = BigNumber(amount).shiftedBy(MAGNITUDE)
            this.confirmTip(this.domain,amount, this.note)
        },
        confirmTip(domain, amount, note) {
            let tx = {
                popup:false,
                tx: {
                    source: TIPPING_CONTRACT,
                    address: this.network[this.current.network].tipContract,
                    params: [ domain, note ],
                    method: 'tip',
                    options: { amount },
                },
                callType: 'pay',
                type:'contractCall'
            }
            this.$store.commit('SET_AEPP_POPUP',true)
            return this.$router.push({'name':'sign', params: {
                data:tx
            }});
        },
        setTip(e) {
            this.finalAmount = e.target.value;
            let slider = e.target;
            this.setSliderBackground(slider);
        },
        setSliderBackground(slider) {
            const percentage = 100*(slider.value-slider.min)/(slider.max-slider.min);
            const bg = `linear-gradient(90deg, #FF0D6A ${percentage}%, #d7dcdf ${percentage+0.1}%)`;
            slider.style.background = bg;
        },
        async tipWebsiteType() {
            if(this.tipDomain) {
                this.domain = extractHostName(this.url);
                this.unpaid = convertToAE((await this.tipping.methods['unpaid'](this.domain)).decodedResult)
            } else {
                this.domain = this.url
                this.unpaid = convertToAE((await this.tipping.methods['unpaid'](this.domain)).decodedResult)
            }
        },
        claimTips() {
            if(this.canClaim) {
                let tx = {
                    popup:false,
                    tx: {
                        source: TIPPING_CONTRACT,
                        address: this.network[this.current.network].tipContract,
                        params: [ this.domain ],
                        method: 'claim',
                    },
                    callType: 'pay',
                    type:'contractCall'
                }
                this.$store.commit('SET_AEPP_POPUP',true)
                return this.$router.push({'name':'sign', params: {
                    data:tx
                }});
            }
            
        },
        async fetchTips() {
            if(this.tipping) {
                this.websiteTips = (await this.tipping.methods['tips_for_url'](this.domain)).decodedResult
                this.websiteTips = this.websiteTips.map(i => ({ ...i, amount:convertToAE(i.amount)}))
                                                    .sort((a,b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())
                this.loadingTips = false
            }
            
        },
        selectActiveTab(tab) {
            this.activeTab = tab
            if(tab == 'tips') {
                this.fetchTips()
            }
        }
    },
    beforeDestroy () {
        clearInterval(this.domainDataInterval)
    },
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';

.actions{
    width:50%;
    margin-top: 5px;
}

.tipWebsiteHeader  {
    margin-bottom:20px;
}
.ae-divider {
    background-color: #bbbbbb !important;
}
.domainFavicon {
    width:32px;
    margin-right:15px;
}
.noFavicon {
    font-size:0.8rem;
    height:32px;
    word-break: break-word;
}
.domainInfo {
    flex-grow:1;
    h3{
        // font-size:1.5rem;
        margin:0;
        word-break: break-word;
        text-overflow: ellipsis;
        overflow: hidden;
        width: 220px;
        white-space: nowrap;
    }
    .domain { 
        position:relative;
        cursor: pointer;
    }
    .domain:hover .full-domain{
        display:block;

    }
    .full-domain {
        display:none;
        position:absolute;
        left:0;
        right: 0;
        top: 115%;
        background: #001833;
        color: #fff;
        padding: 5px;
        border-radius: 6px;
        word-break: break-word;
        white-space: normal;
        z-index: 15;
        font-size: 0.8rem;
    }
    .full-domain:after {
        content:"";
        border: solid black;
        border-width: 0 3px 3px 0;
        display: inline-block;
        padding: 3px;
        transform: rotate(-135deg);
        -webkit-transform: rotate(-135deg);
        -ms-transform: rotate(-135deg);
        position: absolute;
        top: -4px;
        left: 23px;
        background: inherit;
    }
    h6{
        margin:0;
        word-break: break-word;
    }
    p {
        margin:0;
        font-weight:normal;
    }
    .ae-icon {
        color: #fff !important;
        width: 20px !important;
        height: 20px !important;
        font-size: 0.8rem;
        margin-right: 2px;
        border: 2px solid #dae1ea;
    }
    .verifyRow {
        display:inline-block;
        font-size:1rem;
    }
    .verified {
        color:$color-alternative;
    }
    .notVerified {
        color:$primary-color;
        .ae-icon{
            background:$primary-color !important;
        }
    }
    .verifyBtn {
        color:$color-alternative;
        float:right;
        font-size:1rem;
        cursor: pointer;
    }
}
.balance {
    color: $color-alternative;
    font-weight:bold;
}
.claimTips {
    margin-top:10px;
    button.disabled {
        opacity: 0.5;
    }
}
.textarea {
    min-height: 60px;
}
.tipWebisteAmount {
    margin-bottom:25px;
    .ae-badge {
        border-radius:20px;
        width:20%;
        justify-content:center;
        cursor: pointer;
        background:#e4e4e4;
    }
    .ae-badge.primary {
        background:$primary-color;
        color:#fff;
    }
    .ae-badge.alternative {
        background:$color-alternative;
        color:#fff;
    }
}
.sendTip { 
    margin-top:25px;
}
.tipSlider {
    margin:25px 0;
}
.hideSlider {
    opacity: 0.3;
}
.amount-container{
    position:relative;
}
.hideSlider .sliderOver {
    position:absolute;
    z-index:50;
    left:0;
    right:0;
    bottom:0;
    top:0;
}
.balanceInfo {
    margin-top:15px;
}
.btn-50 {
    width:50%;
}
.ae-address {
    font-weight: bold !important;
    color:#000;
}
.tabs {
    margin-top:1rem;
}
.tabs span {
    width:49%;
}
.claim-info {
    margin-top:20px;
    .balance {
        font-weight: bold;
        font-size:3rem;
        color:#000;
    }
    .balance:after {
        font-size:1.5rem;
        content:'AE'
    }
    small {
        font-size:.8rem;
    }
}
.tip-content {
    width:60%;
}

</style>
