import {
  computed,
  nextTick,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useForm } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

import type {
  Dictionary,
  IAsset,
  IToken,
  TransferFormModel,
} from '@/types';
import { useAccounts, useModals } from '@/composables';
import { APP_LINK_WEB, IS_PRODUCTION } from '@/constants';
import { toShiftedBigNumber, getMessageByFieldName, isUrlValid } from '@/utils';
import Logger from '@/lib/logger';
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
}

export function useTransferSendForm({
  transferData,
  getSelectedAssetValue,
}: UseTransferSendFormParams) {
  const formModel = ref<TransferFormModel>(transferData);
  const invoiceId = ref(null);
  const invoiceContract = ref(null);

  const route = useRoute();
  const router = useRouter();

  const { t } = useI18n();
  const { openDefaultModal, openScanQrModal } = useModals();
  const { errors, validate, validateField } = useForm();
  const { saveTransferSendFormModel } = useTransferSendHandler();
  const { accountAssets } = useAccountAssetsList();
  const { activeAccount } = useAccounts();

  const hasError = computed(
    (): boolean => ['addresses', 'amount'].some(
      (errorKey) => getMessageByFieldName(errors.value[errorKey]).status === 'error',
    ),
  );

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
      result.addresses = [account, ...(formModel.value.addresses ?? [])];
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

  async function scanTransferQrCode() {
    const scanResult = await openScanQrModal({
      title: t(
        'pages.send.scanAddress',
        { assetName: formModel.value.selectedAsset?.name },
      ),
    })
      .then((result: string) => result)
      .catch((error: Error) => {
        if (error instanceof NoUserMediaPermissionError) {
          saveTransferSendFormModel(formModel.value as TransferFormModel);
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
        formModel.value.addresses = undefined;
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
        formModel.value.addresses = undefined;
        openDefaultModal({ msg: t('modals.insufficient-balance.msg') });
        return;
      }

      // select requested token
      formModel.value.selectedAsset = requestedTokenBalance;

      // SET result data
      formModel.value.addresses = [parsedScanResult.tokenContract];
      formModel.value.amount = toShiftedBigNumber(
        parsedScanResult.amount,
        -(formModel.value.selectedAsset?.decimals || -0),
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
          isUrlValid(scanResult)
            ? scanResult
            : `${APP_LINK_WEB}/account?account=${scanResult.replace('?', '&')}`,
        )
          .searchParams.entries(),
      ].map(([k, v]) => [k, v])));
      invoiceId.value = null;
    }
    if (!formModel.value.addresses) {
      formModel.value.addresses = undefined;
    }
  }

  onMounted(() => {
    watch(
      [activeAccount, () => route.query],
      () => {
        const { query } = route;
        if (query && Object.keys(query).length > 0) {
          formModel.value.addresses = undefined;
          router.replace({ query: {} });
        }

        updateFormModelValues({
          ...query,
          token: query.token || formModel.value.selectedAsset?.contractId,
        });
      },
      { deep: true, immediate: true },
    );
  });

  return {
    formModel,
    errors,
    hasError,
    invoiceId,
    invoiceContract,
    scanTransferQrCode,
    clearPayload,
    handleAssetChange,
    validate,
    updateFormModelValues,
  };
}
