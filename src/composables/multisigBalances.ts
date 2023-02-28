import { computed } from '@vue/composition-api';
import type { Balance, IDefaultComposableOptions } from '../types';
import { useMultisigAccounts } from './multisigAccounts';

export function useMultisigBalances({ store }: IDefaultComposableOptions) {
  const { multisigAccounts } = useMultisigAccounts({ store });

  const multisigBalances = computed((): Record<string, Balance> => multisigAccounts.value.reduce(
    (acc, vault) => ({
      ...acc,
      [vault.gaAccountId]: vault.balance,
    }),
    {},
  ));

  return {
    multisigBalances,
  };
}
