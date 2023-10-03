import type { Migration, PermissionRegistry } from '@/types';
import { handleUnknownError } from '@/utils';
import { collectVuexState } from './migrationHelpers';

const migration: Migration = async (restoredValue: PermissionRegistry) => {
  if (!restoredValue || !Object.keys(restoredValue).length) {
    const permissions = (await collectVuexState())?.permissions;
    try {
      if (permissions && Object.keys(permissions).length) {
        return permissions;
      }
    } catch (error) {
      handleUnknownError(error);
    }
  }
  return restoredValue;
};

export default migration;
