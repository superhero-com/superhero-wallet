import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  Ref,
} from '@vue/composition-api';
import BigNumber from 'bignumber.js';
import {
  Tag, unpackTx, Contract, Encoding, encode,
} from '@aeternity/aepp-sdk';
import type { Store } from 'vuex';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import type { IAccount, IAsset, IToken } from '../types';
import {
  MAGNITUDE,
  STUB_CONTRACT_ADDRESS,
  AETERNITY_CONTRACT_ID,
  executeAndSetInterval,
  calculateFee,
  validateTipUrl,
  checkAensName,
  handleUnknownError,
  FUNGIBLE_TOKEN_CONTRACT_ACI,
} from '../popup/utils';
import { useSdk } from './sdk';
import { useBalances } from './balances';
import { IFungibleContractApi } from '../types/fungibleContract';

export interface IFormModel {
  amount: number | string;
  selectedAsset: IToken | IAsset | null;
  address?: string;
  payload?: string;
}
export interface MaxAmountOptions {
  /**
   * TODO: Temporary solution to avoid dependency circle
   */
  store: Store<any>
  formModel: Ref<IFormModel>
}

let tokenInstance: Contract<IFungibleContractApi>;

/**
 * Composable that allows to use real max amount of selected token
 * considering the fee that needs to be paid.
 */
export function useMaxAmount({ store, formModel }: MaxAmountOptions) {
  const { sdk } = useSdk({ store });
  const { balance } = useBalances({ store });

  let updateTokenBalanceInterval: NodeJS.Timer;
  let updateNonceInterval: NodeJS.Timer;
  const txfee = ref(new BigNumber(0));
  const selectedTokenBalance = ref(new BigNumber(0));
  const nonce = ref(0);
  const selectedAssetDecimals = ref(0);

  const account = computed<IAccount>(() => store.getters.account);
  const max = computed(() => {
    if (balance.value && formModel.value?.selectedAsset?.contractId === AETERNITY_CONTRACT_ID) {
      const _max = balance.value.minus(txfee.value);
      return (_max.isPositive() ? _max : 0).toString();
    }
    return selectedTokenBalance.value.toString();
  });

  watch(
    () => formModel.value,
    async (val) => {
      if (!val?.selectedAsset) return;

      if (val.selectedAsset.contractId !== AETERNITY_CONTRACT_ID) {
        if (!tokenInstance
          || tokenInstance.$options.address !== val.selectedAsset.contractId) {
          tokenInstance = await sdk.value.initializeContract({
            aci: FUNGIBLE_TOKEN_CONTRACT_ACI as any, // Todo: remove typecasting once https://github.com/aeternity/aepp-sdk-js/issues/1741 fixed
            address: val.selectedAsset.contractId as Encoded.ContractAddress,
          });
        }
        selectedAssetDecimals.value = val.selectedAsset.decimals!;
      }

      if (
        val.selectedAsset.contractId !== AETERNITY_CONTRACT_ID
        || (
          val.address && !checkAensName(val.address) && validateTipUrl(val.address)
        )
      ) {
        txfee.value = calculateFee(
          Tag.ContractCallTx, {
            ttl: 0,
            nonce: nonce.value + 1,
            amount: (new BigNumber(val.amount > 0 ? val.amount : 0)).shiftedBy(MAGNITUDE),
            callerId: account.value.address,
            contractId: validateTipUrl(val.address)
              ? STUB_CONTRACT_ADDRESS
              : val.selectedAsset.contractId,
          },
        );
        return;
      }
      const spendTx: Encoded.Transaction = await sdk.value.buildTx(Tag.SpendTx, {
        senderId: account.value.address,
        recipientId: account.value.address,
        amount: BigNumber(val.amount > 0 ? val.amount : 0).shiftedBy(MAGNITUDE),
        ttl: 0,
        nonce: nonce.value + 1,
        payload: encode(Buffer.from(''), Encoding.Bytearray),
      } as any); // TODO: Remove typecasting to any once https://github.com/aeternity/aepp-sdk-js/issues/1727 closed.
      const { fee } = (unpackTx(spendTx, Tag.SpendTx) as any); // TODO: Remove typecasting to any once https://github.com/aeternity/aepp-sdk-js/issues/1727 closed.
      const minFee: BigNumber = BigNumber(fee).shiftedBy(-MAGNITUDE);
      if (!minFee.isEqualTo(txfee.value)) txfee.value = minFee;
    },
    { deep: true },
  );

  onMounted(() => {
    updateTokenBalanceInterval = executeAndSetInterval(async () => {
      if (!tokenInstance) return;
      selectedTokenBalance.value = new BigNumber(
        (await tokenInstance.balance(
          account.value.address as Encoded.AccountAddress,
        )).decodedResult,
      ).shiftedBy(-selectedAssetDecimals.value);
    }, 1000);

    updateNonceInterval = executeAndSetInterval(async () => {
      try {
        nonce.value = (await sdk.value.api
          .getAccountByPubkey(account.value.address))?.nonce;
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
    fee: txfee,
  };
}
