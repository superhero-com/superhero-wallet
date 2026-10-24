import { RestError } from '@azure/core-rest-pipeline';

/**
 * A failed request as the node client of the SDK rejects it: with `statusCode` when the node
 * answered, with `code` (`REQUEST_SEND_ERROR`) when it didn't.
 */
export function restError(message: string, fields: { statusCode?: number; code?: string } = {}) {
  return new RestError(message, fields);
}
