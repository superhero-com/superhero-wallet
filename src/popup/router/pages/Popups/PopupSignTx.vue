<template>
    <div class="popup">
        <ae-list class="spendTxDetailsList">
            <ae-list-item fill="neutral" class="flex-justify-between whiteBg noBorder">
                <div class="flex flex-align-center accountFrom">
                    <ae-identicon :address="account.publicKey" />
                    <span  class="spendAccountAddr">{{ activeAccountName }}</span>
                </div>
                <div class="arrowSeprator">
                    <ae-icon name="left-more" />
                </div>
                <div class="flex flex-align-center accountTo" v-if="isAddressShow">
                    <ae-identicon :address="receiver"  />
                    <ae-address :value="receiver" v-if="receiver" length="short" class="spendAccountAddr" />
                    <span v-if="!receiver" class="spendAccountAddr">{{$t('pages.signTransaction.unknownAccount')}}</span>
                </div>
                <div v-else class="flex flex-align-center accountTo">
                    <ae-icon name="square" />
                    <span class="spendAccountAddr">{{ txType == 'contractCreateTx' ? 'New contract' : 'AENS' }}</span>
                </div>
            </ae-list-item>
             <ae-list-item fill="neutral" class="flex-justify-between flex-align-start flex-direction-column">
                <div>
                    <!-- <ae-badge v-if="txType=='contractCallTx'">{{$t('pages.signTransaction.contractCall')}}</ae-badge> -->
                    <ae-badge>{{ txType }}</ae-badge>
                </div>
                <div class="balance balanceSpend no-sign" v-if="!isNameTx">{{ toAe(amount) }} {{ token }}</div>
                <!-- <div class="fiat-rate" v-if="!txObject.token && !isNameTx">${{convertCurrency(usdRate,amount)}}</div> -->
            </ae-list-item>
            <ae-list-item v-if="txObject.payload" fill="neutral" class="flex-justify-between whiteBg flex-align-center flex-direction-column flex-align-start" >
                <div class="tx-label ">
                    {{ $t('pages.signTransaction.payload') }}
                </div>
                <div class="text-left">
                    <strong>{{ txObject.payload }}</strong>
                </div>
            </ae-list-item>
            
            <ae-list-item v-if="txType == 'nameClaimTx' || txType == 'nameUpdateTx' " fill="neutral" class="flex-justify-between whiteBg  flex-align-center " >
                <div class="tx-label">
                    {{$t('pages.signTransaction.name')}}
                </div>
                <div>
                    <strong>{{ txObject.name }}</strong>
                </div>
            </ae-list-item>
            <ae-list-item v-if="txType == 'nameClaimTx'" fill="neutral" class="flex-justify-between whiteBg flex-align-center " >
                <div class="tx-label ">
                    {{$t('pages.signTransaction.nameSalt')}}
                </div>
                <div>
                    <strong>{{ txObject.preclaim.salt }}</strong>
                </div>
            </ae-list-item>
            <ae-list-item v-if="txType == 'nameUpdateTx'" fill="neutral" class="flex-justify-between whiteBg  flex-align-center flex-direction-column" >
                <div class="tx-label extend text-left">
                    {{$t('pages.signTransaction.nameId')}}
                </div>
                <div class="text-left">
                    <strong>{{ txObject.claim.id }}</strong>
                </div>
            </ae-list-item>
            <ae-list-item fill="neutral" class="flex-justify-between whiteBg flex-direction-column flex-align-center " v-if="alertMsg == ''">
                <div class="flex extend flex-justify-between ">
                    <div class="tx-label">{{ $t('pages.signTransaction.fee') }}</div>
                    <div class="text-right">
                        <div class="balance balanceBig txFee">{{ toAe(txObject.fee) }}</div>
                        <!-- <div class="fiat-rate">${{ convertCurrency(usdRate,selectedFee) }}</div> -->
                    </div>
                </div>
            </ae-list-item>           

            <ae-list-item fill="neutral" class="flex-justify-between whiteBg" v-if="alertMsg == '' && !isNameTx">
                <div class="tx-label">{{ $t('pages.signTransaction.total') }}</div>
                <div class="text-right">
                    <div class="balance balanceBig balanceTotalSpend no-sign">{{ totalSpend }} {{ token }}</div>
                    <!-- <div class="fiat-rate" v-if="!txObject.token">${{ convertCurrency(usdRate,totalSpend) }}</div> -->
                </div>
            </ae-list-item> 
            <ae-list-item v-if="txType == 'contractCreateTx'" fill="neutral" class="flex-justify-between whiteBg flex-align-center flex-direction-column flex-align-start" >
                <div class="tx-label ">
                    {{ $t('pages.signTransaction.compiledCode') }}
                </div>
                <div class="text-left ">
                    <strong>{{ txObject.code }}</strong>
                </div>
            </ae-list-item>
            <ae-list-item v-if="txType == 'contractCreateTx'" fill="neutral" class="flex-justify-between whiteBg flex-align-center flex-direction-column flex-align-start" >
                <div class="tx-label ">
                    {{ $t('pages.signTransaction.callData') }}
                </div>
                <div class="text-left">
                    <strong>{{ txObject.callData }}</strong>
                </div>
            </ae-list-item>
         </ae-list>
          <Alert fill="primary" :show="alertMsg != ''">
            <div slot="content">
                {{alertMsg}}
            </div>
         </Alert>
        <ae-button-group class="btnFixed">
            <ae-button face="round" fill="primary" @click="cancelTransaction" class="reject">{{ $t('pages.signTransaction.reject') }}</ae-button>
            <ae-button face="round" fill="alternative" @click="signTransaction">{{$t('pages.signTransaction.confirm')}}</ae-button>
        </ae-button-group>
        <Loader size="big" :loading="loading" :type="loaderType" :content="loaderContent" ></Loader>
    </div>
