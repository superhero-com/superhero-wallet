<template>
    <div class="recent-transactions">
        <div class="flex flex flex-align-center flex-justify-between">
            
        <!-- <div style="justify-content: space-between;display: flex;padding: 0 20px 10px; border-bottom: 1px solid #16161D; "> -->
            <span style="color:#f1f1f1;" class="title">Recent Activity</span>
            <span style="color:#6A8EBE; cursor:pointer;" @click="allTransactions" class="viewAll">View all</span>
        <!-- </div>
            <h3>MY RECENT TRANSACTIONS</h3>
            <ae-button extend fill="primary" face="round" class="all-transactions" @click="allTransactions">
                View All
            </ae-button> -->
        </div>
        
        <div v-if="transactions.latest.length && !loading">
            <div v-if="newTip" style="padding: 10px;font-size: 16px;text-align: center;">
                <ae-icon fill="primary" name="reload" /> New Tip Pending..
            </div>
            <ae-list class="transactionList">
                <TransactionItem :recent="true" :dark="true" v-for="transaction in transactions.latest" v-bind:key="transaction.id" :transactionData="transaction"></TransactionItem>
            </ae-list>
        </div>
        <div v-if="transactions.latest.length == 0 && !loading">
            <p class="paragraph noTransactions">{{$t('pages.account.noTransactionsFound') }}</p> 
        </div>
        <div class="loader-holder">
            <Loader size="small" :loading="loading" ></Loader>
        </div>
        
        <slot></slot>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
    data() {
        return {
            polling:null,
            loading: true,
            newTip: false
        }
    },
    computed: {
        ...mapGetters(['transactions','account','sdk'])
    },
    created () {
        this.pollData();
    },
    methods: {
        async updateTransactions() {
            let transactions = await this.$store.dispatch('getTransactionsByPublicKey',{ publicKey:this.account.publicKey,limit:3 })
            this.loading = false
            this.$store.dispatch('updateLatestTransactions',transactions);
            browser.storage.local.get('pendingTip').then(res => {
                if (res.hasOwnProperty('pendingTip') && res.pendingTip) {
                    this.newTip = true;
                } else {
                    this.newTip = false;
                    browser.storage.local.remove('pendingTip');
                }
            });
        },
        pollData() {
            this.polling = setInterval(async () => {
                if(this.sdk != null) {
                    this.updateTransactions();
                }
            }, 2500);
        },
        allTransactions() {
            this.$router.push('/transactions')
        }
    }
}
</script>

<style scoped>
.recent-transactions {
    padding: 0 20px;
    height: 100%;
}
.recent-transactions h3, .recent-transactions p, .recent-transactions .transactionList {
    color: #fff !important;
}
.all-transactions {
    height:auto !important;
    padding:5px 10px !important;
    width:auto !important;
}
</style>