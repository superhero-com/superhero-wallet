<template>
  <div class="popup">
    <div class="actions">
      <button class="backbutton toAccount" @click="navigateAccount"><ae-icon name="back" /> {{$t('pages.send.backToAccount')}}</button>
    </div>
    <h3 class="">
      {{$t('pages.send.heading')}} 
      <ae-identicon class="send-account-icon" :address="account.publicKey" size="s" /> 
      {{activeAccountName}}
    </h3>
    <div class="sendContent">
      <ae-input :label="$t('pages.send.recipient')" class="address">
          <textarea class="ae-input textarea" v-model="form.address" placeholder="ak.. / name.test"  slot-scope="{ context }" @focus="context.focus = true" @blur="context.focus = false" />
          <ae-toolbar slot="footer" align="right">
            <div class="paste" @click="scan"><ae-icon name="camera" /> {{ $t('pages.send.scan') }}</div>
          </ae-toolbar>
      </ae-input>
      
      <div>
        <p v-if="sendSubaccounts">{{$t('pages.send.sendSubaccount')}}</p>
        <ae-list class="sendSubaccount">
          <ae-list-item v-for="(account,index) in sendSubaccounts" @click="selectSendSubaccount(account)" fill="neutral" :key="index" class=" flex-align-center">
            <ae-identicon class="subAccountIcon" v-bind:address="account.publicKey" size="base" />
            <div class="subAccountInfo flex flex-align-start flex-direction-column ">
              <div class="subAccountName">{{account.name}}</div>
              <div class="subAccountBalance">{{account.balance}} AE</div>
            </div>
          </ae-list-item>
        </ae-list>
      </div>
      
      <ae-input :label="$t('pages.send.amount')" placeholder="0.0" aemount v-model="form.amount" class="sendAmount">
        <ae-text slot="header" fill="black">
          <span class="token-symbol">{{tokenSymbol}}</span>
          <ae-dropdown v-if="tokens.length > 1">
            <ae-icon name="grid" size="20px" slot="button" />
            <li v-for="(tkn,key) in myTokens" v-bind:key="key" v-if="tkn.name != tokenSymbol" @click="setActiveToken(tkn.key)">
              <img :src="ae_token" class="token-image" alt="" v-if="tkn.key == 0" >
              <ae-identicon class="subAccountIcon" :address="tkn.contract" size="base" v-if="tkn.key != 0"/> {{tkn.name}}
            </li>
          </ae-dropdown>
        </ae-text>
        <ae-toolbar slot="footer" class="flex-justify-between">
          <span>
            {{$t('pages.send.txFee')}}
          </span>
          <span>
            {{txFee}} AE
          </span>
        </ae-toolbar>
      </ae-input>
      <div class="flex flex-justify-between balanceInfo">
          <div>
            {{$t('pages.send.maxSpendableValue')}}
          </div>
          <div class="balance no-sign">
            {{tokenBalance}} {{tokenSymbol}}
          </div>
      </div>
      
      <div>
        <ae-button face="round" fill="primary" class="sendBtn extend" @click="send">{{$t('pages.send.send')}}</ae-button>
      </div>
    </div>
    <input type="hidden" class="txHash" :value="tx.hash" />
    <div class="result" v-if="tx.status">
      <p>{{$t('pages.send.success')}}</p>
      <a :href="tx.url">{{$t('pages.send.seeTransactionExplorer')}}</a>
    </div>
    <Loader size="big" :loading="loading" type="transparent" ></Loader>
    <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import QrcodeVue from 'qrcode.vue';
import Wallet from '@aeternity/aepp-sdk/es/ae/wallet';
import { MemoryAccount } from '@aeternity/aepp-sdk';
import { MAGNITUDE, MIN_SPEND_TX_FEE, MIN_SPEND_TX_FEE_MICRO, MAX_UINT256, calculateFee, TX_TYPES, FUNGIBLE_TOKEN_CONTRACT } from '../../utils/constants';
import BigNumber from 'bignumber.js';
import Ae from '@aeternity/aepp-sdk/es/ae/universal';
import { getPublicKeyByResponseUrl, getSignedTransactionByResponseUrl, generateSignRequestUrl } from '../../utils/airGap';
import { contractEncodeCall, checkAddress, chekAensName } from '../../utils/helper';

