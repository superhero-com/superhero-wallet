import { pick } from 'lodash-es';
import BigNumber from 'bignumber.js';
import { mapGetters } from 'vuex';
import FUNGIBLE_TOKEN_CONTRACT from 'aeternity-fungible-token/FungibleTokenFullInterface.aes';
import {
  buildTx, Tag, unpackTx, AE_AMOUNT_FORMATS,
} from '@aeternity/aepp-sdk';
import { MAGNITUDE, STUB_CONTRACT_ADDRESS, AETERNITY_CONTRACT_ID } from '../popup/utils/constants';
import {
  executeAndSetInterval,
  calculateFee,
  validateTipUrl,
  checkAensName,
  handleUnknownError,
  watchUntilTruthy,
} from '../popup/utils';

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
      if (this.formModel?.selectedAsset?.contractId === AETERNITY_CONTRACT_ID) {
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
      await watchUntilTruthy(() => this.$store.state.sdk);
      this.$set(this, 'selectedTokenBalance', new BigNumber(
        (await this.tokenInstance.methods.balance(this.account.address)).decodedResult,
      ).shiftedBy(-this.selectedAssetDecimals));
    }, 1000);
    executeAndSetInterval(async () => {
      await watchUntilTruthy(() => this.$store.state.sdk);
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
        await watchUntilTruthy(() => this.$store.state.sdk);
        const { sdk } = this.$store.state;

        if (selectedAsset.contractId !== AETERNITY_CONTRACT_ID) {
          if (!this.tokenInstance
            || this.tokenInstance.deployInfo.address !== selectedAsset.contractId) {
            this.tokenInstance = await this.$store.state.sdk.getContractInstance({
              source: FUNGIBLE_TOKEN_CONTRACT,
              contractAddress: selectedAsset.contractId,
            });
          }
          this.selectedAssetDecimals = selectedAsset.decimals;
        }

        if (selectedAsset.contractId !== AETERNITY_CONTRACT_ID
          || (!checkAensName(address) && validateTipUrl(address))) {
          this.fee = calculateFee(
            Tag.ContractCallTx, {
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
        const encodedTx = await this.$store.state.sdk.buildTx(Tag.SpendTx, {
          senderId: this.account.address,
          recipientId: this.account.address,
          amount: BigNumber(amount > 0 ? amount : 0).shiftedBy(MAGNITUDE),
          ttl: 0,
          nonce: nonce + 1,
          payload: '',
        });
        const minFee = BigNumber(unpackTx(encodedTx).tx.fee).shiftedBy(-MAGNITUDE);
        if (!minFee.isEqualTo(this.fee)) this.fee = minFee;
      },
      { immediate: true },
    );
  },
};
