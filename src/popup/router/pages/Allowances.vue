<template>
  <div class="popup">
    <!-- START main page --->
    <div v-if="allowancePage == ''">
      <div class="actions">
        <button class="backbutton toAccount" @click="navigateFungibleTokens">
          <ae-icon name="back" />
          {{$t('pages.addFungibleToken.backToFungibleTokens')}}
        </button>
      </div>
      <h3 style="text-align:center;">{{$t('pages.allowances.heading') }}</h3>
      <div>
        <ae-panel>
          <h4>{{$t('pages.allowances.createAllowance') }}</h4>
          <hr />
          <small class="sett_info">{{$t('pages.allowances.createAllowanceInfo') }}</small>
          <ae-button
            class="createAllowance"
            @click="createAllowancePage"
            face="round"
            fill="primary"
            extend
          >{{$t('pages.allowances.createButton') }}</ae-button>
        </ae-panel>
        <ae-panel>
          <h4>{{$t('pages.allowances.transferAllowance') }}</h4>
          <hr />
          <small class="sett_info">{{$t('pages.allowances.transferAllowanceInfo') }}</small>
          <ae-button
            class="transferAllowance"
            @click="transferAllowancePage"
            face="round"
            fill="primary"
            extend
          >{{$t('pages.allowances.transferButton') }}</ae-button>
        </ae-panel>
        <ae-panel>
          <h4>{{$t('pages.allowances.allAllowances') }}</h4>
          <hr />
          <small class="sett_info">{{$t('pages.allowances.allAllowancesInfo') }}</small>
          <ae-button
            class="seeAllAllowance"
            @click="seeAllAllowancePage"
            face="round"
            fill="primary"
            extend
          >{{$t('pages.allowances.seeAllButton') }}</ae-button>
        </ae-panel>
      </div>
    </div>
    <!-- END main page --->

    <!-- START create page --->
    <div v-if="allowancePage == 'create'" class="create-allowance allowance-form">
      <div class="actions">
        <button id="toAllowances" class="backbutton toAccount" @click="allowancePage = ''">
          <ae-icon name="back" />
          {{$t('pages.allowances.backToAllowances') }}
        </button>
      </div>
      <h3 style="text-align:center;">{{$t('pages.allowances.createAllowance') }}</h3>
      <br />
      <select class="allowance-token-dropdown" @change="onChange($event)" v-model="selected">
        <option value="default" disabled>{{$t('pages.allowances.chooseToken') }}</option>
        <option v-for="(tok, key) in allowanceTokens" v-bind:key="key" :value="tok.key">{{tok.name}}</option>
      </select>
      <ae-input class="allowance-address" v-model="createform.to_account" label="Address"></ae-input>
      <ae-input
        class="allowance-value"
        v-model.number="createform.value"
        type="number"
        label="Value"
      ></ae-input>
      <div
        class="allowanceExistError"
        v-if="allowanceExistError != '' && allowancePage == 'create' && createform.value != '' && createform.to_account != ''"
      >
        <p>
          {{$t('pages.allowances.allowanceExistMsg') }}
          <a
            class="anchor-here-btn"
            style="color: #c0c0c0"
            @click="toChangeAllowanceForm(allowances)"
          >{{$t('pages.allowances.allowanceExistHere')}}</a>
        </p>
      </div>
      <ae-button
        class="createAllowance"
        @click="makeAllowance"
        face="round"
        fill="primary"
        extend
      >{{$t('pages.allowances.createButton')}}</ae-button>
    </div>
    <!-- END create page --->

    <!-- START transfer page --->
    <div v-if="allowancePage == 'transfer'" class="transfer-allowance allowance-form">
      <div class="actions">
        <button id="toAllowances" class="backbutton toAccount" @click="allowancePage = ''">
          <ae-icon name="back" />
          {{$t('pages.allowances.backToAllowances')}}
        </button>
      </div>
      <h3 style="text-align:center;">{{$t('pages.allowances.transferAllowance')}}</h3>
      <br />
      <select
        :disabled="disableAfterSeeAll ? true : false"
        class="allowance-token-dropdown"
        @change="onChange($event)"
        v-model="selected"
      >
        <option value="default" disabled>{{$t('pages.allowances.chooseToken')}}</option>
        <option v-for="(tok, key) in allowanceTokens" v-bind:key="key" :value="tok.key">{{tok.name}}</option>
      </select>
      <ae-input label="Address">
        <input
          type="text"
          :disabled="disableAfterSeeAll ? true : false"
          class="ae-input allowance-address"
          v-model="transferform.to_account"
        />
      </ae-input>
      <ae-input label="Value">
        <input type="text" class="ae-input allowance-value" v-model="transferform.value" />
      </ae-input>
      <ae-button
        class="transferAllowance"
        @click="transferAllowance"
        face="round"
        fill="primary"
        extend
      >{{$t('pages.allowances.transferButton')}}</ae-button>
    </div>
    <!-- END transfer page --->

    <!-- START seeAll page --->
    <div v-if="allowancePage == 'seeAll'" @load="seeAll" class="seeAll-allowance allowance-form">
      <div class="actions">
        <button id="toAllowances" class="backbutton toAccount" @click="allowancePage = ''">
          <ae-icon name="back" />
          {{$t('pages.allowances.backToAllowances')}}
        </button>
      </div>
      <h3 style="text-align:center;">{{$t('pages.allowances.allAllowances')}}</h3>
      <br />
      <select class="allowance-token-dropdown" @change="seeAll($event)" v-model="selected">
        <option value="default" disabled>{{$t('pages.allowances.chooseToken')}}</option>
        <option
          v-for="(tok, key) in allowanceTokens"
          v-bind:key="key.id"
          :value="tok.key"
        >{{tok.name}}</option>
      </select>
      <div v-if="this.selected != 'default'" class="allAllowances">
        <ae-list v-for="(allowance, index) in allowances" v-bind:key="index.id" face="primary">
          <ae-list-item style="display: block;" fill="primary">
            <b style="word-break: normal; display: block;">{{$t('pages.allowances.allowanceFrom')}}:</b>
            {{allowance.allowanceFrom}} -
            <ae-badge>{{allowance.allowanceAmount}} {{allowance.allowanceToken}}</ae-badge>
          </ae-list-item>
          <ae-button
            face="round"
            fill="primary"
            @click="getAllowance(allowance.allowanceFrom, allowance.allowanceAmount)"
          >{{$t('pages.allowances.getAllowance')}}</ae-button>
        </ae-list>
      </div>
      <div v-if="this.selected == 'default'" class="allowanceMsg">
        <p>{{$t('pages.allowances.tokenChoiceRequired')}}</p>
      </div>
      <div v-if="this.allowances.length == 0" class="allowanceMsg">
        <p>{{$t('pages.allowances.noAllowancesFound')}}</p>
      </div>
    </div>
    <!-- END seeAll page --->

    <!-- START change page --->
    <div v-if="allowancePage == 'change'" class="change-allowance allowance-form">
      <div class="actions">
        <button id="toAllowances" class="backbutton toAccount" @click="allowancePage = ''">
          <ae-icon name="back" />
          {{$t('pages.allowances.backToAllowances')}}
        </button>
      </div>
      <h3 style="text-align:center;">{{$t('pages.allowances.changeAllowance')}}</h3>
      <br />
      <ae-input label="Symbol">
        <input
          type="text"
          :disabled="true"
          class="ae-input allowance-symbol"
          v-model="changeform.symbol"
        />
      </ae-input>
      <ae-input label="Address">
        <input
          type="text"
          :disabled="true"
          class="ae-input allowance-address"
          v-model="changeform.to_account"
        />
      </ae-input>
      <ae-input
        class="allowance-value"
        v-model.number="changeform.value"
        type="number"
        label="Value"
      ></ae-input>
      <small
        class="allowanceExistError"
      >{{$t('pages.allowances.allowedAllowanceAmount')}} {{saveAllowedAllowance}}</small>
      <ae-button
        class="changeAllowanceFormBtn"
        @click="changeAllowanceFormBtn"
        face="round"
        fill="primary"
        extend
      >{{$t('pages.allowances.changeButton') }}</ae-button>
    </div>
    <!-- END change page --->

    <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
    <Loader size="big" :loading="loading" type="transparent"></Loader>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import QrcodeVue from 'qrcode.vue';
