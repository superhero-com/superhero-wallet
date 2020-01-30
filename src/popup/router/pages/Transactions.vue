<template>
    <div class="popup">
        <div class="flex flex-justify-between flex-align-center popupPadding">
            <div class="actions" >
                <button class="backbutton" @click="navigateAccount"><ae-icon name="back" /> {{$t('pages.transactions.backToAccount')}}</button>
            </div>
            <div class="actions filtersOpen">
                <ae-button extend class="filtersBtn" fill="primary" face="round" @click="openFilter = true">
                    <ae-icon name="filter" />
                    {{$t('pages.transactions.filters')}}
                </ae-button>
            </div> 
        </div>
        
        <h3 class="transactionsPadding mb-0"> {{$t('pages.transactions.heading')}} </h3>
        
        
        <ae-list class="allTransactions">
            <div v-for="(trans,index) in groupedTransactionsByDate" v-bind:key="index">
                <div class="date">{{index}}</div>
                <TransactionItem v-for="transaction in trans" v-bind:key="transaction.id" :transactionData="transaction"></TransactionItem>
            </div>
            <ae-button face="flat" v-if="showMoreBtn" @click="loadMore" fill="neutral"> <ae-icon name="reload" /> {{$t('pages.transactions.loadMore')}}</ae-button>
            <p v-if="showMoreBtn == false">{{$t('pages.transactions.allLoaded')}} </p>
        </ae-list>
        <div class="newTx" @click="mergeNewTransactions" v-if="newTransactions != 0"><span class="newTxCount">{{newTransactions}}</span> {{$t('pages.transactions.newTransactions')}}</div>
        <Loader size="small" :loading="loading" v-bind="{'content':''}"></Loader>


        <ae-modal
            v-if="openFilter"
            @close="openFilter = false"
            title="Filters"
            class="filterModal">   
            <ae-list class="filters">
                <ae-list-item fill="neutral" class="flex-direction-column">
                    <h4>{{$t('pages.transactions.type')}}</h4>
                    <div>
                        <ae-badge :class="filter.direction == '' ? 'selected' : '' " @click.native="setFilter('direction','')">{{$t('pages.transactions.all')}}</ae-badge>
                        <ae-badge :class="filter.direction == 'incoming' ? 'selected' : '' "  @click.native="setFilter('direction','incoming')">{{$t('pages.transactions.incoming')}}</ae-badge>
                        <ae-badge :class="filter.direction == 'outgoing' ? 'selected' : '' "  @click.native="setFilter('direction','outgoing')">{{$t('pages.transactions.outgoing')}}</ae-badge>
                    </div>
                </ae-list-item>
                <ae-list-item fill="neutral" class="flex-direction-column">
                    <h4>{{$t('pages.transactions.spendType')}}</h4>
                    <div>
                        <ae-badge :class="filter.spendType == 'all' ? 'selected' : ''" @click.native="setFilter('spendType','all')">{{$t('pages.transactions.all')}}</ae-badge>
                        <ae-badge :class="filter.spendType == 'spendTx' ? 'selected' : ''" @click.native="setFilter('spendType','spendTx')">{{$t('pages.transactions.spendTx')}}</ae-badge>
                        <ae-badge :class="filter.spendType == 'namePreclaimTx' ? 'selected' : ''" @click.native="setFilter('spendType','namePreclaimTx')">{{$t('pages.transactions.namePreclaim')}}</ae-badge>
                        <ae-badge :class="filter.spendType == 'nameClaimTx' ? 'selected' : ''" @click.native="setFilter('spendType','nameClaimTx')">{{$t('pages.transactions.nameClaim')}}</ae-badge>
                        <ae-badge :class="filter.spendType == 'nameUpdateTx' ? 'selected' : ''" @click.native="setFilter('spendType','nameUpdateTx')">{{$t('pages.transactions.nameUpdate')}}</ae-badge>
                        <ae-badge :class="filter.spendType == 'contractCreateTx' ? 'selected' : ''" @click.native="setFilter('spendType','contractCreateTx')">{{$t('pages.transactions.createTx')}}</ae-badge>
                    </div>
                </ae-list-item>
            </ae-list>
            <div class="filterButtons btnFixed">
                <ae-button
                face="round"
                @click="clearFilter"><ae-icon name="close" />{{$t('pages.transactions.clear')}}</ae-button>
                <ae-button
                face="round"
                fill="primary"
                @click="applyFilter"><ae-icon name="check" />{{$t('pages.transactions.apply')}}</ae-button>
            </div>
        </ae-modal>
    </div>
