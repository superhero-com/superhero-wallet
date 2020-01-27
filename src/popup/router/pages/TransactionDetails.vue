<template>
    <div class="popup">
        <div class="flex flex-justify-between flex-align-center popupPadding">
            <div class="actions" >
                <button class="backbutton toAccount" @click="back"><ae-icon name="back" /> {{$t('pages.transactionDetails.backToTransactions')}}</button>
            </div>
            <div class="actions filtersOpen">
                <ae-button extend class="filtersBtn" :class="txAdvancedMode ? 'enabled' : 'disabled' " face="round" @click="setAdvancedMode" >
                    {{$t('pages.transactionDetails.advancedMode')}}
                </ae-button>
            </div> 
        </div>
        <h3 class="transactionsPadding">{{$t('pages.transactionDetails.heading')}}</h3>
        <ae-list class="transactionList ">
            <ae-list-item fill="neutral">
                <div class="detailTitle">{{$t('pages.transactionDetails.date')}}</div>
                <div class="transactionDate">{{new Date(transaction.time).toLocaleString()}}</div>
            </ae-list-item>
            <ae-list-item fill="neutral">
                <div class="detailTitle">{{$t('pages.transactionDetails.type')}}</div>
                <ae-badge :class="transactionType.fill" class="transactionType">{{transactionType.type}}</ae-badge>
            </ae-list-item> 
            <ae-list-item fill="neutral" class="flex-direction-column">
                <div class="flex-col flex-justify-between flex mb-1" v-if="isSpendTx">
                    <div class="detailTitle">{{$t('pages.transactionDetails.amount')}}</div>
                    <div class="balance transactionAmount">{{txAmount}}</div>
                </div>
                <div class="flex-col flex-justify-between flex mb-1">
                    <div class="detailTitle">{{$t('pages.transactionDetails.fee')}}</div>
                    <div class="balance transactionFee">{{txFee}}</div>
                </div>
                <div class="flex-col flex-justify-between flex flex-align-center">
                    <div class="detailTitle">{{$t('pages.transactionDetails.total')}}</div>
                    <div class="balance balanceTotal">{{txTotal}}</div>
                </div>
            </ae-list-item>
            <ae-list-item fill="neutral" class="flex-direction-column"  v-if="isSpendTx">
                <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.txFrom')}} <button :class="transactionType.fill" v-clipboard:copy="transaction.tx.sender_id" @click="copy" class="copyBtn">{{$t('pages.transactionDetails.copy')}}</button></div>
                <input disabled :value="transaction.tx.sender_id" length="flat"  class="transationFrom transactionDetailsInputs"/>
            </ae-list-item>
            <ae-list-item fill="neutral" class="flex-direction-column"  v-if="isSpendTx">
                <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.txTo')}} <button :class="transactionType.fill" v-clipboard:copy="transaction.tx.recipient_id" @click="copy" class="copyBtn">{{$t('pages.transactionDetails.copy')}}</button></div>
                <input disabled :value="transaction.tx.recipient_id" length="flat" class="transactionTo transactionDetailsInputs"/>
            </ae-list-item>
            <ae-list-item fill="neutral" class="flex-direction-column"  v-if="!isSpendTx && transactionType.fill != ''">
                <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.txAccount')}} <button :class="transactionType.fill" v-clipboard:copy="transaction.tx.account_id" @click="copy" class="copyBtn">{{$t('pages.transactionDetails.copy')}}</button></div>
                <input disabled :value="txAccount" length="flat" class="transactionTo transactionDetailsInputs"/>
            </ae-list-item>
            <ae-list-item fill="neutral" class="flex-direction-column"  v-if="isContractCallTx">
                <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.contractId')}} <button :class="transactionType.fill" v-clipboard:copy="transaction.tx.contract_id" @click="copy" class="copyBtn">COPY</button></div>
                <input disabled :value="transaction.tx.contract_id" length="flat" class="transactionTo transactionDetailsInputs"/>
            </ae-list-item>
            <ae-list-item fill="neutral" class="flex-direction-column" v-if="isNameClaimTx">
                <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.txName')}} <button :class="transactionType.fill" v-clipboard:copy="transaction.tx.name" @click="copy" class="copyBtn">{{$t('pages.transactionDetails.copy')}}</button></div>
                <div  class="flex-justify-items-left transactionName text-left">{{transaction.tx.name}}</div>
            </ae-list-item>
            <ae-list-item fill="neutral" class="flex-direction-column">
                <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.txHash')}} <button :class="transactionType.fill" v-clipboard:copy="transaction.hash" @click="copy" class="copyBtn">{{$t('pages.transactionDetails.copy')}}</button></div>
                <input disabled :value="transaction.hash" length="flat"  class="transactionHash transactionDetailsInputs"/>
            </ae-list-item>
            <div v-if="txAdvancedMode">
                <ae-list-item fill="neutral" class="flex-direction-column">
                    <h4>{{$t('pages.transactionDetails.moreInfo')}} </h4>
                </ae-list-item>
                <ae-list-item fill="neutral" class="flex-direction-column">
                    <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.blockHeight')}} </div>
                    <input disabled :value="transaction.block_height" length="flat"  class="transactionDetailsInputs"/>
                </ae-list-item>
                <ae-list-item fill="neutral" class="flex-direction-column">
                    <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.signatures')}} </div>
                    <input disabled :value="transaction.signatures[0]" length="flat"  class="transactionDetailsInputs"/>
                </ae-list-item>
                <ae-list-item fill="neutral" class="flex-direction-column">
                    <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.nonce')}} </div>
                    <input disabled :value="transaction.tx.nonce" length="flat"  class="transactionDetailsInputs"/>
                </ae-list-item>
                
                <div v-if="isContractCallTx || isConractCreateTx">
                    <ae-list-item fill="neutral" class="flex-direction-column">
                        <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.callData')}} </div>
                        <input disabled :value="transaction.tx.call_data" length="flat"  class="transactionDetailsInputs"/>
                    </ae-list-item>
                    <ae-list-item fill="neutral" class="flex-direction-column">
                        <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.gas')}} </div>
                        <input disabled :value="transaction.tx.gas" length="flat"  class="transactionDetailsInputs"/>
                    </ae-list-item>
                    <ae-list-item fill="neutral" class="flex-direction-column">
                        <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.gasPrice')}} </div>
                        <input disabled :value="transaction.tx.gas_price" length="flat"  class="transactionDetailsInputs"/>
                    </ae-list-item>
                </div>
                <div v-if="isConractCreateTx">
                    <ae-list-item fill="neutral" class="flex-direction-column">
                        <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.code')}} </div>
                        <input disabled :value="transaction.tx.code" length="flat"  class="transactionDetailsInputs"/>
                    </ae-list-item>
                    <ae-list-item fill="neutral" class="flex-direction-column">
                        <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.abiV')}} </div>
                        <input disabled :value="transaction.tx.abi_version" length="flat"  class="transactionDetailsInputs"/>
                    </ae-list-item>
                    <ae-list-item fill="neutral" class="flex-direction-column">
                        <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.vmV')}} </div>
                        <input disabled :value="transaction.tx.vm_version" length="flat"  class="transactionDetailsInputs"/>
                    </ae-list-item>
                </div>
                <div v-if="isSpendTx">
                    <ae-list-item fill="neutral" class="flex-direction-column">
                        <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.payload')}} </div>
                        <input disabled :value="transaction.tx.payload" length="flat"  class="transactionDetailsInputs"/>
                    </ae-list-item>
                </div>
                <div v-if="transaction.tx.type == 'NamePreclaimTx'">
                    <ae-list-item fill="neutral" class="flex-direction-column">
                        <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.commitment')}} </div>
                        <input disabled :value="transaction.tx.commitment_id" length="flat"  class="transactionDetailsInputs"/>
                    </ae-list-item>
                </div>
                <div v-if="isNameClaimTx">
                    <ae-list-item fill="neutral" class="flex-direction-column">
                        <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.nameSalt')}} </div>
                        <input disabled :value="transaction.tx.name_salt" length="flat"  class="transactionDetailsInputs"/>
                    </ae-list-item>
                </div>
                <div v-if="transaction.tx.type == 'NameUpdateTx'">
                    <ae-list-item fill="neutral" class="flex-direction-column">
                        <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.clientTtl')}} </div>
                        <input disabled :value="transaction.tx.client_ttl" length="flat"  class="transactionDetailsInputs"/>
                    </ae-list-item>
                    <ae-list-item fill="neutral" class="flex-direction-column">
                        <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.nameId')}} </div>
                        <input disabled :value="transaction.tx.name_id" length="flat"  class="transactionDetailsInputs"/>
                    </ae-list-item>
                    <ae-list-item fill="neutral" class="flex-direction-column">
                        <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.nameTtl')}} </div>
                        <input disabled :value="transaction.tx.name_id" length="flat"  class="transactionDetailsInputs"/>
                    </ae-list-item>
                    <ae-list-item fill="neutral" class="flex-direction-column">
                        <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.pointerId')}} </div>
                        <input disabled :value="transaction.tx.pointers[0].id" length="flat"  class="transactionDetailsInputs"/>
                    </ae-list-item>
                    <ae-list-item fill="neutral" class="flex-direction-column">
                        <div class="flex-col text-left mb-1 detailTitle">{{$t('pages.transactionDetails.pointerKey')}} </div>
                        <input disabled :value="transaction.tx.pointers[0].key" length="flat"  class="transactionDetailsInputs"/>
                    </ae-list-item>
                </div>
            </div>
        </ae-list>
        <ae-button-group  class="btnFixed">
            <ae-button face="round" class=" transactionExplorerBtn" :fill="transactionType.fill != '' ? transactionType.fill : null" @click="transactionInExplorer">    <ae-icon name="search" />  {{$t('pages.transactionDetails.explorer')}}  </ae-button>
        </ae-button-group>
        <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
    </div>

