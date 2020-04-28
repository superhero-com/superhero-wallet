<template>
  <div class="popup">
    <ae-list class="spendTxDetailsList">
      <ae-list-item fill="neutral" class="flex-justify-between whiteBg noBorder">
        <div class="flex flex-align-center accountFrom">
          <UserAvatar :address="account.publicKey" />
          <span class="spendAccountAddr">{{ activeAccountName }}</span>
        </div>
        <div class="arrowSeprator">
          <ae-icon name="left-more" />
        </div>
        <div class="flex flex-align-center accountTo" v-if="isAddressShow">
          <UserAvatar :address="receiver" />
          <ae-address :value="receiver" v-if="receiver" length="short" class="spendAccountAddr" />
          <span v-if="!receiver" class="spendAccountAddr">{{
            $t('pages.signTransaction.unknownAccount')
          }}</span>
        </div>
        <div v-else class="flex flex-align-center accountTo">
          <ae-icon name="square" />
          <span class="spendAccountAddr">{{
            data.type == 'contractCreate' ? 'New contract' : 'AENS'
          }}</span>
        </div>
      </ae-list-item>
      <ae-list-item
        fill="neutral"
        class="flex-justify-between flex-align-start flex-direction-column"
      >
        <div>
          <ae-badge v-if="data.type == 'contractCall'">{{
            $t('pages.signTransaction.contractCall')
          }}</ae-badge>
          <ae-badge>{{ txType }}</ae-badge>
        </div>
        <div class="balance balanceSpend no-sign" v-if="!isNameTx">{{ amount }} {{ token }}</div>
        <div class="fiat-rate" v-if="!data.tx.token && !isNameTx">
          ${{ convertCurrency(usdRate, amount) }}
        </div>
      </ae-list-item>
      <ae-list-item
        v-if="data.type == 'nameClaim' || data.type == 'nameUpdate'"
        fill="neutral"
        class="flex-justify-between whiteBg  flex-align-center "
      >
        <div class="tx-label">
          {{ $t('pages.signTransaction.name') }}
        </div>
        <div>
          <strong>{{ data.tx.name }}</strong>
        </div>
      </ae-list-item>
      <ae-list-item
        v-if="data.type == 'nameClaim'"
        fill="neutral"
        class="flex-justify-between whiteBg flex-align-center "
      >
        <div class="tx-label ">
          {{ $t('pages.signTransaction.nameSalt') }}
        </div>
        <div>
          <strong>{{ data.tx.preclaim.salt }}</strong>
        </div>
      </ae-list-item>
      <ae-list-item
        v-if="data.type == 'nameUpdate'"
        fill="neutral"
        class="flex-justify-between whiteBg  flex-align-center flex-direction-column"
      >
        <div class="tx-label extend text-left">
          {{ $t('pages.signTransaction.nameId') }}
        </div>
        <div class="text-left">
          <strong>{{ data.tx.claim.id }}</strong>
        </div>
      </ae-list-item>
      <ae-list-item
        fill="neutral"
        class="flex-justify-between whiteBg flex-direction-column flex-align-center "
        v-if="alertMsg == ''"
      >
        <div class="flex extend flex-justify-between ">
          <div class="tx-label">{{ $t('pages.signTransaction.fee') }}</div>
          <div class="text-right">
            <div class="balance balanceBig txFee">{{ selectedFee }}</div>
            <!-- <div class="fiat-rate">${{convertCurrency(usdRate,selectedFee)}}</div> -->
          </div>
        </div>
        <!-- <div class="range-slider">
                    <div class="sliderOver"></div>
                    <input class="range-slider__range" type="range"  :min="fee" :max="maxFee" step="0.000001" v-model="selectedFee">
                </div> -->
      </ae-list-item>
      <ae-list-item
        fill="neutral"
        class="flex-justify-between whiteBg"
        v-if="alertMsg == '' && !isNameTx"
      >
        <div class="tx-label">{{ $t('pages.signTransaction.total') }}</div>
        <div class="text-right">
          <div class="balance balanceBig balanceTotalSpend no-sign">
            {{ totalSpend }} {{ token }}
          </div>
          <!-- <div class="fiat-rate" v-if="!data.tx.token">${{convertCurrency(usdRate,totalSpend)}}</div> -->
        </div>
      </ae-list-item>
    </ae-list>
    <div class="btnFixed">
      <Button half @click="cancelTransaction">{{ $t('pages.signTransaction.reject') }}</Button>
      <Button half @click="signTransaction" class="confirm" :disabled="signDisabled">{{
        $t('pages.signTransaction.confirm')
      }}</Button>
    </div>
    <Loader size="big" :loading="loading" :type="loaderType" :content="loaderContent"></Loader>
    <input type="hidden" class="txHash" :value="hash" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import BigNumber from 'bignumber.js';