export default {
  name: 'Send',
  data() {
    return {
      ae_token: browser.runtime.getURL('../../../icons/ae.png'),
      form: {
        address: '',
        amount: '',
      },
      loading: false,
      tx: {
        status: false,
        hash: '',
        block: '',
        url: ''
      },
      fee: {
        min:0,
        max:0
      }
    }
  },
  props:['address'],
  watch: {
    activeToken() {
      this.fetchFee()
    }
  },
  computed: {
    ...mapGetters(['account', 'balance', 'network', 'current', 'wallet', 'activeAccount', 'subaccounts', 'tokenSymbol', 'tokenBalance', 'sdk', 'tokens', 'popup','activeAccountName']),
    maxValue() {
      let calculatedMaxValue = this.balance - this.maxFee
      return calculatedMaxValue > 0 ? calculatedMaxValue.toString() : 0;
    },
    sendSubaccounts() {
      let subs = this.subaccounts.filter(sub => sub.publicKey != this.account.publicKey);
      return subs.length == 0 ? false : subs;
    },
    txFee() {
      return this.fee.min
    },
    maxFee() {
      return this.fee.max
    },
    activeToken() {
      return this.current.token
    },
    myTokens() {
      return this.tokens.filter((t,index) =>  {
        if(t.parent == this.account.publicKey || t.symbol == 'AE') {
          t.key = index
          return t
        }
        
      })
    }
  },
  created() {
    if(typeof this.address != 'undefined') {
      this.form.address = this.address
    }
  },
  async mounted() {
    this.init()
    this.fetchFee()
  },
  methods: {
    scan(){
      this.$router.push({name:'qrCodeReader' , params: {
        type:'send'
      }})
    },
    setActiveToken(token) {
      this.current.token = token
      this.$store.commit('RESET_TRANSACTIONS',[]);
    },
    async fetchFee() {
      let fee = await calculateFee(this.current.token == 0 ? TX_TYPES['txSign'] : TX_TYPES['contractCall'],{...await this.feeParams()})
      this.fee = fee
    },
    async feeParams() {
      if(this.current.token == 0) {
        return {
          ...this.sdk.Ae.defaults
        }
      }else {
        return {
          ...this.sdk.Ae.defaults,
          callerId:this.account.publicKey,
          contractId:this.tokens[this.current.token].contract,
          callData: await contractEncodeCall(this.sdk,FUNGIBLE_TOKEN_CONTRACT,"transfer",[this.account.publicKey,"0"])
        }
      }
    },
    send(){
      let sender = this.subaccounts.filter(sender => sender.publicKey == this.account.publicKey);
      let isAirGapAcc = sender[0].isAirGapAcc == true && sender[0].isAirGapAcc != undefined;
      let amount = BigNumber(this.form.amount).shiftedBy(MAGNITUDE);
      let receiver = this.form.address;
      if(receiver == '' || (!checkAddress(receiver) && !chekAensName(receiver) ) )  {
        this.$store.dispatch('popupAlert', { name: 'spend', type: 'incorrect_address'});
        this.loading = false;
        return;
      }
      if(this.form.amount <= 0) {
        this.$store.dispatch('popupAlert', { name: 'spend', type: 'incorrect_amount'});
        this.loading = false;
        return;
      }
      if (this.tokenSymbol != 'AE' && this.form.amount % 1 != 0) {
        this.$store.dispatch('popupAlert', { name: 'spend', type: 'integer_required'});
        this.loading = false;
        return;
      }
      if (this.maxValue - this.form.amount <= 0 && this.current.token == 0) {
        this.$store.dispatch('popupAlert', { name: 'spend', type: 'insufficient_balance'});
        this.loading = false;
        return;
      } 
      if(this.current.token != 0 ) {
        if(this.maxValue - this.txFee <= 0) {
          this.$store.dispatch('popupAlert', { name: 'spend', type: 'insufficient_balance'});
          this.loading = false;
          return;
        }
        if(this.tokenBalance - this.form.amount <= 0) {
          this.$store.dispatch('popupAlert', { name: 'spend', type: 'insufficient_balance'});
          this.loading = false;
          return;
        }
        let tx = {
          popup:false,
          tx: {
            source:FUNGIBLE_TOKEN_CONTRACT,
            method:'transfer', 
            params: [receiver,parseFloat(this.form.amount)],
            address:this.tokens[this.current.token].contract,
            amount:parseFloat(this.form.amount),
            token:this.tokenSymbol
          },
          type:'contractCall'
        }
        this.$store.commit('SET_AEPP_POPUP',true)
        this.$router.push({'name':'sign', params: {
          data:tx
        }});
      }
      else {
        if (isAirGapAcc) {
          browser.storage.local.get('airGapGeneratedKey').then(async publicKHex => {
            const spendTx = await this.sdk.spendTx({senderId: this.account.publicKey, recipientId: receiver, amount: amount});
            const generated = generateSignRequestUrl(this.network[this.current.network].networkId, spendTx, publicKHex.airGapGeneratedKey);
            this.$router.push({'name': 'signTransactionByQrCode', params:{url:generated}})
          });
        }
        else {
          let tx = {
            popup:false,
            tx: {
              amount:this.form.amount,
              recipientId:receiver
            },
            type:'txSign'
          }
          this.$store.commit('SET_AEPP_POPUP',true)
          this.$router.push({'name':'sign', params: {
            data:tx
          }});
        }
     }
     
    },
    init() {
      let calculatedMaxValue = this.balance - this.maxFee
    },
    init() {
      let calculatedMaxValue = this.balance - this.maxFee
    },
    clearForm () {
      setTimeout(() => {
        this.loading = false;
        this.tx.status = false;
        this.form.address = '';
        this.form.amount = '';
      }, 2000);
    },
    navigateAccount() {
      this.$router.push('/account')
    },
    openExplorer(url) {
      browser.tabs.create({url,active:false});
    },
    selectSendSubaccount(account) {
      this.form.address = account.publicKey;
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';
.sendContent > div:not(.sendAmount):not(.address) { 
  margin-bottom: 10px;
}
.sendContent > div {
  overflow: unset;
}
.balanceInfo {
  margin-top:10px;
}
.token-symbol {
  margin-right: 2rem;
}
.ae-dropdown-button {
  width:16px !important;
  height:16px !important;
}
.sendContent .ae-dropdown {
  margin-bottom:0 !important;
}
.ae-input-container .ae-input-box {
  background: #fff !important;
  border: solid 2px #dcdcdc;
  border-radius: 10px;
}
.address {
  position: relative;
}
.address:focus-within { border-left: #FF0D6A 2px solid; }
.address:focus-within {
  p:not(.ae-text)  { color: #ff0d6a; }
  p:after:not(.ae-text)  { content: '*'; color:#ff0d6a; }
}
.address textarea {
  background: none;
  border: none;
  font-size: 20px;
  outline: none;
  text-align: center;
  font-family: "IBM Plex Mono", monospace;
  font-size: 1.0625rem;
  line-height: 1.5rem;
  font-weight: bold;
}
.address p:not(.ae-text) {
    position: absolute;
    top: 0;
    left: 0;
    font-size: 11px;
    color: #76818c;
    font-weight: 100;
    width: 100%;
    text-align: left;
    padding-left: 15px;
    background: #ececec;
}
.sendSubaccount .ae-list-item {
  cursor:pointer !important;
}
.paste {
  cursor: pointer;
  .ae-icon {
    margin-right:2px;
    display: inline-block;
  }
}
.send-account-icon {
  margin:0 5px;
  transform: translateY(5px);
  -ms-transform: translateY(5px);
  -webkit-transform: translateY(5px);
}
</style>