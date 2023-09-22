import type { IAccountRaw, Migration } from '@/types';
import { ACCOUNT_HD_WALLET, PROTOCOLS } from '@/constants';
import { collectVuexState } from './migrationHelpers';

const migration: Migration<IAccountRaw[]> = async (restoredValue: IAccountRaw[]) => {
  if (!restoredValue?.length) {
    const accounts = (await collectVuexState())?.accounts?.list as any[] | undefined;
    if (accounts?.length) {
      return accounts.reduce(
        (list: IAccountRaw[], { protocol, type }: IAccountRaw) => {
          if (PROTOCOLS.includes(protocol) && type === ACCOUNT_HD_WALLET) {
            list.push({
              isRestored: true,
              protocol,
              type,
            });
          }
          return list;
        },
        [],
      );
    }
  }
  return restoredValue;
};

export default migration;
