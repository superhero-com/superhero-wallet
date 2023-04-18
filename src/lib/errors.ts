export class RejectedByUserError extends Error {
  constructor() {
    super('Rejected by user');
    this.name = this.constructor.name;
  }
}
