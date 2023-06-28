import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  Ref,
} from 'vue';
import BigNumber from 'bignumber.js';
import { Encoded } from '@aeternity/aepp-sdk-13';
import { TxBuilder, SCHEMA } from '@aeternity/aepp-sdk';

import FungibleTokenFullInterfaceACI from '../lib/contracts/FungibleTokenFullInterfaceACI.json';
import type {
  IAsset,
  IDefaultComposableOptions,
} from '../types';
import {
  AETERNITY_COIN_PRECISION,
  AETERNITY_CONTRACT_ID,
  STUB_CONTRACT_ADDRESS,
  executeAndSetInterval,
  calculateFee,
  validateTipUrl,
  checkAensName,
  handleUnknownError,
} from '../popup/utils';
import { useSdk } from './sdk';
import { useSdk13 } from './sdk13';
import { useBalances } from './balances';
import { useAccounts } from './accounts';

export interface IFormModel {
  amount?: string;
  selectedAsset?: IAsset;
  address?: Encoded.AccountAddress;
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
  const { getSdk: getSdk13 } = useSdk13({ store });
  const { balance } = useBalances({ store });
  const { activeAccount } = useAccounts({ store });

  let updateTokenBalanceInterval: NodeJS.Timer;
  let updateNonceInterval: NodeJS.Timer;
  const fee = ref<BigNumber>(new BigNumber(0));
  const selectedTokenBalance = ref(new BigNumber(0));
  let tokenInstance: any;
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
      const sdk13 = await getSdk13();

      if (val.selectedAsset.contractId !== AETERNITY_CONTRACT_ID) {
        if (
          !tokenInstance
          || tokenInstance.$options.address !== val.selectedAsset.contractId
        ) {
          tokenInstance = await sdk13.initializeContract({
            aci: FungibleTokenFullInterfaceACI,
            address: val.selectedAsset.contractId as any,
          });
        }
        selectedAssetDecimals.value = val.selectedAsset.decimals!;
      }

      const numericAmount = (val.amount && +val.amount > 0) ? val.amount : 0;
      const amount = new BigNumber(numericAmount).shiftedBy(AETERNITY_COIN_PRECISION);

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
        && tokenInstance
      ) {
        tokenInstance = null;
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
      })).shiftedBy(-AETERNITY_COIN_PRECISION);
      if (!minFee.isEqualTo(fee.value)) fee.value = minFee;
    },
    {
      deep: true,
      immediate: true,
    },
  );

  onMounted(() => {
    updateTokenBalanceInterval = executeAndSetInterval(async () => {
      if (!tokenInstance) return;
      await getSdk();
      selectedTokenBalance.value = new BigNumber(
        (await tokenInstance.balance(activeAccount.value.address)).decodedResult ?? 0,
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
