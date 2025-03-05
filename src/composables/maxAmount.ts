import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  Ref,
} from 'vue';
import BigNumber from 'bignumber.js';
import { debounce } from 'lodash-es';
import {
  Contract,
  ContractMethodsBase,
  encode,
  Encoded,
  Encoding,
  isNameValid,
  Tag,
  unpackTx,
} from '@aeternity/aepp-sdk';

import type { IFormModel, IMultisigAccount } from '@/types';
import { executeAndSetInterval, isUrlValid } from '@/utils';
import { PROTOCOLS } from '@/constants';
import { STUB_TIP_NOTE } from '@/constants/stubs';
import { AE_COIN_PRECISION, AE_CONTRACT_ID } from '@/protocols/aeternity/config';
import FungibleTokenFullInterfaceACI from '@/protocols/aeternity/aci/FungibleTokenFullInterfaceACI.json';
import { aettosToAe } from '@/protocols/aeternity/helpers';

import { useAeSdk } from './aeSdk';
import { useBalances } from './balances';
import { useAccounts } from './accounts';
import { useMultisigTransactions } from './multisigTransactions';
import { useTippingContracts } from './tippingContracts';

export interface MaxAmountOptions {
  formModel: Ref<IFormModel>;
  multisigVault?: IMultisigAccount;
}

/**
 * Composable that allows to use real max amount of selected token
 * considering the fee that needs to be paid.
 */
export function useMaxAmount({ formModel, multisigVault }: MaxAmountOptions) {
  const { getAeSdk } = useAeSdk();
  const { balance } = useBalances();
  const { getLastActiveProtocolAccount } = useAccounts();
  const { getTippingContracts } = useTippingContracts();

  let updateTokenBalanceInterval: NodeJS.Timeout;
  const fee = ref<BigNumber>(new BigNumber(0));
  const total = ref<BigNumber>(new BigNumber(0));
  const gasUsed = ref(0);
  const gasPrice = ref(0);
  const selectedTokenBalance = ref(new BigNumber(0));
  let tokenInstance: Contract<ContractMethodsBase> | null;
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

  const handleFormValueChangeDebounced = debounce(
    async (val) => {
      if (!val?.selectedAsset) {
        return;
      }
      const aeSdk = await getAeSdk();
      const isAssetAe = val.selectedAsset.contractId === AE_CONTRACT_ID;
      const account = getAccount();

      if (!isAssetAe) {
        if (
          !tokenInstance
          || tokenInstance.$options.address !== val.selectedAsset.contractId
        ) {
          tokenInstance = await Contract.initialize({
            ...aeSdk.getContext(),
            aci: FungibleTokenFullInterfaceACI,
            address: val.selectedAsset.contractId as Encoded.ContractAddress,
          });
        }
        selectedAssetDecimals.value = val.selectedAsset.decimals!;
      }

      const numericAmount = (val.amount && +val.amount > 0) ? val.amount : 0;
      const amount = new BigNumber(numericAmount).shiftedBy(AE_COIN_PRECISION);

      let callResult: any;

      if (!isAssetAe && tokenInstance) {
        try {
          callResult = await tokenInstance.transfer(
            val.address ?? account.address,
            amount.toFixed(),
            { callStatic: true },
          );
        } catch (e) {
          return;
        }
      }

      if (multisigVault) {
        const { proposeTx } = useMultisigTransactions();
        const builtTransactionHash = await aeSdk.buildTx({
          tag: Tag.SpendTx,
          senderId: multisigVault.gaAccountId as Encoded.AccountAddress,
          recipientId: account.address as Encoded.AccountAddress,
          amount,
          payload: encode(new TextEncoder().encode(val.payload), Encoding.Bytearray),
        });
        callResult = (await proposeTx(
          builtTransactionHash,
          multisigVault.contractId,
          { callStatic: true },
        ))?.callResult;
      }

      if (val.address && !isNameValid(val.address) && isUrlValid(val.address)) {
        const { tippingV1, tippingV2 } = await getTippingContracts();
        const tippingContract = tippingV2 || tippingV1;
        try {
          callResult = await tippingContract.tip(
            val.address ?? account.address,
            STUB_TIP_NOTE,
            {
              amount,
              waitMined: false,
              callStatic: true,
            },
          );
        } catch (e) {
          return;
        }
      }

      if (callResult?.result) {
        const aettosFee = (callResult.tx as any).fee;
        gasUsed.value = +callResult.result.gasUsed.toString() ?? 0;
        gasPrice.value = +aettosToAe(callResult.result.gasPrice.toString());
        total.value = new BigNumber(callResult.result.gasUsed ?? 0)
          .multipliedBy(callResult.result.gasPrice.toString() ?? 0)
          .plus(aettosFee)
          .shiftedBy(-AE_COIN_PRECISION);
        fee.value = new BigNumber(aettosFee).shiftedBy(-AE_COIN_PRECISION);
        return;
      }

      if (isAssetAe && tokenInstance) {
        tokenInstance = null;
      }

      const minFee = BigNumber(unpackTx(
        await aeSdk.buildTx({
          tag: Tag.SpendTx,
          senderId: account.address as Encoded.AccountAddress,
          recipientId: account.address as Encoded.AccountAddress,
          amount,
          payload: encode(new TextEncoder().encode(val.payload), Encoding.Bytearray),
          ttl: await aeSdk.getHeight({ cached: true }) + 3,
        }),
        Tag.SpendTx, // https://github.com/aeternity/aepp-sdk-js/issues/1852
      ).fee).shiftedBy(-AE_COIN_PRECISION);
      if (!minFee.isEqualTo(fee.value)) fee.value = minFee;
      total.value = new BigNumber(amount).shiftedBy(-AE_COIN_PRECISION).plus(fee.value);
    },
    500,
    { leading: true },
  );

  watch(
    () => formModel.value,
    (val) => handleFormValueChangeDebounced(val),
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
  });

  onBeforeUnmount(() => clearInterval(updateTokenBalanceInterval));

  return {
    fee,
    gasPrice,
    gasUsed,
    max,
    total,
  };
}
