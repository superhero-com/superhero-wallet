import type { Migration, PermissionRegistry } from '@/types';

/**
 * WalletConnect connections used to be saved under an empty host,
 * which can't be routed to and breaks the permissions settings page.
 */
const migration: Migration = async (restoredValue: PermissionRegistry | null) => {
  if (!restoredValue?.['']) {
    return restoredValue;
  }
  const { '': emptyHostPermission, ...permissions } = restoredValue;
  return permissions;
};

export default migration;
