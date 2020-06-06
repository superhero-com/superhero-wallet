<template>
  <div class="popup popup-aex2" data-cy="popup-aex2">
    <ae-list class="spendTxDetailsList">
      <ae-list-item fill="neutral" class="flex-justify-between noBorder">
        <div class="flex flex-align-center accountFrom">
          <UserAvatar :address="account.publicKey" :name="account.name" />
          <span class="spendAccountAddr">{{ activeAccountName }}</span>
        </div>
        <div class="arrowSeprator">
          <ae-icon name="left-more" />
        </div>
        <div class="flex flex-align-center accountTo" v-if="isAddressShow">
          <UserAvatar :address="receiver" />
          <ae-address
            :value="receiver"
            v-if="receiver"
            length="short"
            class="spendAccountAddr"
            data-cy="address-receiver"
          />
          <span v-else class="spendAccountAddr">{{
            $t('pages.signTransaction.unknownAccount')
          }}</span>
        </div>
        <div v-else class="flex flex-align-center accountTo">
          <ae-icon name="square" />
          <span class="spendAccountAddr" data-cy="receiver">{{
            txType == 'contractCreateTx'
              ? $t('pages.signTransaction.newContract')
              : $t('pages.signTransaction.aens')
          }}</span>
        </div>
      </ae-list-item>
      <ae-list-item
        fill="neutral"
        class="flex-justify-between flex-align-start flex-direction-column"
      >
        <div class="mt-20">
          <ae-badge data-cy="tx-type">{{ txType }}</ae-badge>
        </div>
        <AmountSend
          :value="tx.amount"
          @changeAmount="val => (tx.amount = val)"
          style="width: 100%;"
        />
      </ae-list-item>
      <ae-list-item
        v-if="txObject.payload"
        fill="neutral"
        class="flex-justify-between flex-align-center flex-direction-column flex-align-start"
      >
        <div class="tx-label ">
          <strong>{{ $t('pages.signTransaction.payload') }}</strong>
        </div>
        <div class="text-left">
          {{ txObject.payload }}
        </div>
      </ae-list-item>

      <ae-list-item
        v-if="txType == 'nameClaimTx' || txType == 'nameUpdateTx'"
        fill="neutral"
        class="flex-justify-between  flex-align-center "
      >
        <div class="tx-label">
          <strong>{{ $t('pages.signTransaction.name') }}</strong>
        </div>
        <div>
          {{ txObject.name }}
        </div>
      </ae-list-item>
      <ae-list-item
        v-if="txType == 'nameClaimTx'"
        fill="neutral"
        class="flex-justify-between flex-align-center "
      >
        <div class="tx-label ">
          <strong>{{ $t('pages.signTransaction.nameSalt') }}</strong>
        </div>
        <div>
          {{ txObject.preclaim.salt }}
        </div>
      </ae-list-item>
      <ae-list-item
        v-if="txType == 'nameUpdateTx'"
        fill="neutral"
        class="flex-justify-between  flex-align-center flex-direction-column"
      >
        <div class="tx-label extend text-left">
          <strong>{{ $t('pages.signTransaction.nameId') }}</strong>
        </div>
        <div class="text-left">
          {{ txObject.claim.id }}
        </div>
      </ae-list-item>
      <ae-list-item
        fill="neutral"
        class="flex-justify-between flex-direction-column flex-align-center "
      >
        <div class="flex extend flex-justify-between ">
          <div class="tx-label">{{ $t('pages.signTransaction.fee') }}</div>
          <div class="text-right">
            <div class="balance balanceBig txFee no-sign" data-cy="fee">
              {{ toAe(txObject.fee) }} {{ $t('pages.appVUE.aeid') }}
            </div>
          </div>
        </div>
      </ae-list-item>

      <ae-list-item fill="neutral" class="flex-justify-between" v-if="!isNameTx">
        <div class="tx-label">{{ $t('pages.signTransaction.total') }}</div>
        <div class="text-right">
          <div class="balance balanceBig balanceTotalSpend no-sign" data-cy="total">
            {{ totalSpend }} {{ $t('pages.appVUE.aeid') }}
          </div>
        </div>
      </ae-list-item>
      <ae-list-item
        v-if="txType == 'contractCreateTx'"
        fill="neutral"
        class="flex-justify-between flex-align-center flex-direction-column flex-align-start"
      >
        <div class="tx-label ">
          <strong>{{ $t('pages.signTransaction.compiledCode') }}</strong>
        </div>
        <div class="text-left ">
          {{ txObject.code }}
        </div>
      </ae-list-item>
      <ae-list-item
        v-if="txType == 'contractCreateTx'"
        fill="neutral"
        class="flex-justify-between flex-align-center flex-direction-column flex-align-start"
      >
        <div class="tx-label ">
          <strong>{{ $t('pages.signTransaction.callData') }}</strong>
        </div>
        <div class="text-left">
          {{ txObject.callData }}
        </div>
      </ae-list-item>
    </ae-list>
    <div class="btnFixed">
      <Button half @click="cancelTransaction" :disabled="editTx" class="reject" data-cy="deny">{{
        $t('pages.signTransaction.reject')
      }}</Button>
      <Button half @click="signTransaction" :disabled="editTx || amountError" data-cy="accept">{{
        $t('pages.signTransaction.confirm')
      }}</Button>
    </div>
    <Loader v-if="loading" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import BigNumber from 'bignumber.js';
