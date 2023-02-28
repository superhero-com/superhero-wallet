import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  Ref,
} from '@vue/composition-api';
import BigNumber from 'bignumber.js';
import FUNGIBLE_TOKEN_CONTRACT from 'aeternity-fungible-token/FungibleTokenFullInterface.aes';
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
  executeAndSetInterval,
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

  let updateTokenBalanceInterval: NodeJS.Timer;
  let updateNonceInterval: NodeJS.Timer;
  const fee = ref<BigNumber>(new BigNumber(0));
  const tokenInstance = ref<any>(null);
  const nonce = ref(0);
  const selectedAssetDecimals = ref(0);

  const account = computed<IAccount>(() => store.getters.account);
  const max = computed(() => {
    let selectedAssetBalance = new BigNumber(0);
    if (balance.value && formModel.value?.selectedAsset?.contractId === AETERNITY_CONTRACT_ID) {
      selectedAssetBalance = new BigNumber(balance.value);
    } else if (formModel.value.selectedAsset?.convertedBalance) {
      selectedAssetBalance = new BigNumber(formModel.value.selectedAsset.convertedBalance);
    }

    const maxValue = selectedAssetBalance.minus(fee.value);
    return (maxValue.isPositive() ? maxValue : 0).toString();
  });

  async function updateCalculatedFee() {
    if (!formModel.value?.selectedAsset) return;
    const sdk = await getSdk();

    if (formModel.value.selectedAsset.contractId !== AETERNITY_CONTRACT_ID) {
      if (
        !tokenInstance.value
        || tokenInstance.value.deployInfo.address !== formModel.value.selectedAsset.contractId
      ) {
        tokenInstance.value = await sdk.getContractInstance({
          source: FUNGIBLE_TOKEN_CONTRACT,
          contractAddress: formModel.value.selectedAsset.contractId,
        });
      }
      selectedAssetDecimals.value = formModel.value.selectedAsset.decimals!;
    }

    const numericAmount = (
      formModel.value.amount
      && formModel.value.amount > 0
    ) ? formModel.value.amount : 0;
    const amount = new BigNumber(numericAmount).shiftedBy(MAGNITUDE);

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
    if (!minFee.isEqualTo(fee.value)) fee.value = minFee;
  }

  watch(
    () => formModel.value,
    async () => {
      updateCalculatedFee();
    },
    { deep: true },
  );

  onMounted(() => {
    updateNonceInterval = executeAndSetInterval(async () => {
      const sdk = await getSdk();
      try {
        nonce.value = (await sdk.api
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
    fee,
    updateCalculatedFee,
  };
}
