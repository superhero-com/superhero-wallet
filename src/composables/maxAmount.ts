import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  Ref,
} from 'vue';
import BigNumber from 'bignumber.js';
import FUNGIBLE_TOKEN_CONTRACT from 'aeternity-fungible-token/FungibleTokenFullInterface.aes';
import { TxBuilder, SCHEMA } from '@aeternity/aepp-sdk';
import type {
  IAsset,
  IDefaultComposableOptions,
  IToken,
} from '../types';
import {
  MAGNITUDE,
  STUB_CONTRACT_ADDRESS,
  AETERNITY_CONTRACT_ID,
  executeAndSetInterval,
  calculateFee,
  validateTipUrl,
  checkAensName,
  handleUnknownError,
} from '../popup/utils';
import { useSdk } from './sdk';
import { useBalances } from './balances';
import { useAccounts } from './accounts';

export interface IFormModel {
  amount?: string;
  selectedAsset?: IToken | IAsset;
  address?: string;
  payload?: string;
}
export interface MaxAmountOptions extends IDefaultComposableOptions {
  formModel: Ref<IFormModel>
}

/**
 * Composable that allows to use real max amount of selected token
 * considering the fee that needs to be paid.
 */
export function useMaxAmount({ store, formModel }: MaxAmountOptions) {
  const { getSdk } = useSdk({ store });
  const { balance } = useBalances({ store });
  const { activeAccount } = useAccounts({ store });

  let updateTokenBalanceInterval: NodeJS.Timer;
  let updateNonceInterval: NodeJS.Timer;
  const fee = ref<BigNumber>(new BigNumber(0));
  const selectedTokenBalance = ref(new BigNumber(0));
  const tokenInstance = ref<any>(null);
  const nonce = ref(0);
  const selectedAssetDecimals = ref(0);

  const max = computed(() => {
    if (balance.value && formModel.value?.selectedAsset?.contractId === AETERNITY_CONTRACT_ID) {
      const _max = balance.value.minus(fee.value);
      return (_max.isPositive() ? _max : 0).toString();
    }
    return selectedTokenBalance.value.toString();
  });

  watch(
    () => formModel.value,
    async (val) => {
      if (!val?.selectedAsset) return;
      const sdk = await getSdk();

      if (val.selectedAsset.contractId !== AETERNITY_CONTRACT_ID) {
        if (
          !tokenInstance.value
          || tokenInstance.value.deployInfo.address !== val.selectedAsset.contractId
        ) {
          tokenInstance.value = await sdk.getContractInstance({
            source: FUNGIBLE_TOKEN_CONTRACT,
            contractAddress: val.selectedAsset.contractId,
          });
        }
        selectedAssetDecimals.value = val.selectedAsset.decimals!;
      }

      const numericAmount = (val.amount && +val.amount > 0) ? val.amount : 0;
      const amount = new BigNumber(numericAmount).shiftedBy(MAGNITUDE);

      if (
        val.selectedAsset.contractId !== AETERNITY_CONTRACT_ID
        || (
          val.address && !checkAensName(val.address) && validateTipUrl(val.address)
        )
      ) {
        fee.value = calculateFee(
          SCHEMA.TX_TYPE.contractCall, {
            ...sdk.Ae.defaults,
            ttl: 0,
            nonce: nonce.value + 1,
            amount,
            callerId: activeAccount.value.address,
            contractId: (val.address && validateTipUrl(val.address))
              ? STUB_CONTRACT_ADDRESS
              : val.selectedAsset.contractId,
          },
        );
        return;
      }

      if (
        val.selectedAsset.contractId === AETERNITY_CONTRACT_ID
        && tokenInstance.value
      ) {
        tokenInstance.value = null;
      }

      const minFee: BigNumber = new BigNumber(TxBuilder.calculateMinFee('spendTx', {
        gas: sdk.Ae.defaults.gas,
        params: {
          ...sdk.Ae.defaults,
          senderId: activeAccount.value.address,
          recipientId: activeAccount.value.address,
          amount,
          ttl: 0,
          nonce: nonce.value + 1,
          payload: val.payload,
        },
      })).shiftedBy(-MAGNITUDE);
      if (!minFee.isEqualTo(fee.value)) fee.value = minFee;
    },
    {
      deep: true,
      immediate: true,
    },
  );

  onMounted(() => {
    updateTokenBalanceInterval = executeAndSetInterval(async () => {
      if (!tokenInstance.value) return;
      await getSdk();
      selectedTokenBalance.value = new BigNumber(
        (await tokenInstance.value.methods.balance(activeAccount.value.address)).decodedResult ?? 0,
      ).shiftedBy(-selectedAssetDecimals.value);
    }, 1000);

    updateNonceInterval = executeAndSetInterval(async () => {
      const sdk = await getSdk();
      try {
        nonce.value = (await sdk.api
          .getAccountByPubkey(activeAccount.value.address))?.nonce;
      } catch (error: any) {
        if (!error.message.includes('Account not found')) handleUnknownError(error);
      }
    }, 5000);
  });

  onBeforeUnmount(() => {
    clearInterval(updateTokenBalanceInterval);
    clearInterval(updateNonceInterval);
  });

  return {
    max,
    fee,
  };
}
