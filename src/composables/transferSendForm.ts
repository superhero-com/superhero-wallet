import {
  computed,
  ref,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useForm } from 'vee-validate';

import type {
  Dictionary,
  IAsset,
  IToken,
  Protocol,
  TransferFormModel,
} from '@/types';
import { useModals } from '@/composables/modals';
import {
  APP_LINK_WEB,
  IS_PRODUCTION,
  MODAL_READ_QR_CODE,
} from '@/constants';
import { toShiftedBigNumber, getMessageByFieldName } from '@/utils';
import Logger from '@/lib/logger';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { NoUserMediaPermissionError } from '@/lib/errors';
import { useTransferSendHandler } from './transferSendHandler';

type SelectedAssetValueFunction = (
  tokenContractId?: string,
  selectedAsset?: IAsset
) => IToken | undefined;

interface UseTransferSendFormParams {
  transferData: TransferFormModel;
  getSelectedAssetValue?: SelectedAssetValueFunction;
  protocol: Protocol;
}

export function useTransferSendForm({
  transferData,
  getSelectedAssetValue,
  protocol,
}: UseTransferSendFormParams) {
  const formModel = ref<TransferFormModel>(transferData);
  const invoiceId = ref(null);
  const invoiceContract = ref(null);

  const { t } = useI18n();
  const { openModal, openDefaultModal } = useModals();
  const { errors, validate } = useForm();
  const { save: saveFormData } = useTransferSendHandler();

  const hasError = computed((): boolean => ['address', 'amount'].some((errorKey) => getMessageByFieldName(errors.value[errorKey]).status === 'error'));

  function clearPayload() {
    formModel.value.payload = '';
  }

  function handleAssetChange(selectedAsset: IToken) {
    formModel.value.selectedAsset = selectedAsset;
  }

  function returnFormModelValues(
    {
      account,
      amount,
      payload,
      token,
    }: Dictionary,
    tokenHandler?: SelectedAssetValueFunction,
  ) {
    const result: Partial<TransferFormModel> = {};

    const selectedToken = tokenHandler ? tokenHandler(token, formModel.value.selectedAsset) : null;
    if (selectedToken) {
      result.selectedAsset = selectedToken;
    }

    if (account) {
      result.address = account;
    }
    if (amount) {
      result.amount = amount;
    }
    if (payload) {
      result.payload = payload;
    }

    return result;
  }

  function updateFormModelValues(params: Dictionary) {
    formModel.value = {
      ...formModel.value,
      ...returnFormModelValues(params, getSelectedAssetValue),
    };
  }

  async function openScanQrModal(tokenBalances: IToken[]) {
    let scanResult: string | null = '';
    scanResult = await openModal(MODAL_READ_QR_CODE, {
      title: t(
        'pages.send.scanAddress',
        { assetName: (formModel.value.selectedAsset as IToken)?.name },
      ),
      icon: 'critical',
    }).then(
      (result: string) => result,
    ).catch((error: Error) => {
      if (error instanceof NoUserMediaPermissionError) {
        saveFormData(formModel.value as TransferFormModel);
      }
      return null;
    });
    if (scanResult?.trim().charAt(0) === '{') {
      let parsedScanResult: any = null;
      try {
        parsedScanResult = JSON.parse(scanResult);
      } catch (error: any) {
        if (!IS_PRODUCTION) {
          Logger.write(error);
        }
        formModel.value.address = undefined;
        openDefaultModal({
          title: t('modals.invalid-qr-code.msg'),
          icon: 'critical',
        });
        return;
      }

      // does user have the requested tokens?
      const requestedTokenBalance = tokenBalances
        .find(({ value }: any) => value === parsedScanResult.tokenContract);
      if (!requestedTokenBalance) {
        formModel.value.address = undefined;
        openDefaultModal({ msg: t('modals.insufficient-balance.msg') });
        return;
      }

      // select requested token
      formModel.value.selectedAsset = tokenBalances
        .find(({ value }: any) => value === parsedScanResult.tokenContract);

      // SET result data
      formModel.value.address = parsedScanResult.tokenContract;
      formModel.value.amount = toShiftedBigNumber(
        parsedScanResult.amount,
        -(formModel.value.selectedAsset as IToken)?.decimals,
      ).toString();
      invoiceId.value = parsedScanResult.invoiceId;
      invoiceContract.value = parsedScanResult.invoiceContract;
      await validate();
    } else {
      if (!scanResult) {
        return;
      }
      updateFormModelValues([
        ...new URL(
          (scanResult.startsWith(ProtocolAdapterFactory.getAdapter(protocol).getAccountPrefix()))
            ? `${APP_LINK_WEB}/account?account=${scanResult.replace('?', '&')}`
            : scanResult,
        )
          .searchParams.entries(),
      ].reduce((o, [k, v]) => ({ ...o, [k]: v }), {}));
      invoiceId.value = null;
    }
    if (!formModel.value.address) {
      formModel.value.address = undefined;
    }
  }

  return {
    formModel,
    errors,
    hasError,
    invoiceId,
    invoiceContract,
    openScanQrModal,
    clearPayload,
    handleAssetChange,
    validate,
    updateFormModelValues,
  };
}
