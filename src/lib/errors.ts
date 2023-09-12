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
