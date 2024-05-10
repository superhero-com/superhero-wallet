import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  Ref,
} from 'vue';
import BigNumber from 'bignumber.js';
import {
  buildTx,
  Contract,
  ContractMethodsBase,
  encode,
  Encoded,
  Encoding,
  Tag,
  unpackTx,
} from '@aeternity/aepp-sdk';

import type { IFormModel } from '@/types';
import {
  executeAndSetInterval,
  handleUnknownError,
  isUrlValid,
  watchUntilTruthy,
} from '@/utils';
import { PROTOCOLS } from '@/constants';
import {
  STUB_CALLDATA,
  STUB_CONTRACT_ADDRESS,
} from '@/constants/stubs';
import {
  AE_COIN_PRECISION,
  AE_CONTRACT_ID,
} from '@/protocols/aeternity/config';
import { isAensNameValid } from '@/protocols/aeternity/helpers';
import FungibleTokenFullInterfaceACI from '@/protocols/aeternity/aci/FungibleTokenFullInterfaceACI.json';

import { useAeSdk } from './aeSdk';
import { useBalances } from './balances';
import { useAccounts } from './accounts';

export interface MaxAmountOptions {
  formModel: Ref<IFormModel>;
}

/**
 * Composable that allows to use real max amount of selected token
 * considering the fee that needs to be paid.
 */
export function useMaxAmount({ formModel }: MaxAmountOptions) {
  const { getAeSdk } = useAeSdk();
  const { balance } = useBalances();
  const { getLastActiveProtocolAccount } = useAccounts();

  let updateTokenBalanceInterval: NodeJS.Timer;
  let updateNonceInterval: NodeJS.Timer;
  const fee = ref<BigNumber>(new BigNumber(0));
  const selectedTokenBalance = ref(new BigNumber(0));
  let tokenInstance: Contract<ContractMethodsBase> | null;
  const nonce = ref(0);
  const selectedAssetDecimals = ref(0);

  const max = computed(() => {
    if (balance.value && formModel.value?.selectedAsset?.contractId === AE_CONTRACT_ID) {
      const _max = balance.value.minus(fee.value);
      return (_max.isPositive() ? _max : 0).toString();
    }
    return selectedTokenBalance.value.toString();
  });

  function getAccount() {
    return getLastActiveProtocolAccount(PROTOCOLS.aeternity)!;
  }

  watch(
    () => formModel.value,
    async (val) => {
      if (!val?.selectedAsset) {
        return;
      }
      const aeSdk = await getAeSdk();
      const isAssetAe = val.selectedAsset.contractId === AE_CONTRACT_ID;
      const account = getAccount();
      await watchUntilTruthy(nonce);

      if (!isAssetAe) {
        if (
          !tokenInstance
          || tokenInstance.$options.address !== val.selectedAsset.contractId
        ) {
          tokenInstance = await aeSdk.initializeContract({
            aci: FungibleTokenFullInterfaceACI,
            address: val.selectedAsset.contractId as Encoded.ContractAddress,
          });
        }
        selectedAssetDecimals.value = val.selectedAsset.decimals!;
      }

      const numericAmount = (val.amount && +val.amount > 0) ? val.amount : 0;
      const amount = new BigNumber(numericAmount).shiftedBy(AE_COIN_PRECISION);

      if (
        !isAssetAe
        || (
          val.address && !isAensNameValid(val.address) && isUrlValid(val.address)
        )
      ) {
        let calldata: Encoded.ContractBytearray = STUB_CALLDATA;
        if (tokenInstance) {
          calldata = tokenInstance._calldata.encode(
            tokenInstance._name,
            'transfer',
            [account.address, amount.toFixed()],
          );
        }
        fee.value = BigNumber(unpackTx(
          buildTx({
            tag: Tag.ContractCallTx,
            callerId: account.address as Encoded.AccountAddress,
            contractId: (isAssetAe)
              ? STUB_CONTRACT_ADDRESS
              : val.selectedAsset.contractId as Encoded.ContractAddress,
            amount: 0,
            callData: calldata,
            nonce: nonce.value,
            ttl: await aeSdk.getHeight({ cached: true }) + 3,
          }),
          Tag.ContractCallTx, // https://github.com/aeternity/aepp-sdk-js/issues/1852
        ).fee).shiftedBy(-AE_COIN_PRECISION);
        return;
      }

      if (isAssetAe && tokenInstance) {
        tokenInstance = null;
      }

      const minFee = BigNumber(unpackTx(
        buildTx({
          tag: Tag.SpendTx,
          senderId: account.address as Encoded.AccountAddress,
          recipientId: account.address as Encoded.AccountAddress,
          amount,
          payload: encode(new TextEncoder().encode(val.payload), Encoding.Bytearray),
          nonce: nonce.value,
          ttl: await aeSdk.getHeight({ cached: true }) + 3,
        }),
        Tag.SpendTx, // https://github.com/aeternity/aepp-sdk-js/issues/1852
      ).fee).shiftedBy(-AE_COIN_PRECISION);
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
      await getAeSdk();
      selectedTokenBalance.value = new BigNumber(
        (await tokenInstance.balance(getAccount().address)).decodedResult ?? 0,
      ).shiftedBy(-selectedAssetDecimals.value);
    }, 1000);

    updateNonceInterval = executeAndSetInterval(async () => {
      const aeSdk = await getAeSdk();
      try {
        nonce.value = (await aeSdk.api
          .getAccountNextNonce(getAccount().address)).nextNonce;
      } catch (error: any) {
        if (error.message.includes('Account not found')) {
          nonce.value = 1;
        } else {
          handleUnknownError(error);
        }
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
