import type { IInvite, Migration } from '@/types';
import { collectVuexState } from './migrationHelpers';

const migration: Migration<IInvite[]> = async (restoredValue: IInvite[]) => {
  if (!restoredValue?.length) {
    const invites = (await collectVuexState())?.invites?.invites;
    if (invites?.length) {
      return invites;
    }
  }
  return restoredValue;
};

export default migration;