</template>

<script>
import { mapGetters } from 'vuex';
export default {
    data() {
        return {
        }
    },
    props: ['transaction'],
    computed: {
        ...mapGetters(['account','current','network' ,'popup', 'txAdvancedMode']),
        txAmount() {
            return this.isSpendTx ? this.transaction.tx.amount / 10 ** 18 : 0; 
        },
        txFee() {
            return this.transaction.tx.fee / 10 ** 18;
        },
        txTypeBadge () {
           return 'badge' + this.transaction.tx.type;
        },
        transactionType() {
            if(this.transaction.tx.type == "SpendTx") {
                if(this.transaction.tx.sender_id == this.account.publicKey) {
                    return { fill:"primary", type: "Spend Tx Out" }
                }else {
                    return { fill:"alternative", type: "Spend Tx In" }
                }
            }else if(this.transaction.tx.type == "ContractCreateTx") {
                return { fill:"secondary", type: "Contract Create Tx" }
            }else if(this.transaction.tx.type == "NamePreclaimTx" || this.transaction.tx.type == "NameUpdateTx" || this.transaction.tx.type == "NameClaimTx") {
                return { fill:"", type:this.transaction.tx.type }
            }else if(this.transaction.tx.type == 'ContractCallTx') {
                return { fill:"secondary", type: "Contract Call Tx" }
            }

            return { fill:"", type:this.transaction.tx.type }
        },
        transactionThemeColor () {
            return this.transaction.tx.sender_id == this.account.publicKey ? 'secondary' : 'alternative';
        },
        isSpendTx() {
            return this.transaction.tx.type == 'SpendTx';
        },
        isNameClaimTx() {
            return this.transaction.tx.type == 'NameClaimTx';
        },
        isConractCreateTx() {
            return this.transaction.tx.type == 'ContractCreateTx';
        },
        isContractCallTx() {
            return this.transaction.tx.type == 'ContractCallTx'
        },
        txTotal() {
            return (this.txAmount + this.txFee).toFixed(7)
        },
        txAccount() {
            if(this.isConractCreateTx) {
                return this.transaction.tx.owner_id
            }else if(this.isContractCallTx) {
                return this.transaction.tx.caller_id
            }
            return this.transaction.tx.account_id
        }
    },
    methods: {
        transactionInExplorer() {
            browser.tabs.create({url: this.network[this.current.network].explorerUrl + '/transactions/' + this.transaction.hash, active: false});
        },
        back() {
            this.$router.push('/transactions');
        },
        copy(){
            this.$store.dispatch('popupAlert', { name: 'account', type: 'publicKeyCopied'});
        },
        setAdvancedMode() {
            this.$store.commit('SET_TX_ADVANCED_MODE', !this.txAdvancedMode)
        }
    }
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';
.transactionDetailsInputs {
    width: 100%;
    background: #EDF3F7;
    color: #000;
    padding: 20px;
}
.copyBtn {
    color: #ffffff;
    background:#929CA6;
    float: right;
    &.primary {
        background:$primary-color;
    }
    &.alternative {
        background:$color-alternative;
    }
    &.secondary {
        background:$color-secondary;
    }
}
.ae-list-item {
    justify-content: space-between;
}
.detailTitle {
    color:$color-neutral-negative-1;
}
.balanceTotal {
    font-size:1.5rem;
    color:#000;
}
.badgeSpendTx {
    background:$primary-color !important;
    color:#FFF !important;
}
.text-left {
    text-align: left;
}
.transactionList {
    margin-bottom:45px !important;
}
.transactionName {
    font-family:"IBM Plex Mono", monospace;
    width:100%;
}
.filtersBtn {
    margin: 0;
    height: auto !important;
    padding: .4rem 1rem !important;
    font-size: .7rem !important;
}
.filtersBtn.enabled {
    background: $primary-color !important;
}
.filtersBtn.disabled {
    background:$color-neutral-negative-1;
}
</style>
