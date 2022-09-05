import { pick } from 'lodash-es';
import BigNumber from 'bignumber.js';
import { mapGetters } from 'vuex';
import FUNGIBLE_TOKEN_CONTRACT from 'aeternity-fungible-token/FungibleTokenFullInterface.aes';
import { TxBuilder, SCHEMA } from '@aeternity/aepp-sdk';
import { MAGNITUDE, STUB_CONTRACT_ADDRESS } from '../popup/utils/constants';
import {
  executeAndSetInterval, calculateFee, validateTipUrl, checkAensName, handleUnknownError,
} from '../popup/utils/helper';

export default {
  data: () => ({
    fee: BigNumber(0),
    selectedTokenBalance: BigNumber(0),
    tokenInstance: null,
    nonce: 0,
    selectedAssetDecimals: 0,
  }),
  computed: {
    ...mapGetters(['account']),
    max() {
      if (this.formModel?.selectedAsset?.contractId === 'aeternity') {
        const max = this.balance.minus(this.fee);
        return (max.isPositive() ? max : 0).toString();
      }
      return this.selectedTokenBalance.toString();
    },
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['balance']);
  },
  created() {
    executeAndSetInterval(async () => {
      if (!this.tokenInstance) return;
      await this.$watchUntilTruly(() => this.$store.state.sdk);
      this.$set(this, 'selectedTokenBalance', new BigNumber(
        (await this.tokenInstance.methods.balance(this.account.address)).decodedResult,
      ).shiftedBy(-this.selectedAssetDecimals));
    }, 1000);
    executeAndSetInterval(async () => {
      await this.$watchUntilTruly(() => this.$store.state.sdk);
      try {
        this.nonce = (await this.$store.state.sdk.api
          .getAccountByPubkey(this.account.address))?.nonce;
      } catch (e) {
        if (!e.message.includes('Account not found')) handleUnknownError(e);
      }
    }, 5000);
    this.$watch(
      ({
        formModel: { amount, selectedAsset, address }, nonce,
      }) => ({
        nonce, selectedAsset, amount, address,
      }),
      async ({
        nonce, selectedAsset, amount, address,
      }) => {
        if (!selectedAsset) return;
        await this.$watchUntilTruly(() => this.$store.state.sdk);
        const { sdk } = this.$store.state;

        if (selectedAsset.contractId !== 'aeternity') {
          if (!this.tokenInstance
            || this.tokenInstance.deployInfo.address !== selectedAsset.contractId) {
            this.tokenInstance = await this.$store.state.sdk.getContractInstance({
              source: FUNGIBLE_TOKEN_CONTRACT,
              contractAddress: selectedAsset.contractId,
            });
          }
          this.selectedAssetDecimals = selectedAsset.decimals;
        }

        if (selectedAsset.contractId !== 'aeternity'
          || (!checkAensName(address) && validateTipUrl(address))) {
          this.fee = calculateFee(
            SCHEMA.TX_TYPE.contractCall, {
              ...sdk.Ae.defaults,
              ttl: 0,
              nonce: nonce + 1,
              amount: BigNumber(amount > 0 ? amount : 0).shiftedBy(MAGNITUDE),
              callerId: this.account.address,
              contractId: validateTipUrl(address)
                ? STUB_CONTRACT_ADDRESS : selectedAsset.contractId,
            },
          );
          return;
        }
        const minFee = BigNumber(TxBuilder.calculateMinFee('spendTx', {
          gas: sdk.Ae.defaults.gas,
          params: {
            ...sdk.Ae.defaults,
            senderId: this.account.address,
            recipientId: this.account.address,
            amount: BigNumber(amount > 0 ? amount : 0).shiftedBy(MAGNITUDE),
            ttl: 0,
            nonce: nonce + 1,
            payload: '',
          },
        })).shiftedBy(-MAGNITUDE);
        if (!minFee.isEqualTo(this.fee)) this.fee = minFee;
      },
      { immediate: true },
    );
  },
};
