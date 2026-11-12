/* eslint-disable max-classes-per-file */

export class RejectedByUserError extends Error {
  constructor() {
    super('Rejected by user');
    this.name = this.constructor.name;
  }
}

/** A new seed was about to be written over one that is still stored on the device. */
export class StoredWalletFoundError extends Error {
  constructor() {
    super('A wallet is still stored on this device');
    this.name = this.constructor.name;
  }
}

/** A migrated value couldn't be stored and is kept in memory: `retry` stores it again. */
export class StorageMigrationWriteError extends Error {
  storageKey: string;

  cause: unknown;

  retry: () => Promise<void>;

  constructor(storageKey: string, cause: unknown, retry: () => Promise<void>) {
    super(`Saving the updated "${storageKey}" failed`);
    this.name = this.constructor.name;
    this.storageKey = storageKey;
    this.cause = cause;
    this.retry = retry;
  }
}

/** The password entered doesn't open the wallet; other failures leave it unanswered. */
export class WrongPasswordError extends Error {
  constructor() {
    super('The password is incorrect');
    this.name = this.constructor.name;
  }
}

/** Adding an imported account now would replace the ones that can't be decrypted. */
export class ImportedAccountsUnreadableError extends Error {
  constructor() {
    super('The imported accounts stored on this device cannot be decrypted');
    this.name = this.constructor.name;
  }
}

/**
 * A check failed or got no answer in time, with the accounts up to `lastUsedIndex` found used.
 */
export class AccountDiscoveryError extends Error {
  reason: unknown;

  lastUsedIndex: number;

  constructor(reason: unknown, lastUsedIndex: number) {
    super('Account discovery failed');
    this.name = this.constructor.name;
    this.reason = reason;
    this.lastUsedIndex = lastUsedIndex;
  }
}

export class NoUserMediaPermissionError extends Error {
  constructor() {
    super('No UserMedia permission');
    this.name = this.constructor.name;
  }
}

export class AddressBookInvalidAddress extends Error {
  constructor() {
    super('Invalid address provided');
    this.name = this.constructor.name;
  }
}

export class AddressBookEntryExists extends Error {
  constructor() {
    super('Address book entry already exists');
    this.name = this.constructor.name;
  }
}

export class AddressBookRequiredFields extends Error {
  constructor() {
    super('Name and address are required');
    this.name = this.constructor.name;
  }
}
