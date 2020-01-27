<template>
    <div @click="showTransactionDetails">
        <ae-list-item fill="neutral" class="list-item-transaction" :class="transactionData.hash">
            <ae-identicon :address="transactionAccount" />
            <div class="transaction-address">
                <ae-address :value="transactionAccount" length="short" v-if="transactionAccount != ''"/>
                <ae-text face="mono-xs" class="transactionDate">{{ new Date(transactionData.time).toLocaleTimeString() }}</ae-text>
            </div>
            <div class="text-right balance-change">
                <ae-badge class="badgeTransactionType" :class="transactionType.fill">{{transactionType.type}}</ae-badge>
                <div class="balance" :class="balanceSign" v-if="transactionData.tx.type == 'SpendTx'">{{transactionData.tx.amount / 10 ** 18}}</div>
                <small><span class="balance">{{transactionData.tx.fee / 10 ** 18}}</span></small>
            </div>
        </ae-list-item>
        <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
    </div>
</template>

<script>
import {mapGetters} from 'vuex';
export default  {
    props: ['transactionData'],
    data() {
        return {}
    },
    created() {
    },
    computed: {
        ...mapGetters(['account','popup']),
        balanceSign() {
            return this.transactionData.tx.sender_id == this.account.publicKey || this.transactionData.tx.account_id == this.account.publicKey ? 'minus' : 'plus';
        },
        transactionTypeClass() {
            return "transaction" + (this.transactionData.tx.sender_id == this.account.publicKey || this.transactionData.tx.account_id == this.account.publicKey || this.transactionData.tx.owner_id == this.account.publicKey ? 'Outgoing' : 'Incoming');
        },
        transactionType() {
            if(this.transactionData.tx.type == "SpendTx") {
                if(this.transactionData.tx.sender_id == this.account.publicKey) {
                    return { fill:"primary", type: "Spend Tx Out" }
                }else {
                    return { fill:"alternative", type: "Spend Tx In" }
                }
            }else if(this.transactionData.tx.type == "ContractCreateTx") {
                return { fill:"secondary", type: "Contract Create Tx "}
            }else if(this.transactionData.tx.type == "NamePreclaimTx" || this.transactionData.tx.type == "NameUpdateTx" || this.transactionData.tx.type == "NameClaimTx") {
                return { fill:"", type:this.transactionData.tx.type }
            }else if(this.transactionData.tx.type == "ContractCallTx") {
                return { fill: "secondary", type: "Contract Call Tx" }
            }
            
            return { fill: "", type:this.transactionData.tx.type }
        },
        transactionAccount() {
            if(this.transactionData.tx.type == 'SpendTx' ) {
                return this.transactionData.tx.sender_id
            }else if(this.transactionData.tx.type == 'ContractCreateTx') {
                return  this.transactionData.tx.owner_id
            }else if(this.transactionData.tx.type == 'ContractCallTx') {
                return this.transactionData.tx.caller_id
            }

            return typeof this.transactionData.tx.account_id != "undefined" ? this.transactionData.tx.account_id : "";
            
        }
    },
    methods: {
        showTransactionDetails() {
            this.$router.push({'name':'transaction-details',params: { transaction: this.transactionData }});
        },
        showTransaction(){
            browser.tabs.create({url: this.popup.data, active: false});
        }
    }
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';
.list-item-transaction {
    justify-content: start;
    
    .ae-address {
        
        font-weight: bold;
        color: $color-neutral-negative-2;
    }
    .pending {
        
        font-weight: bold;
        color: $color-secondary;
    }
    .balance-change {
        margin-right: 1rem;
        font-weight: bold;
        color: $color-secondary;
        text-align: right;
        .plus {
            color: $color-alternative !important;
            &:before {
                content: '+';
            }
        }
        .minus {
            color: $primary-color !important;
            &:before {
                content: '-';
            }
        }
        .balance {
            font-weight: bold;
            color: $color-neutral-negative-2;
        }
        small {
            display: block;
            .balance {
                
                font-size: rem(11px);
                font-weight: normal;
                color: $color-neutral-negative-1;
            }
        }
        
    }
    .balance {
        font-weight: bold;
        color: $color-neutral-negative-1;

        &.invert {
            color: #fff;
        }

        &:after {
            content: ' AE';
        }
    }
    .transaction-address {
        text-align: left;
        margin-right: auto;
        margin-left: 1rem;
    }
}
</style>
