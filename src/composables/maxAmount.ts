import {
  ref,
  computed,
  watch,
  Ref,
} from '@vue/composition-api';
import BigNumber from 'bignumber.js';
import { TxBuilder, SCHEMA } from '@aeternity/aepp-sdk';
import type {
  IAccount,
  IAsset,
  IDefaultComposableOptions,
  IToken,
} from '../types';
import {
  MAGNITUDE,
  STUB_CONTRACT_ADDRESS,
  AETERNITY_CONTRACT_ID,
  calculateFee,
  validateTipUrl,
  checkAensName,
  handleUnknownError,
} from '../popup/utils';
import { useSdk } from './sdk';
import { useBalances } from './balances';

export interface IFormModel {
  amount?: number | string;
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
  const tokenBalances = computed<IToken[]>(() => store.getters['fungibleTokens/tokenBalances']);

  const fee = ref<BigNumber>(new BigNumber(0));
  const nonce = ref(0);

  const account = computed<IAccount>(() => store.getters.account);
  const max = computed(() => {
    let selectedAssetBalance = new BigNumber(balance.value);

    if (formModel.value?.selectedAsset?.contractId === AETERNITY_CONTRACT_ID) {
      const maxValue = selectedAssetBalance.minus(fee.value);
      return (maxValue.isPositive() ? maxValue : 0).toString();
    }

    if (formModel.value.selectedAsset?.convertedBalance) {
      selectedAssetBalance = new BigNumber(formModel.value.selectedAsset.convertedBalance);
    } else {
      selectedAssetBalance = new BigNumber(
        tokenBalances.value.find(
          (token) => token.contractId === formModel.value?.selectedAsset?.contractId,
        )?.convertedBalance || 0,
      );
    }

    return selectedAssetBalance.toString();
  });

  async function updateCalculatedFee() {
    if (!formModel.value?.selectedAsset) {
      return;
    }
    const sdk = await getSdk();
    const numericAmount = formModel.value?.amount || 0;
    const amount = new BigNumber(numericAmount).shiftedBy(MAGNITUDE);

    try {
      nonce.value = (await sdk.api
        .getAccountByPubkey(account.value.address))?.nonce;
    } catch (error: any) {
      if (!error.message.includes('Account not found')) {
        handleUnknownError(error);
      }
    }

    if (
      formModel.value.selectedAsset.contractId !== AETERNITY_CONTRACT_ID
      || (
        formModel.value.address
        && !checkAensName(formModel.value.address)
        && validateTipUrl(formModel.value.address)
      )
    ) {
      fee.value = calculateFee(
        SCHEMA.TX_TYPE.contractCall, {
          ...sdk.Ae.defaults,
          ttl: 0,
          nonce: nonce.value + 1,
          amount,
          callerId: account.value.address,
          contractId: (formModel.value.address && validateTipUrl(formModel.value.address))
            ? STUB_CONTRACT_ADDRESS
            : formModel.value.selectedAsset.contractId,
        },
      );
      return;
    }

    const minFee: BigNumber = new BigNumber(TxBuilder.calculateMinFee('spendTx', {
      gas: sdk.Ae.defaults.gas,
      params: {
        ...sdk.Ae.defaults,
        senderId: account.value.address,
        recipientId: account.value.address,
        amount,
        ttl: 0,
        nonce: nonce.value + 1,
        payload: formModel.value.payload,
      },
    })).shiftedBy(-MAGNITUDE);
    if (!minFee.isEqualTo(fee.value)) {
      fee.value = minFee;
    }
  }

  watch(
    () => formModel.value,
    () => updateCalculatedFee(),
    { deep: true },
  );

  return {
    max,
    fee,
    updateCalculatedFee,
  };
}
