/* eslint-disable max-classes-per-file */

export class RejectedByUserError extends Error {
  constructor() {
    super('Rejected by user');
    this.name = this.constructor.name;
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
