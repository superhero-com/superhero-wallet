<template>
  <div class="popup popup-no-padding">
    <ae-list class="spendTxDetailsList">
      <ae-list-item fill="neutral" class="flex-justify-between noBorder">
        <div class="flex flex-align-center accountFrom">
          <ae-identicon :address="account.publicKey" />
          <span class="spendAccountAddr">{{ activeAccountName }}</span>
        </div>
        <div class="arrowSeprator">
          <ae-icon name="left-more" />
        </div>
        <div class="flex flex-align-center accountTo" v-if="isAddressShow">
          <ae-identicon :address="receiver" />
          <ae-address :value="receiver" v-if="receiver" length="short" class="spendAccountAddr" />
          <span v-if="!receiver" class="spendAccountAddr">{{ $t('pages.signTransaction.unknownAccount') }}</span>
        </div>
        <div v-else class="flex flex-align-center accountTo">
          <ae-icon name="square" />
          <span class="spendAccountAddr">{{ txType == 'contractCreateTx' ? $t('pages.signTransaction.newContract') : $t('pages.signTransaction.aens') }}</span>
        </div>
      </ae-list-item>
      <ae-list-item fill="neutral" class="flex-justify-between flex-align-start flex-direction-column">
        <div>
          <!-- <ae-badge v-if="txType=='contractCallTx'">{{$t('pages.signTransaction.contractCall')}}</ae-badge> -->
          <ae-badge>{{ txType }}</ae-badge>
        </div>
        <div class="balance balanceSpend no-sign text-left" v-if="!isNameTx">
          <div class="flex flex-align-center">
            <span  v-if="!editTx" class="mr-5">{{ tx.amount }} </span>
            <Input type="number" :error="amountError" v-model="tx.amount" :value="aeAmount" size="big" v-else />
            <span class="mr-5"> {{ $t('pages.appVUE.aeid') }}</span>
            <Button small v-if="!editTx && unpackedTx.tx" @click="editTx = true" class="danger"><ae-icon name="vote" /></Button>
            <Button small v-if="editTx" @click="editTx = false" class="danger" :disabled="amountError"><ae-icon name="check" /></Button>
          </div>
        </div>
        <!-- <div class="fiat-rate" v-if="!txObject.token && !isNameTx">${{convertCurrency(usdRate,amount)}}</div> -->
      </ae-list-item>
      <ae-list-item v-if="txObject.payload" fill="neutral" class="flex-justify-between flex-align-center flex-direction-column flex-align-start">
        <div class="tx-label ">
          {{ $t('pages.signTransaction.payload') }}
        </div>
        <div class="text-left">
          <strong>{{ txObject.payload }}</strong>
        </div>
      </ae-list-item>

      <ae-list-item v-if="txType == 'nameClaimTx' || txType == 'nameUpdateTx'" fill="neutral" class="flex-justify-between  flex-align-center ">
        <div class="tx-label">
          {{ $t('pages.signTransaction.name') }}
        </div>
        <div>
          <strong>{{ txObject.name }}</strong>
        </div>
      </ae-list-item>
      <ae-list-item v-if="txType == 'nameClaimTx'" fill="neutral" class="flex-justify-between flex-align-center ">
        <div class="tx-label ">
          {{ $t('pages.signTransaction.nameSalt') }}
        </div>
        <div>
          <strong>{{ txObject.preclaim.salt }}</strong>
        </div>
      </ae-list-item>
      <ae-list-item v-if="txType == 'nameUpdateTx'" fill="neutral" class="flex-justify-between  flex-align-center flex-direction-column">
        <div class="tx-label extend text-left">
          {{ $t('pages.signTransaction.nameId') }}
        </div>
        <div class="text-left">
          <strong>{{ txObject.claim.id }}</strong>
        </div>
      </ae-list-item>
      <ae-list-item fill="neutral" class="flex-justify-between flex-direction-column flex-align-center ">
        <div class="flex extend flex-justify-between ">
          <div class="tx-label">{{ $t('pages.signTransaction.fee') }}</div>
          <div class="text-right">
            <div class="balance balanceBig txFee no-sign">{{ toAe(txObject.fee) }} {{ $t('pages.appVUE.aeid') }}</div>
            <!-- <div class="fiat-rate">${{ convertCurrency(usdRate,selectedFee) }}</div> -->
          </div>
        </div>
      </ae-list-item>

      <ae-list-item fill="neutral" class="flex-justify-between" v-if="!isNameTx">
        <div class="tx-label">{{ $t('pages.signTransaction.total') }}</div>
        <div class="text-right">
          <div class="balance balanceBig balanceTotalSpend no-sign">{{ totalSpend }} {{ $t('pages.appVUE.aeid') }}</div>
          <!-- <div class="fiat-rate" v-if="!txObject.token">${{ convertCurrency(usdRate,totalSpend) }}</div> -->
        </div>
      </ae-list-item>
      <ae-list-item v-if="txType == 'contractCreateTx'" fill="neutral" class="flex-justify-between flex-align-center flex-direction-column flex-align-start">
        <div class="tx-label ">
          {{ $t('pages.signTransaction.compiledCode') }}
        </div>
        <div class="text-left ">
          <strong>{{ txObject.code }}</strong>
        </div>
      </ae-list-item>
      <ae-list-item v-if="txType == 'contractCreateTx'" fill="neutral" class="flex-justify-between flex-align-center flex-direction-column flex-align-start">
        <div class="tx-label ">
          {{ $t('pages.signTransaction.callData') }}
        </div>
        <div class="text-left">
          <strong>{{ txObject.callData }}</strong>
        </div>
      </ae-list-item>
    </ae-list>
    <div class="btnFixed">
      <Button half @click="cancelTransaction" :disabled="editTx" class="reject">{{ $t('pages.signTransaction.reject') }}</Button>
      <Button half @click="signTransaction" :disabled="editTx" >{{ $t('pages.signTransaction.confirm') }}</Button>
    </div>
    <Loader size="big" :loading="loading" type="transparent" content=""></Loader>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import BigNumber from 'bignumber.js';
