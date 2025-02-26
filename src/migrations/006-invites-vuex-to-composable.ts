import type { IInviteSerialized, Migration } from '@/types';
import { collectVuexState } from './migrationHelpers';

const migration: Migration<IInviteSerialized[]> = async (restoredValue: IInviteSerialized[]) => {
  if (!restoredValue?.length) {
    const invites = (await collectVuexState())?.invites?.invites;
    if (invites?.length) {
      return invites;
    }
  }
  return restoredValue;
};

export default migration;
