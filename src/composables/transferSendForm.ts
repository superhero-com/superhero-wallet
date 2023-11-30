import {
  computed,
  nextTick,
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
import { useAccountAssetsList } from './accountAssetsList';

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
  const { errors, validate, validateField } = useForm();
  const { save: saveFormData } = useTransferSendHandler();
  const { accountAssets } = useAccountAssetsList();

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

  async function updateFormModelValues(params: Dictionary) {
    const updatedValues = returnFormModelValues(params, getSelectedAssetValue);
    formModel.value = {
      ...formModel.value,
      ...updatedValues,
    };
    await nextTick();
    Object.keys(updatedValues).forEach((field) => validateField(field));
  }

  async function openScanQrModal() {
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
      const requestedTokenBalance = accountAssets.value
        .find(({ contractId }) => contractId === parsedScanResult.tokenContract);
      if (!requestedTokenBalance) {
        formModel.value.address = undefined;
        openDefaultModal({ msg: t('modals.insufficient-balance.msg') });
        return;
      }

      // select requested token
      formModel.value.selectedAsset = requestedTokenBalance;

      // SET result data
      formModel.value.address = parsedScanResult.tokenContract;
      formModel.value.amount = toShiftedBigNumber(
        parsedScanResult.amount,
        -formModel.value.selectedAsset?.decimals!,
      ).toString();
      invoiceId.value = parsedScanResult.invoiceId;
      invoiceContract.value = parsedScanResult.invoiceContract;
      await validate();
    } else {
      if (!scanResult) {
        return;
      }
      updateFormModelValues(Object.fromEntries([
        ...new URL(
          (scanResult.startsWith(ProtocolAdapterFactory.getAdapter(protocol).getAccountPrefix()))
            ? `${APP_LINK_WEB}/account?account=${scanResult.replace('?', '&')}`
            : scanResult,
        )
          .searchParams.entries(),
      ].map(([k, v]) => [k, v])));
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
