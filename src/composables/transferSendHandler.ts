import { useRoute } from 'vue-router';

import { TransferFormModel, WalletRouteMeta } from '@/types';
import {
  IS_EXTENSION,
  MODAL_TRANSFER_SEND,
  TRANSFER_SEND_DATA_LOCAL_STORAGE_KEY,
} from '@/constants';
import { useModals } from '@/composables';
import { getLocalStorageItem, removeLocalStorageItem, setLocalStorageItem } from '@/utils';

/**
 * Save and restore form-data on local storage.
 * Example usecase - Save data after extension closes & opens window to ask camera permission
 * and restore data when user comes back to the extension
 */
export function useTransferSendHandler() {
  const { meta } = useRoute();
  const { openModal } = useModals();

  function save(formModel: TransferFormModel) {
    setLocalStorageItem([TRANSFER_SEND_DATA_LOCAL_STORAGE_KEY], formModel);
  }

  function restore() {
    const transferSendData = getLocalStorageItem<TransferFormModel>(
      [TRANSFER_SEND_DATA_LOCAL_STORAGE_KEY],
    );

    if (!(IS_EXTENSION && transferSendData)) {
      return;
    }

    // setTimeout is required because
    // the modal will not open if called immediately
    setTimeout(() => {
      openModal(MODAL_TRANSFER_SEND, {
        isMultisig: (meta.value as WalletRouteMeta)?.isMultisig,
        tokenContractId: transferSendData?.selectedAsset?.contractId,
        ...transferSendData,
      });
      removeLocalStorageItem([TRANSFER_SEND_DATA_LOCAL_STORAGE_KEY]);
    }, 100);
  }

  return {
    restore,
    save,
  };
}
