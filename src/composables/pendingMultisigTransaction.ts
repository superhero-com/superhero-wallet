import { onMounted, ref, watch } from '@vue/composition-api';
import { Store } from 'vuex';
import { watchUntilTruthy } from '../popup/utils';
import { IActiveMultisigTx } from '../types';
import { useMultisigAccounts } from './multisigAccounts';
import { useMultisigTransactions } from './multisigTransactions';

interface UsePendingMultisigTransactionOptions {
  /**
   * TODO: Temporary solution to avoid dependency circle
   */
  store: Store<any>
}

const pendingMultisigTransaction = ref<IActiveMultisigTx | null>();

export function usePendingMultisigTransaction({ store }: UsePendingMultisigTransactionOptions) {
  const { activeMultisigAccount } = useMultisigAccounts({ store });
  const { fetchActiveMultisigTx } = useMultisigTransactions({ store });

  async function assignPendingMultisigTx() {
    if (activeMultisigAccount.value) {
      pendingMultisigTransaction.value = await fetchActiveMultisigTx(
        activeMultisigAccount.value.contractId,
      );
    }
  }

  watch(
    () => activeMultisigAccount.value,
    () => {
      assignPendingMultisigTx();
    },
  );

  onMounted(async () => {
    if (!pendingMultisigTransaction.value) {
      await watchUntilTruthy(() => activeMultisigAccount.value);
      assignPendingMultisigTx();
    }
  });

  return {
    pendingMultisigTransaction,
  };
}