import Wallet from '@aeternity/aepp-sdk/es/ae/wallet';
import { MemoryAccount } from '@aeternity/aepp-sdk';
import { MAGNITUDE, MIN_SPEND_TX_FEE, MIN_SPEND_TX_FEE_MICRO } from '../../utils/constants';
import BigNumber from 'bignumber.js';
import Ae from '@aeternity/aepp-sdk/es/ae/universal';
import { FUNGIBLE_TOKEN_CONTRACT } from '../../utils/constants';
import { isNumber } from 'util';
import { truncateSync } from 'fs';

export default {
  data() {
    return {
      loading: false,
      createform: {
        to_account: '',
        value: '0',
      },
      transferform: {
        to_account: '',
        value: '0',
        transferallowedValue: '',
      },
      changeform: {
        symbol: '',
        to_account: '',
        value: '0',
        contractId: '',
      },
      selected: 'default',
      allowancePage: '',
      allowances: [],
      allowanceExistError: '',
      saveAllowedAllowance: '',
      disableAfterSeeAll: false,
      allowanceTokens: [],
    };
  },
  computed: {
    ...mapGetters(['account', 'balance', 'network', 'current', 'wallet', 'activeAccount', 'subaccounts', 'tokenSymbol', 'tokenBalance', 'sdk', 'tokens', 'popup']),
  },
  created() {},
  methods: {
    seeAllAllowancePage() {
      this.loading = true;
      this.allowanceTokens = [];
      this.allowancePage = 'seeAll';
      this.allowances = [];
      this.selected = 'default';
      Object.entries(this.tokens).forEach(async ([key, val]) => {
        if (val.name != 'AE' && val.contract != '') {
          try {
            const contract = await this.$helpers.getContractInstance(FUNGIBLE_TOKEN_CONTRACT, { contractAddress: val.contract });
            let aex9_extensions = await contract.methods.aex9_extensions();
            const extensions = aex9_extensions.decodedResult;
            if (extensions.includes('allowances')) {
              this.allowanceTokens.push(val);
            }
            this.loading = false;
          } catch (error) {
            console.log('error ', error);
          }
        }
      });
    },
    transferAllowancePage() {
      this.loading = true;
      this.allowanceTokens = [];
      this.allowancePage = 'transfer';
      this.disableAfterSeeAll = false;
      this.allowances = [];
      this.selected = 'default';
      this.transferform.to_account = '';
      this.transferform.value = '';
      Object.entries(this.tokens).forEach(async ([key, val]) => {
        if (val.name != 'AE' && val.contract != '') {
          try {
            const contract = await this.$helpers.getContractInstance(FUNGIBLE_TOKEN_CONTRACT, { contractAddress: val.contract });
            let aex9_extensions = await contract.methods.aex9_extensions();
            const extensions = aex9_extensions.decodedResult;
            if (extensions.includes('allowances')) {
              this.allowanceTokens.push(val);
            }
            this.loading = false;
          } catch (error) {
            console.log('error ', error);
          }
        }
      });
    },
    createAllowancePage() {
      this.loading = true;
      this.allowanceTokens = [];
      this.allowancePage = 'create';
      this.allowances = [];
      this.selected = 'default';
      this.createform.value = '0';
      this.createform.to_account = '';
      Object.entries(this.tokens).forEach(async ([key, val]) => {
        if (val.name != 'AE' && val.contract != '') {
          try {
            const contract = await this.$helpers.getContractInstance(FUNGIBLE_TOKEN_CONTRACT, { contractAddress: val.contract });
            let aex9_extensions = await contract.methods.aex9_extensions();
            const extensions = aex9_extensions.decodedResult;
            if (extensions.includes('allowances')) {
              this.allowanceTokens.push(val);
            }
            this.loading = false;
          } catch (error) {
            console.log('error ', error);
          }
        }
      });
    },
    onChange(event) {
      this.selected = event.target.value;
    },
    makeAllowance() {
      if (this.selected == '' || this.selected == 'default') {
        this.$store.dispatch('popupAlert', {
          name: 'account',
          type: 'not_selected_val',
        });
      } else {
        this.tokens.forEach(async element => {
          if (element.key == this.selected) {
            try {
              this.loading = true;
              let contract = await this.$helpers.getContractInstance(FUNGIBLE_TOKEN_CONTRACT, { contractAddress: element.contract });
              let checkAmountLeft = await contract.call('allowance', [{ from_account: this.account.publicKey, for_account: this.createform.to_account }], { callStatic: true });
              let amountLeft = await checkAmountLeft.decode().then(async amount => {
                if (amount != 'None') {
                  let tokensLefttoTransfer = element.balance - amount.Some[0];
                  this.saveAllowedAllowance = (tokensLefttoTransfer + ' ' + element.symbol).toString();
                }
                if (this.createform.value > element.balance) {
                  this.$store.dispatch('popupAlert', { name: 'spend', type: 'insufficient_balance' });
                  this.loading = false;
                } else {
                  try {
                    this.allowances.push({
                      allowance: element.contract,
                      allowanceTo: this.createform.to_account,
                      allowanceAmount: this.createform.value,
                      allowanceToken: element.symbol,
                      accountCurrentBalance: element.balance,
                    });
                    let value = this.createform.value.toString();
                    let create = await this.$helpers.contractCall({ instance: contract, method: 'create_allowance', params: [this.createform.to_account, value] });
                    let dec = await create.decode();
                    this.$store.dispatch('popupAlert', { name: 'account', type: 'added_success' });
                    this.loading = false;
                    this.createform.to_account = '';
                    this.createform.value = '';
                    this.selected = 'default';
                  } catch (error) {
                    if (error.toString().includes('ALLOWANCE_ALREADY_EXISTENT')) {
                      this.allowanceExistError = 'Allowance alredy exist!';
                      this.loading = false;
                    } else if (
                      error.toString().includes('fails to match the required pattern: /^(ak_|ct_|ok_|oq_)/]]') ||
                      error.toString().includes('Cannot unify address') ||
                      error.toString().includes('Unbound variable')
                    ) {
                      this.$store.dispatch('popupAlert', { name: 'spend', type: 'incorrect_address' });
                      this.loading = false;
                    } else if (error.toString().includes('NON_NEGATIVE_VALUE_REQUIRED')) {
                      this.loading = false;
                      this.$store.dispatch('popupAlert', { name: 'account', type: 'invalid_number' });
                    } else if (error.toString().includes('Parse errors')) {
                      this.loading = false;
                      this.$store.dispatch('popupAlert', { name: 'account', type: 'token_add' });
                    }
                  }
                }
              });
            } catch (createAllowanceError) {
              if (createAllowanceError.toString().includes('ALLOWANCE_ALREADY_EXISTENT')) {
                this.allowanceExistError = 'Allowance alredy exist!';
                this.loading = false;
              } else if (
                createAllowanceError.toString().includes('fails to match the required pattern: /^(ak_|ct_|ok_|oq_)/]]') ||
                createAllowanceError.toString().includes('Cannot unify address') ||
                createAllowanceError.toString().includes('Unbound variable')
              ) {
                this.$store.dispatch('popupAlert', { name: 'spend', type: 'incorrect_address' });
                this.loading = false;
              } else if (createAllowanceError.toString().includes('NON_NEGATIVE_VALUE_REQUIRED')) {
                this.loading = false;
                this.$store.dispatch('popupAlert', { name: 'account', type: 'invalid_number' });
              } else if (createAllowanceError.toString().includes('Parse errors')) {
                this.loading = false;
                this.$store.dispatch('popupAlert', { name: 'account', type: 'token_add' });
              }
            }
          }
        });
      }
    },
    transferAllowance() {
      if (this.selected == '' || this.selected == 'default') {
        this.$store.dispatch('popupAlert', {
          name: 'account',
          type: 'not_selected_val',
        });
      } else {
        if (
          (this.transferform.value == '' && this.transferform.value.toString().length == 0) ||
          this.transferform.value < 0 ||
          (this.transferform.value > this.transferform.transferallowedValue && this.transferform.transferallowedValue != '')
        ) {
          this.$store.dispatch('popupAlert', { name: 'account', type: 'invalid_number' });
        } else {
          this.tokens.forEach(async element => {
            try {
              if (element.key == this.selected) {
                this.loading = true;
                let contract = await this.$helpers.getContractInstance(FUNGIBLE_TOKEN_CONTRACT, { contractAddress: element.contract, callStatic: true });
                let checkAmountLeft = await contract.call('allowance', [{ from_account: this.transferform.to_account, for_account: this.account.publicKey }], { callStatic: true });
                let amountLeft = await checkAmountLeft.decode();
                try {
                  if (amountLeft != 'None' && amountLeft + this.transferform.value >= amountLeft) {
                    let tx = {
                      popup: false,
                      tx: {
                        source: FUNGIBLE_TOKEN_CONTRACT,
                        address: element.contract,
                        method: 'transfer_allowance',
                        params: [this.transferform.to_account, this.account.publicKey, this.transferform.value],
                        amount: this.transferform.value,
                        token: element.symbol,
                      },
                      callType: 'pay',
                      type: 'contractCall',
                    };
                    this.$store.commit('SET_AEPP_POPUP', true);
                    this.$router.push({
                      name: 'sign',
                      params: {
                        data: tx,
                      },
                    });
                    this.loading = false;
                  }
                } catch (transferError) {
                  if (transferError.toString().includes('BALANCE_ACCOUNT_NOT_EXISTENT')) {
                    this.$store.dispatch('popupAlert', { name: 'fungible_token', type: 'balance_account_not_existent' });
                  }
                }
              }
            } catch (err) {
              if (err.toString().includes('fails to match the required pattern: /^(ak_|ct_|ok_|oq_)/]]')) {
                this.$store.dispatch('popupAlert', { name: 'spend', type: 'incorrect_address' });
              }
            }
          });
        }
      }
    },
    async seeAll() {
      this.loading = true;
      this.allowances = [];
      this.selected = '';
      this.selected = event.target.value;
      this.tokens.forEach(async element => {
        if (element.key == this.selected) {
          let contract = await this.$helpers.getContractInstance(FUNGIBLE_TOKEN_CONTRACT, { contractAddress: element.contract, callStatic: true });
          let checkAllAllowances = await this.$helpers.contractCall({ instance: contract, method: 'allowances' });
          let all = await checkAllAllowances.decode();
          if (all.length != 0) {
            all.forEach(async singleAllowance => {
              if (singleAllowance[0].for_account == this.account.publicKey) {
                let contract = await this.$helpers.getContractInstance(FUNGIBLE_TOKEN_CONTRACT, { contractAddress: element.contract, callStatic: true });
                let checkAmountLeft = await contract
                  .call('allowance', [{ from_account: singleAllowance[0].from_account, for_account: this.account.publicKey }], { callStatic: true })
                  .then(async amount => {
                    let amountLeft = await amount.decode();
                    let tokensLefttoTransfer = amountLeft.Some[0];
                    this.allowances.push({
                      allowance: element.contract,
                      allowanceFrom: singleAllowance[0].from_account,
                      allowanceAmount: tokensLefttoTransfer,
                      allowanceToken: element.symbol,
                      accountCurrentBalance: element.balance,
                    });
                    this.loading = false;
                  });
              } else {
                this.allowances.length = 0;
                this.loading = false;
              }
            });
          } else {
            this.allowances.length = 0;
            this.loading = false;
          }
        }
      });
    },
    toChangeAllowanceForm(data) {
      this.allowancePage = 'change';
      this.changeform.to_account = data[0].allowanceTo;
      this.changeform.value = data[0].allowanceAmount;
      this.changeform.symbol = data[0].allowanceToken;
    },
    async changeAllowanceFormBtn() {
      this.loading = true;
      if (this.changeform.value == '' && this.changeform.value.toString().length == 0) {
        this.$store.dispatch('popupAlert', { name: 'account', type: 'invalid_number' });
        this.loading = false;
      } else {
        try {
          let contractId = this.allowances[0].allowance;
          let value = this.changeform.value.toString();
          let contract = await this.$helpers.getContractInstance(FUNGIBLE_TOKEN_CONTRACT, { contractAddress: contractId, callStatic: true });
          let checkAmountLeft = await contract.call('allowance', [{ from_account: this.account.publicKey, for_account: this.changeform.to_account }], { callStatic: true });
          let amountLeft = await checkAmountLeft.decode();
          let tokensLefttoTransfer = amountLeft.Some[0];
          if (value < 0) {
            this.$store.dispatch('popupAlert', { name: 'account', type: 'invalid_number' });
          } else if (Number(value) + tokensLefttoTransfer > this.allowances[0].accountCurrentBalance) {
            this.$store.dispatch('popupAlert', { name: 'spend', type: 'insufficient_balance' });
            this.loading = false;
          } else {
            let change = await this.$helpers.contractCall({ instance: contract, method: 'change_allowance', params: [this.changeform.to_account, value] });
            let changeDec = await change.decode();
            this.$store.dispatch('popupAlert', { name: 'fungible_token', type: 'allowance_change_success' }).then(res => {
              this.$router.push('/account');
            });
          }
          this.loading = false;
        } catch (changeallowanceError) {
          if (
            changeallowanceError.toString().includes('fails to match the required pattern: /^(ak_|ct_|ok_|oq_)/]]') ||
            changeallowanceError.toString().includes('Parse errors') ||
            changeallowanceError.toString().includes('Unbound variable')
          ) {
            this.$store.dispatch('popupAlert', { name: 'spend', type: 'incorrect_address' });
            this.loading = false;
          }
        }
      }
    },
    getAllowance(address, amount) {
      this.allowancePage = 'transfer';
      this.transferform.to_account = address;
      this.transferform.value = amount;
      this.transferform.transferallowedValue = amount;
      this.disableAfterSeeAll = true;
    },
    openAllowencesPage() {
      this.$router.push('/allowances');
    },
    navigateFungibleTokens() {
      this.$router.push('/fungible-tokens');
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/base';
.allowanceExistError {
  color: #9d3fc0;
  margin-bottom: 20px;
}

.allowanceExistError a {
  cursor: pointer;
  color: #555;
  text-decoration: underline;
}
.allowance-token-dropdown {
  margin-bottom: 1rem;
  width: 100%;
  height: 4rem;
  background: #ececec;
  border: 0;
  font-size: 19px;
  text-align: center;
  padding: 10px;
}
.allowance-token-dropdown:active,
.allowance-token-dropdown:focus {
  border: none;
  outline: none;
  border-left: 2px solid #ff0d6a;
}
.allowance-token-dropdown option {
  height: 4rem;
  padding: 10px;
  width: 100%;
  border: none;
}
.allowance-form .ae-input-container {
  margin-bottom: 1rem;
}
</style>