</template>


<script>
import { mapGetters } from 'vuex';
import { convertToAE, currencyConv, convertAmountToCurrency, removeTxFromStorage, contractEncodeCall, initializeSDK, checkAddress, chekAensName, escapeCallParam, addRejectedToken  } from '../../../utils/helper';
import { MAGNITUDE, MIN_SPEND_TX_FEE, MIN_SPEND_TX_FEE_MICRO, MAX_REASONABLE_FEE, FUNGIBLE_TOKEN_CONTRACT, TX_TYPES, calculateFee, TX_LIMIT_PER_DAY, TOKEN_REGISTRY_ADDRESS, TOKEN_REGISTRY_CONTRACT, TOKEN_REGISTRY_CONTRACT_LIMA } from '../../../utils/constants';
import { Wallet, MemoryAccount } from '@aeternity/aepp-sdk/es'
import BigNumber from 'bignumber.js';
import { clearInterval, clearTimeout  } from 'timers';
import { TxBuilder } from '@aeternity/aepp-sdk/es';
export default {
    data() {
        return {
            props: window.props,
            token: "AE",
            usdRate: 0,
            alertMsg:"",
            loading:false,
            loaderType:'transparent',
            loaderContent:"",
            unpackedTx: null
        }
    },
    async created() {
        this.unpackedTx = TxBuilder.unpackTx(this.props.action.params.tx)
    },
    computed: {
        ...mapGetters(['account','activeAccountName','balance','network','current','wallet','activeAccount', 'sdk', 'tokens', 'tokenBalance','isLedger','popup', 'tokenRegistry']),
        txType() {  
            return this.unpackedTx.txType
        },
        isAddressShow() {
            if(this.txType == 'contractCreateTx' || this.txType == 'namePreClaimTx' || this.txType == 'nameClaimTx' || this.txType == 'nameUpdateTx') {
                return false
            }
            return true
        },
        txObject() {
            return this.unpackedTx.tx
        },
        tx() {
            return this.props.action.params.tx
        },
        amount() {
            return this.txObject.amount
        },
        receiver() {
            if(this.txType == 'spendTx') {
                return  this.txObject.recipientId
            }else if(this.txType == 'contractCallTx') {
                return  this.txObject.contractId
            }
            return ""
        },
        isNameTx() {
            return this.txType == 'namePreClaimTx' || this.txType == 'nameClaimTx' || this.txType == 'nameUpdateTx'
        },
        totalSpend() {
            if(typeof this.txObject.token != 'undefined') {
                return parseFloat(this.amount).toFixed(7)
            }
            return (parseFloat(this.toAe(this.amount)) + parseFloat(this.toAe(this.txObject.fee))).toFixed(7)
        }   
    },
    methods: {
        convertCurrency(currency, amount) {
            return parseFloat(convertAmountToCurrency(currency,amount))
        },
        toAe(balance) {
            return convertToAE(balance)
        },
        cancelTransaction() {
            if(Object.keys( this.props.action).length) {
                this.props.action.deny()
            }
           
            this.props.reject()
        },
        signTransaction() {
            this.loading = true
            if(Object.keys( this.props.action).length) {
                this.props.action.accept()
            }
           
            this.props.resolve()
        }
    }
}
</script>

<style lang="scss" scoped>
@import '../../../../common/base';
.balanceSpend {
    font-size:2rem;
    color:#001833;
}
.spendTxDetailsList .ae-list-item {
    padding:1rem;
    position:relative;
    cursor: unset;
    text-transform: uppercase;
    font-size:.9rem;
}
.spendTxDetailsList .ae-button {
    margin-bottom:0 !important;
}
.arrowSeprator {
    margin-right:1rem;
    background:$primary-color;
    color:#fff;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    text-align: center;
    vertical-align: middle;
    padding-left: 0px;
    padding-top:1.5px;
    border: 1px solid #d8d8d8;
    line-height:20px;
    .ae-icon {
        font-size:1.2rem !important;
        float:none !important;
    }
    &:after{
        content:"";
    }
}
.whiteBg {
    background:#fff;
}
.spendAccountAddr {
    padding:0 0.5rem !important;
    font-weight:bold !important;
}
.noBorder {
    border-top:none !important;
}
.accountFrom {
    width:50%;
}
.accountTo{
    width:70%;
    .ae-icon {
        font-size:2rem
    }
}
.spendAccountAddr {
    font-size:0.9rem !important;
    font-family:"IBM Plex Mono", monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.btnFixed {
    background:#fff;
}
.btnFixed button {
    width:50%;
}
.confirm.disabled {
    opacity:0.5;
    cursor:unset;
}
.ae-badge {
    border:2px solid #001833;
    background:$color-alternative;
}
.ae-header {
    margin-bottom:0 !important;
}
.extend {
    width:100%;
}
.fiat-rate {
    color:#939393;
    font-size:1rem;
}
.tx-label {
    margin-top:.4rem
}
</style>