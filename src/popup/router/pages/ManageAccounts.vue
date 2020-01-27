<template>
    <div id="manageAccounts" class="popup">
        <div class="actions">
            <button class="backbutton toAccount" @click="navigateAccount"><ae-icon name="back" /> {{$t('pages.manageAccounts.backToAccount')}}</button>
        </div>
        <h3>{{$t('pages.manageAccounts.manageAccounts') }}</h3>
        <ae-panel>
            <h4>{{$t('pages.manageAccounts.allAccounts') }}</h4>
            <hr>
            <ae-list >
                <ae-list-item class="editaccount" fill="neutral" v-for="(subaccount, index) in accounts" v-bind:key="index">
                    <!-- IF not edit -->
                    <div v-if="!subaccount.edit">
                        <ae-identicon class="subAccountIcon" v-bind:address="subaccount.publicKey" size="base" />
                        <span class="name">{{ subaccount.name }}</span>
                        <button @click="subaccount.edit = !subaccount.edit" v-if="!subaccount.isAens"><ae-icon name="edit" class="primary" /></button>
                    </div>
                    <!-- IF edit -->
                    <div v-if="subaccount.edit">
                        <ae-identicon class="subAccountIcon" v-bind:address="subaccount.publicKey" size="base" />
                        <ae-input-plain :placeholder="$t('pages.manageAccounts.enterName')" v-model="subaccount.name" />
                        <button @click="cancelEdit(index)"><ae-icon name="close" /></button>
                        <button @click="nameSave(index)"><ae-icon name="check" /></button>  
                    </div>
                </ae-list-item>
                
            </ae-list>
        </ae-panel>
        <ae-panel>
            <h4 class="addaccount">
                {{ $t('pages.manageAccounts.addNewSubAccount') }}
                <button v-if="!аddNewSubbAcc" @click="AddNewSubbAccount" class="icon-btn"><ae-icon name="plus" /></button>
                <button v-if="аddNewSubbAcc" @click="closeNewSubbAccountForm" class="icon-btn"><ae-icon name="close" /></button>
            </h4>
            <hr>
            <transition name="slide">
                <ul class="slideform" :class="dropdown ? 'open' : ''">
                    <div class="add-form">
                        <ae-input :label="$t('pages.manageAccounts.account')" v-model="newSubAcc" :placeholder="$t('pages.manageAccounts.enterName')"></ae-input>
                        <ae-button @click="addbtn" face="round" fill="primary" extend>{{ $t('pages.manageAccounts.add') }}</ae-button>
                    </div>
                </ul>
            </transition>
        </ae-panel>
        <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
    </div>
</template>

<script>
import store from '../../../store';
import { mapGetters } from 'vuex';
import { getHdWalletAccount } from '../../utils/hdWallet';
import { postMesssage } from '../../utils/connection';
export default {
    data () {
        return {
            logo_top: browser.runtime.getURL('../../../icons/icon_48.png'),
            new_accname: '',
            new_accnameValue: 'MyAccount',
            editAccountName: false,
            аddNewSubbAcc: false,
            dropdown: false,
            newSubAcc: '',
            accounts:[]
        }
    },
    computed: {
        ...mapGetters (['account', 'current', 'network','subaccounts','wallet', 'popup', 'background'])
    },
    created(){
        this.setAccounts();
    },
    methods: {
        setAccounts() {
            this.accounts = this.subaccounts.map(s => {
                return {
                    ...s,
                    edit:false
                }
            });
        },
        cancelEdit(index){
            let account = this.accounts[index];
            account.edit = false;
            account.name = this.subaccounts[index].name;
        },
        nameSave (index) {
            let account = this.accounts[index];
            if (account.name != "") {
                let editedAccounts = this.accounts.map(a => {
                    let { edit, ...acc } = a;
                    return acc;
                });
                this.$store.dispatch('setSubAccounts', editedAccounts).then(() => {
                    browser.storage.local.set({ subaccounts: this.subaccounts}).then(() => { });
                });
                account.edit = false;
            }
            else {
                this.$store.dispatch('popupAlert', {
                    name: 'account',
                    type: 'requiredField'
                });
            }
        },
        AddNewSubbAccount() {
            this.аddNewSubbAcc = true;
            this.dropdown = true;
        },
        closeNewSubbAccountForm() {
            this.dropdown = false;
            this.аddNewSubbAcc = false;
        },
        async addbtn() {
            if (this.newSubAcc != '') {
                let idx = this.subaccounts.filter(s => !s.isLedger && !s.isAirGapAcc).length
                let address = await this.$store.dispatch('getAccount', { idx })
                this.$store.dispatch('setSubAccount', {
                    name: this.newSubAcc,
                    publicKey: address,
                    root:false,
                    balance:0
                }).then(() => {
                    
                    browser.storage.local.set({ subaccounts: JSON.parse(JSON.stringify(this.subaccounts)) }).then(() => {
                        this.$store.dispatch('popupAlert', {
                            name: 'account',
                            type: 'added_success'
                        }).then(() => {
                            let index =  this.subaccounts.length - 1;
                            browser.storage.local.set({activeAccount: index }).then(() => {
                                this.$store.commit('SET_ACTIVE_ACCOUNT', {publicKey:address,index:index});
                            });
                            this.setAccounts();
                        });
                    });
                });
            }
            else {
                this.$store.dispatch('popupAlert', {
                    name: 'account',
                    type: 'requiredField'
                });
            }
            this.newSubAcc = "";
        },
        navigateAccount() {
            this.$router.push('/account')
        }
    }
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';
.ae-list-item { cursor: default !important; }
.ae-list-item .ae-icon, h4 .ae-icon , h4 .icon-btn{ float: right; font-size: 1.2rem; }
#manageAccounts .ae-icon-check { color: #13b100 !important; }
#manageAccounts .ae-icon-close { color: #b10000 !important; }
.editaccount:first-child { border-top: none !important; }
.editaccount div, .addaccount div { width: 100%; }
.editaccount div span, .editaccount div input, .addaccount div span, .editaccount div canvas { float: left; }
.editaccount div button, .addaccount div button { float: right; }
.editaccount div input { width: 58% !important; }

.slideform { position: relative; width: 100%; overflow: hidden; height:0; padding: 0; top: 10px; list-style-type: none; margin:0; }
.slideform.open { height:150px}
.slide-enter, .slide-leave-to{ transform: scaleY(0); }
.add-form { text-align: center; }
.required_fields { color: red; margin: 5px; }
.ae-list-item .ae-icon, h4 .ae-icon { font-size: 1.7rem !important; }
.ae-button { margin-top: 1rem; }
</style>