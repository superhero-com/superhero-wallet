import { onMounted, ref, watch } from '@vue/composition-api';
import { watchUntilTruthy } from '../popup/utils';
import type { IActiveMultisigTx, IDefaultComposableOptions } from '../types';
import { useMultisigAccounts } from './multisigAccounts';
import { useMultisigTransactions } from './multisigTransactions';

const pendingMultisigTransaction = ref<IActiveMultisigTx | null>();

export function usePendingMultisigTransaction({ store }: IDefaultComposableOptions) {
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