import { TxBuilder } from '@aeternity/aepp-sdk/es';
import { convertToAE, getContractCallInfo, addTipAmount } from '../../../utils/helper';
import { MAGNITUDE } from '../../../utils/constants';
import Button from '../../components/Button';
import AmountSend from '../../components/AmountSend';
import getPopupProps from '../../../utils/getPopupProps';
import UserAvatar from '../../components/UserAvatar';

export default {
  components: { Button, AmountSend, UserAvatar },
  data() {
    return {
      props: {},
      loading: false,
      unpackedTx: null,
      editTx: false,
      amountError: false,
      tx: {
        amount: 0,
      },
    };
  },
  async created() {
    this.props = await getPopupProps();
    this.unpackedTx = TxBuilder.unpackTx(this.props.action.params.tx);
    this.tx.amount = convertToAE(this.txObject.amount);
  },
  computed: {
    ...mapGetters(['account', 'activeAccountName', 'balance']),
    txType() {
      return this.unpackedTx ? this.unpackedTx.txType : null;
    },
    isAddressShow() {
      if (
        this.txType === 'contractCreateTx' ||
        this.txType === 'namePreClaimTx' ||
        this.txType === 'nameClaimTx' ||
        this.txType === 'nameUpdateTx'
      ) {
        return false;
      }
      return true;
    },
    txObject() {
      return this.unpackedTx ? this.unpackedTx.tx : {};
    },
    receiver() {
      if (this.txType === 'spendTx') {
        return this.txObject.recipientId;
      }
      if (this.txType === 'contractCallTx') {
        return this.txObject.contractId;
      }
      return '';
    },
    isNameTx() {
      return (
        this.txType === 'namePreClaimTx' ||
        this.txType === 'nameClaimTx' ||
        this.txType === 'nameUpdateTx'
      );
    },
    totalSpend() {
      const amount = this.tx.amount ? this.tx.amount : 0;
      return (parseFloat(amount) + parseFloat(convertToAE(this.txObject.fee))).toFixed(7);
    },
  },
  watch: {
    'tx.amount': function txAmount(newVal) {
      this.amountError = Number.isNaN(+newVal);
    },
  },
  methods: {
    toAe(balance) {
      return convertToAE(balance);
    },
    cancelTransaction() {
      this.props.reject(false);
    },
    async signTransaction() {
      const { tx } = TxBuilder.buildTx(
        {
          ...this.unpackedTx.tx,
          ...this.tx,
          amount: BigNumber(this.tx.amount ? this.tx.amount : 0).shiftedBy(MAGNITUDE),
        },
        this.txType,
      );
      const contractAddress = await this.$store.dispatch('getTipContractAddress');
      const { isTip, amount } = getContractCallInfo(tx, contractAddress);
      if (isTip) {
        await addTipAmount(amount);
      }
      if (parseFloat(this.tx.amount) !== convertToAE(this.unpackedTx.tx.amount)) {
        this.loading = true;
        this.props.resolve(tx);
      } else {
        this.props.resolve();
      }
    },
  },
};
</script>

<style lang="scss" src="../SignTransaction.scss" scoped />