</template>

<script>
import {mapGetters} from 'vuex';
import { groupBy,orderBy } from 'lodash-es'; 
import { clearInterval, clearTimeout  } from 'timers';
export default {
    data() {
        return {
            transactionsType:'all',
            allTransactions:[],
            loading:true,
            page:1,
            limit:100,
            showMoreBtn:true,
            totalTransactions:0,
            currentCount:0,
            groupedTransactions:{},
            polling:null,
            newTransactions:0,
            newTr:[],
            openFilter:false,
            filter:{
                spendType:'all',
                direction:''
            },
            upadateInterval:null
        }
    },
    computed: {
        ...mapGetters(['account','transactions','current']),
        showMore() {
            return this.currentCount + 1 <= this.totalTransactions;
        },
        publicKey() { this.loading = true; return this.account.publicKey; },
        groupedTransactionsByDate() {
            let txs = (this.filter.direction === '') ? this.transactions.all : 
                (this.filter.direction == 'incoming' ? 
                    this.transactions.all.filter(tx => tx.tx.recipient_id == this.account.publicKey) : 
                    this.transactions.all.filter(tx => tx.tx.sender_id == this.account.publicKey) );
            if(this.filter.spendType == 'spendTx') {
                txs = txs.filter(tx => tx.tx.type == 'SpendTx') 
            }else if(this.filter.spendType == 'namePreclaimTx') {
                txs = txs.filter(tx => tx.tx.type == 'NamePreclaimTx') 
            }else if(this.filter.spendType == 'nameClaimTx') {
                txs = txs.filter(tx => tx.tx.type == 'NameClaimTx') 
            }else if(this.filter.spendType == 'nameUpdateTx') {
                txs = txs.filter(tx => tx.tx.type == 'NameUpdateTx') 
            }else if(this.filter.spendType == 'contractCreateTx') {
                txs = txs.filter(tx => tx.tx.type == 'ContractCreateTx')
            }
            
            return groupBy(
                orderBy(txs,['time'],['desc']),
                (tx) => {
                    const dateString = new Date(tx.time).toDateString();
                    return dateString === new Date().toDateString() ? 'Today' : dateString;
                },
            );
        },
        watchToken() {
            return this.current.token
        }
    },
    created(){
        this.getTotalTransactions();
        this.getTransactions('load');
        this.pollData();
        this.page = this.getPage();
    },
    watch:{
        publicKey() {
            this.loading = true;
            this.page = 1;
            this.getTotalTransactions();
            this.getTransactions('load');
            this.showMoreBtn = true;
        },
        'filter.direction': function (newValue,oldValue) {
            if(this.filter.direction == 'inocming' || this.filter.direction == 'outgoing') {
                this.updateInterval = setInterval(() => {
                    let txs = this.filter.direction == 'incoming' ? this.transactions.all.filter(tx => tx.tx.recipient_id == this.account.publicKey) :  this.transactions.all.filter(tx => tx.tx.sender_id == this.account.publicKey);
                    if(this.showMoreBtn == false ){
                        window.clearInterval(this.updateInterval);
                        return;
                    }
                    if(this.showMoreBtn && (txs.length % this.limit != 0 || txs.length == 0) ) {
                        this.loading = true;
                        this.loadMore();
                    }
                },1000);
            }
        },
    },
    methods: {
        getPage() {
            return this.transactions.all.length == 0 ? 1 : Math.ceil(this.transactions.all.length / this.limit); 
        },
        pollData() {
            this.polling = setInterval(() => {
                this.getTransactions('new');
            }, 5000);
        },
        changeTransactionType(type) {
            this.transactionsType = type;
        },
        getTransactions(type,limit = this.limit){
            if(this.current.token == 0) {
                if(type == 'load') {
                    let transactions = this.$store.dispatch('getTransactionsByPublicKey',{publicKey:this.account.publicKey,page:this.page,limit:limit});
                    transactions.then(res => {
                        if(res.length != 0) {
                            let newTrans = res.filter( tr => {
                                let found = this.transactions.all.find(t => t.hash == tr.hash);
                                if(typeof found == 'undefined') return tr;
                            });
                            this.$store.dispatch('updateAllTransactions',{new:false,transactions:newTrans});
                        }else {
                            this.showMoreBtn = false;
                        }
                        this.loading = false;
                    });
                }else if(type == 'new') {
                    let transactions = this.$store.dispatch('getTransactionsByPublicKey',{publicKey:this.account.publicKey,limit:limit});
                    transactions.then(res => {
                        let newTrans = res.filter( tr => {
                            let found = this.transactions.all.find(t => t.hash == tr.hash);
                            if(typeof found == 'undefined') return tr;
                        });
                        newTrans.forEach(element => {
                            if(typeof this.newTr.find(tr => tr.hash == element.hash) == 'undefined') {
                                this.newTr.unshift(element);
                                this.newTransactions += 1;
                            }
                        });
                    });
                }
            }
        },
        getTotalTransactions() {
            return new Promise((resolve,reject) => {
                let transactions = this.$store.dispatch('getTransactionsByPublicKey',{publicKey:this.account.publicKey,param:'count'});
                transactions.then(res => {
                    this.totalTransactions = res.count;
                    resolve();
                });
            });
            
        },
        mergeNewTransactions() {
            return new Promise ((resolve,reject) => {
                this.$store.dispatch('updateAllTransactions',{new:true,transactions:this.newTr})
                .then(() => {
                    this.newTr = [];
                    this.newTransactions = 0;
                    this.getTotalTransactions()
                    .then(() => {
                        resolve();
                    })
                });
            });

        },
        loadMore() {
            this.mergeNewTransactions()
            .then(() => {
                this.page += 1;
                this.getTransactions('load');
            });
            
        },
        group() {
            
        },
        navigateAccount() {
            this.$router.push('/account')
        },
        setFilter(type,value) {
            this.filter[type] = value;
        },
        applyFilter() {
            this.openFilter = false;
        },
        clearFilter() {
            this.openFilter = false;
            this.filter['direction'] = '';
            this.filter['spendType'] = 'all';
        }
    },
    beforeDestroy () {
      window.clearTimeout(this.polling)
      window.clearTimeout(this.upadateInterval)
    }
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';
.date{
    background: #EDF3F7;
    padding: 0.5rem 1rem;
    color: #4e4e4e;
    text-transform: uppercase;
    font-size: 0.9rem;
    font-family: monospace;
}
.actions {
  width: 50%;
  margin-top: 5px;
}
.newTx {
    position:fixed;
    bottom:2%;
    left:50%;
    -ms-transform: translateX(-50%);
    -webkit-transform:translateX(-50%);
    transform:translateX(-50%);
    background:$primary-color;
    color:#fff;
    padding:.7rem 1rem;
    text-align:center;
    border-radius: 32px;
    cursor:pointer;
}
.newTxCount {
    background: #fff;
    border-radius: 50%;
    color: #000;
    padding: .1rem.5rem;
    line-height: 3px;
    font-size: .9rem;
    font-weight: bold;
    font-family: monospace;
}
.filterModal .ae-dropdown-button{
    width:90px;
}
.typeTx .ae-dropdown-button {
    width:90px !important;
}
.filters h4 {
    margin-top:0 !important;
    margin-bottom:5px;
}
.filters .ae-badge {
    background:#d9d9d9;
}
.filters .ae-badge.selected {
    background:$primary-color;
    color:#fff;
}
.w-100 {
    width:100%;
}
.filtersOpen {
    width:32%;
}
.filters li:first-child {
    border-top:none;
}
.filterButtons {
    margin-top:15px;
}
.filterButtons .ae-button {
    padding:0 1rem !important;
    height:45px !important;
}
.filtersBtn {
    margin: 0;
    height: auto !important;
    padding: .7rem 1rem !important;
}
.popup {
    padding:0;
}
.popupPadding {
    padding:4px 14px;
}
</style>