import { TxBuilder } from '@aeternity/aepp-sdk/es';
import { convertToAE, convertAmountToCurrency } from '../../../utils/helper';
import { toMicro, MAGNITUDE } from '../../../utils/constants';
import Button from '../../components/Button';
import Input from '../../components/Input';
import getPopupProps from '../../../utils/getPopupProps';

export default {
  components: { Button, Input },
  data() {
    return {
      props: {},
      loading: false,
      unpackedTx: null,
      editTx: false,
      amountError:false,
      tx: { 
        amount:0
      }
    };
  },
  async created() {
    this.props = await getPopupProps();
    this.unpackedTx = TxBuilder.unpackTx(this.props.action.params.tx);
    this.tx.amount = convertToAE(this.txObject.amount)
  },
  computed: {
    ...mapGetters([
      'account',
      'activeAccountName',
      'balance',
      'current',
      'popup',
    ]),
    txType() {
      return this.unpackedTx ? this.unpackedTx.txType : null;
    },
    isAddressShow() {
      if (this.txType == 'contractCreateTx' || this.txType == 'namePreClaimTx' || this.txType == 'nameClaimTx' || this.txType == 'nameUpdateTx') {
        return false;
      }
      return true;
    },
    txObject() {
      return this.unpackedTx.tx;
    },
    amount() {
      return this.txObject.amount;
    },
    aeAmount() {
      return convertToAE(this.txObject.amount);
    },
    receiver() {
      if (this.txType == 'spendTx') {
        return this.txObject.recipientId;
      }
      if (this.txType == 'contractCallTx') {
        return this.txObject.contractId;
      }
      return '';
    },
    isNameTx() {
      return this.txType == 'namePreClaimTx' || this.txType == 'nameClaimTx' || this.txType == 'nameUpdateTx';
    },
    totalSpend() {
      return (parseFloat(this.tx.amount) + parseFloat(convertToAE(this.txObject.fee))).toFixed(7);
    },
  },
  watch: {
    'tx.amount':function (newVal, oldVal) {
      this.amountError = false
      if(isNaN(newVal)) {
        this.amountError = true
      }
    }
  },
  methods: {
    convertCurrency(currency, amount) {
      return parseFloat(convertAmountToCurrency(currency, amount));
    },
    toAe(balance) {
      return convertToAE(balance);
    },
    cancelTransaction() {
      this.props.reject(false);
    },
    signTransaction() {
      const { tx } = TxBuilder.buildTx({...this.unpackedTx.tx, ...this.tx, amount: BigNumber(this.tx.amount).shiftedBy(MAGNITUDE)}, this.txType)
      this.loading = true;
      this.props.resolve(tx);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../../common/variables';
.balanceSpend {
  font-size: 2rem;
  color: $white-color;
}
.spendTxDetailsList .ae-list-item {
  position: relative;
  cursor: unset;
  text-transform: uppercase;
  font-size: 0.9rem;
}
.spendTxDetailsList .ae-button {
  margin-bottom: 0 !important;
}
.arrowSeprator {
  margin-right: 1rem;
  background: $primary-color;
  color: #fff;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  text-align: center;
  vertical-align: middle;
  border: 1px solid #d8d8d8;
  line-height: 20px;
  .ae-icon {
    font-size: 1.2rem !important;
    float: none !important;
  }
  &:after {
    content: '';
  }
}
.spendAccountAddr {
  padding: 0 0.5rem !important;
  font-weight: bold !important;
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
  font-size: 0.9rem !important;
  font-family: 'IBM Plex Mono', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.confirm.disabled {
  opacity: 0.5;
  cursor: unset;
}
.ae-badge {
  border: 2px solid #001833;
  background: $color-alternative;
}
.ae-header {
  margin-bottom: 0 !important;
}
.extend {
  width: 100%;
}
.fiat-rate {
  color: #939393;
  font-size: 1rem;
}
.tx-label {
  margin-top: 0.4rem;
}
.ae-identicon {
  width: auto;
}
</style>