import { MAGNITUDE, TX_TYPES, calculateFee } from '../../utils/constants';
import {
  convertAmountToCurrency,
  checkAddress,
  chekAensName,
  aettosToAe,
  aeToAettos,
} from '../../utils/helper';
import Button from '../components/Button';
import UserAvatar from '../components/UserAvatar';

export default {
  components: {
    Button,
    UserAvatar,
  },
  data() {
    return {
      port: null,
      txFee: {
        min: 0,
        max: 0,
      },
      signDisabled: true,
      alertMsg: '',
      loading: false,
      loaderType: 'transparent',
      loaderContent: '',
      errorTx: {
        error: {
          code: 1,
          data: {
            request: {},
          },
          message: 'Transaction verification failed',
        },
        id: null,
        jsonrpc: '2.0',
      },
      selectedFee: 0,
      usdRate: 0,
      eurRate: 0,
      receiver: '',
      hash: '',
      txParams: {},
      sending: false,
      contractInstance: null,
      deployed: null,
      tokenRegistryInstance: null,
    };
  },
  props: ['data'],
  async created() {
    await this.init();
  },

  computed: {
    ...mapGetters([
      'account',
      'activeAccountName',
      'balance',
      'network',
      'current',
      'wallet',
      'activeAccount',
      'sdk',
      'tokens',
      'tokenBalance',
      'isLedger',
      'tokenRegistry',
      'tokenRegistryLima',
    ]),
    maxValue() {
      const calculatedMaxValue = this.balance - this.fee;
      return calculatedMaxValue > 0 ? calculatedMaxValue.toString() : 0;
    },
    amount() {
      return typeof this.data.tx.amount !== 'undefined' ? this.data.tx.amount : 0;
    },
    fee() {
      return this.txFee.min;
    },
    maxFee() {
      return this.txFee.max.toFixed(7);
    },
    totalSpend() {
      if (typeof this.data.tx.token !== 'undefined') {
        return parseFloat(this.amount).toFixed(7);
      }
      return (parseFloat(this.amount) + parseFloat(this.selectedFee)).toFixed(7);
    },
    insufficientBalance() {
      if (this.data.type === 'contractCall' && this.data.tx.method === 'transfer_allowance') {
        return false;
      }
      if (typeof this.data.tx.token !== 'undefined') {
        return this.tokenBalance - this.amount <= 0;
      }

      return this.maxValue - this.amount <= 0;
      // }
    },
    inccorectAddress() {
      if (this.data.type !== 'txSign') {
        return this.receiver == null || this.receiver === '';
      }
      return !checkAddress(this.receiver) && !chekAensName(this.receiver);
    },
    watchBalance() {
      return this.balance;
    },
    txType() {
      if (this.data.type === 'txSign') {
        return 'Send AE';
      }
      if (this.data.type === 'contractCall') {
        if (this.data.tx.method !== '') {
          return this.data.tx.method;
        }
        return 'Contract Call';
      }
      if (this.data.type === 'contractCreate') {
        return 'Contract Create';
      }
      if (this.data.type === 'namePreClaim') {
        return 'Name Preclaim';
      }
      if (this.data.type === 'nameClaim') {
        return 'Name Claim';
      }
      if (this.data.type === 'nameUpdate') {
        return 'Name Update';
      }
      if (this.data.type === 'nameBid') {
        return 'Name Claim';
      }

      return this.data.type;
    },
    isAddressShow() {
      if (
        this.data.type === 'contractCreate' ||
        this.data.type === 'namePreClaim' ||
        this.data.type === 'nameClaim' ||
        this.data.type === 'nameBid' ||
        this.data.type === 'nameUpdate'
      ) {
        return false;
      }
      return true;
    },
    isNameTx() {
      return (
        this.data.type === 'namePreClaim' ||
        this.data.type === 'nameBid' ||
        this.data.type === 'nameClaim' ||
        this.data.type === 'nameUpdate'
      );
    },
    convertSelectedFee() {
      return BigNumber(this.selectedFee).shiftedBy(MAGNITUDE);
    },
    token() {
      return typeof this.data.tx.token !== 'undefined' ? this.data.tx.token : 'AE';
    },
  },
  watch: {
    watchBalance() {
      this.showAlert(true);
    },
  },
  methods: {
    async setContractInstance(source, contractAddress = null, options = {}) {
      try {
        let backend = 'fate';
        if (typeof this.data.tx.abi_version !== 'undefined' && this.data.tx.abi_version !== 3) {
          backend = 'aevm';
        }
        try {
          this.contractInstance = await this.$helpers.getContractInstance(source, {
            contractAddress,
          });
          this.contractInstance.setOptions({ backend });
          if (typeof options.waitMined !== 'undefined') {
            this.contractInstance.setOptions({ waitMined: options.waitMined });
          }
        } catch (e) {
          console.error(`setContractInstance: ${e}`);
        }
        return Promise.resolve(true);
      } catch (err) {
        if (this.data.popup) {
          this.errorTx.error.message = err;
          this.sending = true;
          this.port.postMessage(this.errorTx);
          setTimeout(() => {
            window.close();
          }, 1000);
        }
      }
      return Promise.resolve(false);
    },
    async init() {
      this.setReceiver();
      if (this.isLedger && this.data.type !== 'txSign') {
        this.$store
          .dispatch('modals/open', {
            name: 'default',
            msg: 'Ledger currently cannot sign this type of transaction! ',
          })
          .then(() => {
            if (this.data.popup) {
              setTimeout(() => {
                window.close();
              });
            } else {
              this.redirectInExtensionAfterAction();
            }
          });
      }
      if (this.data.tx.options && this.data.tx.options.amount) {
        this.data.tx.amount = this.data.tx.options.amount;
        if (this.data.type === 'contractCall') {
          this.data.tx.amount = aettosToAe(this.data.tx.options.amount);
          this.data.tx.options.amount = aettosToAe(this.data.tx.options.amount);
        }
      }
      if (this.data.type === 'txSign' && this.data.popup) {
        this.data.tx.amount = aettosToAe(this.data.tx.amount);
      }
      if (this.data.popup) {
        this.port = browser.runtime.connect({ name: this.data.id });
      }
      if (typeof this.data.callType !== 'undefined' && this.data.callType === 'static') {
        this.loaderType = '';
        this.loading = true;
        this.loaderContent = this.$t('pages.signTransaction.contractCalling');

        await this.$watchUntilTruly(() => this.sdk);
        await this.setContractInstance(this.data.tx.source, this.data.tx.address);
        try {
          const call = await this.$helpers.contractCall({
            instance: this.contractInstance,
            method: this.data.tx.method,
            params: [...this.data.tx.params, this.data.tx.options],
          });
          this.sending = true;
          this.port.postMessage(call);
        } catch (e) {
          this.errorTx.error.message = e;
          this.sending = true;
          this.port.postMessage(this.errorTx);
        }

        setTimeout(() => {
          window.close();
        }, 1000);
      } else {
        await this.$watchUntilTruly(() => this.sdk);

        this.txParams = {
          ...this.sdk.Ae.defaults,
        };

        if (this.data.type === 'contractCreate') {
          this.data.tx.contract = {};
          this.data.tx.contract.bytecode = (
            await this.sdk.contractCompile(this.data.tx.source)
          ).bytecode;
          this.txParams = {
            ...this.txParams,
            ownerId: this.account.publicKey,
            code: this.data.tx.contract.bytecode,
          };
          // here new contract na mqstoto na fugible token contract
          await this.setContractInstance(this.data.tx.source);
        } else if (this.data.type === 'contractCall') {
          this.data.tx.call = {};
          this.txParams = {
            ...this.txParams,
            contractId: this.data.tx.address,
            callerId: this.account.publicKey,
          };
          await this.setContractInstance(
            this.data.tx.source,
            this.data.tx.address,
            this.data.tx.options,
          );
        } else if (this.data.type === 'txSign') {
          let recipientId;
          if (this.data.tx.recipientId.substring(0, 3) === 'ak_') {
            recipientId = this.data.tx.recipientId; // eslint-disable-line prefer-destructuring
          } else {
            try {
              const address = await this.sdk.api.getNameEntryByName(this.data.tx.recipientId);
              if (typeof address.pointers[0] !== 'undefined') {
                recipientId = address.pointers[0].id;
                this.receiver = recipientId;
              } else {
                this.receiver = '';
                this.showAlert();
                return;
              }
            } catch (err) {
              this.receiver = '';
              this.showAlert();
              return;
            }
          }
          this.txParams = {
            ...this.txParams,
            senderId: this.account.publicKey,
            recipientId,
          };
        } else if (this.data.type === 'namePreClaim') {
          this.txParams = {
            ...this.txParams,
            accountId: this.account.publicKey,
            commitmentId: 'cm_PtSWNMMNJ187NzGgivLFpYKptevuFQx1rKdqsDFAKVkXtyjPJ',
          };
        } else if (this.data.type === 'nameClaim') {
          this.txParams = {
            ...this.txParams,
            accountId: this.account.publicKey,
            name: 'nm_2Wb2xdC9WMSnExyHd8aoDu2Ee8qHD94nvsFQsyiy1iEyUGPQp9',
            nameSalt: this.data.tx.preclaim.salt,
          };
        } else if (this.data.type === 'nameBid') {
          this.txParams = {
            ...this.txParams,
            accountId: this.account.publicKey,
            name: 'nm_2Wb2xdC9WMSnExyHd8aoDu2Ee8qHD94nvsFQsyiy1iEyUGPQp9',
            nameSalt: 0,
          };
        } else if (this.data.type === 'nameUpdate') {
          this.txParams = {
            ...this.txParams,
            accountId: this.account.publicKey,
            nameId: this.data.tx.claim.id,
            pointers: this.data.tx.claim.pointers,
          };
        }
        const fee = calculateFee(TX_TYPES[this.data.type], this.txParams);
        this.txFee = fee;
        this.selectedFee = this.fee.toFixed(7);
        if (this.alertMsg === '') {
          this.signDisabled = false;
        }
      }

      setTimeout(() => {
        this.showAlert();
      }, 3500);
    },
    setReceiver() {
      if (this.data.type === 'txSign') {
        this.receiver = this.data.tx.recipientId;
      } else if (this.data.type === 'contractCall') {
        this.receiver = this.data.tx.address;
      }
    },
    showAlert(balance = false) {
      if (this.insufficientBalance && this.sdk !== null && !this.loading && balance) {
        this.alertMsg = this.$t('pages.signTransaction.insufficientBalance');
      } else if (this.inccorectAddress && this.isAddressShow) {
        this.alertMsg = this.$t('pages.signTransaction.inccorectAddress');
      } else {
        this.alertMsg = '';
      }
      if (this.alertMsg === '') {
        if (this.selectedFee) {
          this.signDisabled = false;
        }
      } else {
        this.signDisabled = true;
        if (balance) {
          setTimeout(() => {
            if (this.data.popup && !this.sending) {
              this.errorTx.error.message = this.alertMsg;

              this.port.postMessage(this.errorTx);
              setTimeout(() => {
                window.close();
              }, 1000);
            }
          }, 5000);
        }
      }
    },
    async cancelTransaction() {
      this.redirectInExtensionAfterAction();
    },
    redirectInExtensionAfterAction() {
      this.$store.commit('SET_AEPP_POPUP', false);
      this.$router.push('/account');
    },
    signSpendTx(amount) {
      this.sdk
        .spend(amount, this.receiver, { fee: this.convertSelectedFee })
        .then(async result => {
          if (typeof result === 'object') {
            this.loading = false;
            this.hash = result.hash;
            this.$store.commit('SET_TX_QUEUE', result.hash);
            const msg = `You have sent ${this.amount} AE`;
            this.$store.dispatch('modals/open', { name: 'default', msg }).then(async () => {
              this.$store.commit('SET_AEPP_POPUP', false);
              this.redirectInExtensionAfterAction();
            });
          }
        })
        .catch(async () => {
          this.$store.commit('SET_TX_QUEUE', 'error');
          this.$store.dispatch('modals/open', { name: 'default', type: 'transaction-failed' });
          this.loading = false;
        });
    },
    async signSpendTxLedger(amount) {
      const tx = await this.sdk.spendTx({
        senderId: this.account.publicKey,
        recipientId: this.receiver,
        amount,
        fee: this.convertSelectedFee,
      });
      const sign = await this.$store.dispatch('ledgerSignTransaction', { tx });
      this.loading = false;
      if (sign.success) {
        const msg = `You have sent ${this.amount} AE`;
        this.$store.dispatch('modals/open', { name: 'default', msg }).then(async () => {
          this.$store.commit('SET_AEPP_POPUP', false);
          this.redirectInExtensionAfterAction();
        });
      } else {
        this.$store
          .dispatch('modals/open', { name: 'default', type: 'transaction-failed' })
          .then(() => {
            this.redirectInExtensionAfterAction();
          });
      }
    },
    async contractCallStatic(tx) {
      try {
        let options = {};
        if (tx.options) {
          options = { ...tx.options };
        }
        if (tx.options && tx.options.amount) {
          options = { ...options, ...tx.options, amount: aeToAettos(this.data.tx.options.amount) };
        }
        const call = await this.$helpers.contractCall({
          instance: this.contractInstance,
          method: tx.method,
          params: [...tx.params, options],
        });
        const decoded = await call.decode();
        call.decoded = decoded;
        this.sending = true;
        this.port.postMessage(call);
      } catch (err) {
        this.errorTx.error.message = typeof err.message !== 'undefined' ? err.message : err;
        this.sending = true;
        this.port.postMessage(this.errorTx);
      }
      setTimeout(() => {
        window.close();
      }, 1000);
    },
    async contractCall() {
      let call;
      try {
        let options;
        if (this.data.tx.options) {
          options = { ...this.data.tx.options };
        }
        if (this.data.tx.options && this.data.tx.options.amount) {
          this.data.tx.options.amount = aeToAettos(this.data.tx.options.amount);
          options = { ...options, ...this.data.tx.options };
        }

        options = { ...options, fee: this.convertSelectedFee };
        if (!this.contractInstance) {
          await this.setContractInstance(
            this.data.tx.source,
            this.data.tx.address,
            this.data.tx.options,
          );
        }
        call = await this.$helpers.contractCall({
          instance: this.contractInstance,
          method: this.data.tx.method,
          params: [...this.data.tx.params, options],
        });

        this.$store.commit('SET_TX_QUEUE', call.hash);
        const decoded = await call.decode();
        call.decoded = decoded;
        if (this.data.popup) {
          const { decode, ...res } = call;
          this.sending = true;
          this.port.postMessage({ ...res });
        }
      } catch (err) {
        this.$store.commit('SET_TX_QUEUE', 'error');
        this.errorTx.error.message = typeof err.message !== 'undefined' ? err.message : err;
        this.sending = true;
        this.$store.dispatch('modals/open', { name: 'default', type: 'transaction-failed' });
      }
      this.redirectInExtensionAfterAction();
    },
    async contractDeploy() {
      let deployed;
      if (this.isLedger) {
        const { ownerId, amount, gas, code, callData, deposit } = this.txParams;
        const { tx } = await this.sdk[TX_TYPES[this.data.type]]({
          ownerId,
          amount,
          gas,
          code,
          callData,
          deposit,
        });
        await this.$store.dispatch('ledgerSignTransaction', { tx });
      } else {
        try {
          deployed = await this.contractInstance.deploy([...this.data.tx.init], {
            fee: this.convertSelectedFee,
          });
          this.$store.commit('SET_TX_QUEUE', deployed.transaction);
        } catch (err) {
          this.$store.commit('SET_TX_QUEUE', 'error');
          this.$store.dispatch('modals/open', { name: 'default', type: 'transaction-failed' });
        }
      }

      this.loading = false;
      if (this.data.popup) {
        setTimeout(() => {
          window.close();
        }, 1000);
      } else {
        if (deployed) {
          this.deployed = deployed.address;
          const msg = `Contract deployed at address <br> ${deployed.address}`;
          this.$store.dispatch('modals/open', { name: 'default', msg });
        }
        if (this.data.tx.contractType !== 'fungibleToken') {
          this.redirectInExtensionAfterAction();
        }
      }
    },
    copyAddress() {
      this.$copyText(this.popup.data);
      if (this.data.type === 'contractCreate' && !this.data.tx.tokenRegistry) {
        this.redirectInExtensionAfterAction();
      }
    },
    redirectToTxConfirm(tx) {
      this.$store.commit('SET_AEPP_POPUP', true);

      this.$router.push({
        name: 'sign',
        params: {
          data: tx,
          type: tx.type,
        },
      });
    },
    async namePreclaim() {
      try {
        const preclaim = await this.sdk.aensPreclaim(this.data.tx.name, {
          fee: this.convertSelectedFee,
        });
        this.$store.commit('SET_TX_QUEUE', preclaim.hash);
        const tx = {
          popup: false,
          tx: {
            name: this.data.tx.name,
            recipientId: '',
            preclaim,
          },
          type: 'nameClaim',
        };
        this.redirectToTxConfirm(tx);
      } catch (err) {
        this.$store.commit('SET_TX_QUEUE', 'error');
        this.$store.dispatch('modals/open', { name: 'default', msg: err.message });
        this.$store.commit('SET_AEPP_POPUP', false);
        this.$router.push('/names');
      }
    },
    async nameClaim() {
      if (this.data.bid) {
        try {
          await this.sdk.aensBid(this.data.tx.name, this.data.tx.BigNumberAmount);
        } catch (err) {
          this.$store.commit('SET_TX_QUEUE', 'error');
          this.$store.dispatch('modals/open', { name: 'default', msg: err.message });
        }
      } else {
        try {
          const claim = await this.data.tx.preclaim.claim({
            waitMined: false,
            fee: this.convertSelectedFee,
          });
          this.$store.commit('SET_TX_QUEUE', claim.hash);
        } catch (err) {
          let msg = err.message;
          if (msg.includes('is not enough to execute')) {
            msg = this.$t('pages.signTransaction.balanceError');
          }
          this.$store.commit('SET_TX_QUEUE', 'error');
          this.$store.dispatch('modals/open', { name: 'default', msg });
        }
      }
      this.$store.commit('SET_AEPP_POPUP', false);
      this.$router.push('/names');
    },
    async nameUpdate() {
      try {
        const nameObject = await this.sdk.aensQuery(this.data.tx.name);
        let update;
        if (this.data.nameUpdateType === 'extend') {
          update = await nameObject.extendTtl();
        } else if (this.data.nameUpdateType === 'updatePointer') {
          update = await nameObject.update(this.data.tx.pointers, { extendPointers: true });
        }
        this.$store.commit('SET_TX_QUEUE', update.hash);
        await this.$store.dispatch('modals/open', { name: 'default', msg: 'Successfully added!' });
      } catch (err) {
        this.$store.commit('SET_TX_QUEUE', 'error');
        this.$store.dispatch('modals/open', { name: 'default', msg: err.message });
      }
      this.$store.commit('SET_AEPP_POPUP', false);
      this.$router.push('/names');
    },
    async signTransaction() {
      if (!this.signDisabled) {
        this.loading = true;
        const amount = aeToAettos(this.amount);
        try {
          if (this.data.type === 'txSign') {
            if (this.isLedger) {
              this.signSpendTxLedger(amount);
            } else {
              this.signSpendTx(amount);
            }
          } else if (this.data.type === 'contractCall') {
            if (this.data.callType === 'pay') {
              this.contractCall();
            } else {
              const call = await this.$helpers.contractCall({
                instance: this.contractInstance,
                method: this.data.tx.method,
                params: [...this.data.tx.params, { fee: this.convertSelectedFee }],
              });
              this.$store.commit('SET_TX_QUEUE', call.hash);
              const msg = `You have sent ${this.data.tx.amount} ${this.data.tx.token}`;
              this.$store.dispatch('modals/open', { name: 'default', msg }).then(() => {
                this.$store.commit('SET_AEPP_POPUP', false);
                this.$router.push('/account');
              });
            }
          } else if (this.data.type === 'contractCreate') {
            this.contractDeploy();
          } else if (this.data.type === 'namePreClaim') {
            this.namePreclaim();
          } else if (this.data.type === 'nameClaim') {
            this.nameClaim();
          } else if (this.data.type === 'nameUpdate') {
            this.nameUpdate();
          } else if (this.data.type === 'nameBid') {
            this.nameClaim();
          }
        } catch (e) {
          console.error(`signTransaction: ${e}`);
        }
      }
    },
    convertCurrency(currency, amount) {
      return parseFloat(convertAmountToCurrency(currency, amount));
    },
    async checkSourceByteCode(source) {
      const byteCode = await this.sdk.contractCompile(source);
      return byteCode;
    },
  },
  async beforeDestroy() {
    if (this.data.popup) {
      if (!this.sending) {
        this.port.postMessage(this.errorTx);
      }
    }
  },
  beforeRouteUpdate(to, from, next) {
    next();
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';
.balanceSpend {
  font-size: 2rem;
  color: $white-color;
}
.spendTxDetailsList {
  .balance {
    font-family: Roboto, sans-serif;
    color: $white-color;
  }

  .ae-list-item {
    position: relative;
    cursor: unset;
    // text-transform: uppercase;
    font-size: 0.8rem;

    div .ae-badge {
      background: $accent-color;
      font-family: Roboto, sans-serif;
      color: $white-color;
      -webkit-box-shadow: 0 0 0 2px $accent-color;
      box-shadow: 0px 0px 0px 2px $accent-color;
      border: 2px solid $bg-color;
    }
  }
}
.spendTxDetailsList .ae-button {
  margin-bottom: 0 !important;
}
.arrowSeprator {
  margin-right: 1rem;
  background: $accent-color;
  color: $white-color;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  text-align: center;
  vertical-align: middle;
  border: 1px solid $white-color;
  line-height: 20px;
  .ae-icon {
    font-size: 1.2rem !important;
    float: none !important;
  }
  &:after {
    content: '';
  }
}
.ae-identicon.base {
  border: 0.125rem solid transparent;
  -webkit-box-shadow: 0 0 0 2px $secondary-color;
  box-shadow: 0 0 0 1px $secondary-color;
  width: 2rem;
}
.spendAccountAddr {
  padding: 0 0.5rem !important;
  font-weight: normal !important;
  font-size: 0.8rem !important;
}
.noBorder {
  border-top: none !important;
}
.accountFrom {
  width: 40%;
}
.accountTo {
  width: 70%;
  .ae-icon {
    font-size: 2rem;
  }
}
.spendAccountAddr {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.extend {
  width: 100%;
}
.tx-label {
  margin-top: 0.4rem;
}
.ae-identicon {
  width: auto;
}
</style>
