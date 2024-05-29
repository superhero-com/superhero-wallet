import { useRoute } from 'vue-router';

import { TransferFormModel, WalletRouteMeta } from '@/types';
import {
  IS_EXTENSION,
  MODAL_TRANSFER_SEND,
  STORAGE_KEYS,
} from '@/constants';
import { useModals } from '@/composables';
import { getLocalStorageItem, removeLocalStorageItem, setLocalStorageItem } from '@/utils';

/**
 * Save and restore form-data on local storage.
 * Example use case - Save data after extension closes & opens window to ask camera permission
 * and restore data when user comes back to the extension
 */
export function useTransferSendHandler() {
  const { meta } = useRoute();
  const { openModal } = useModals();

  function saveTransferSendFormModel(formModel: TransferFormModel) {
    setLocalStorageItem([STORAGE_KEYS.transferSendData], formModel);
  }

  function restoreTransferSendForm() {
    const transferSendData = getLocalStorageItem<TransferFormModel>(
      [STORAGE_KEYS.transferSendData],
    );

    if (IS_EXTENSION && transferSendData) {
      // setTimeout is required because
      // the modal will not open if called immediately
      setTimeout(() => {
        openModal(MODAL_TRANSFER_SEND, {
          isMultisig: (meta.value as WalletRouteMeta)?.isMultisig,
          tokenContractId: transferSendData?.selectedAsset?.contractId,
          ...transferSendData,
        });
        removeLocalStorageItem([STORAGE_KEYS.transferSendData]);
      }, 100);
    }
  }

  return {
    restoreTransferSendForm,
    saveTransferSendFormModel,
  };
}
