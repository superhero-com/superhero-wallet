import { computed, watch } from 'vue';
import type { IAccount, IDefaultComposableOptions } from '@/types';
import { PROTOCOL_AETERNITY } from '@/constants';
import { isEqual } from 'lodash-es';

let lastActiveAeAccountIdx = 0;

export function useAeAccounts({ store }: IDefaultComposableOptions) {
  const activeIdx = computed((): number => store.state.accounts?.activeIdx || 0);
  const accounts = computed((): IAccount[] => store.getters.accounts || []);
  const activeAccount = computed((): IAccount => accounts.value[activeIdx.value] || {});

  const aeAccounts = computed(
    () => accounts.value.filter(({ protocol }) => protocol === PROTOCOL_AETERNITY),
  );

  const aeAddressList = computed(
    () => aeAccounts.value.map(({ address }) => address),
  );

  const lastActiveAeAccount = computed(
    (): IAccount => accounts.value[lastActiveAeAccountIdx] || {},
  );

  watch(
    activeAccount,
    (newAccount, oldAccount) => {
      if (!isEqual(oldAccount, newAccount)) {
        if (newAccount.protocol === PROTOCOL_AETERNITY) {
          lastActiveAeAccountIdx = newAccount.idx;
        }
      }
    },
    { deep: true },
  );

  return {
    aeAccounts,
    aeAddressList,
    lastActiveAeAccount,
  };
}
