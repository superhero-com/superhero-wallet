import { InvalidTxError } from '@aeternity/aepp-sdk';
import { isTransientRequestError } from '@/utils/common';
import { restError } from '../helpers/restError';

describe('isTransientRequestError', () => {
  it.each([
    ['no answer', restError('failed', { code: 'REQUEST_SEND_ERROR' })],
    ['a server error', restError('failed', { statusCode: 503 })],
    ['a request timeout', restError('failed', { statusCode: 408 })],
    ['a rate limit', restError('failed', { statusCode: 429 })],
  ])('is true for %s', (_, error) => {
    expect(isTransientRequestError(error)).toBe(true);
  });

  it.each([
    ['a rejected transaction', restError('failed', { statusCode: 400 })],
    ['a missing entry', restError('failed', { statusCode: 404 })],
    ['a failed verification', new InvalidTxError('Transaction verification errors', [], 'tx_')],
    ['any other error', new Error('Unsupported protocol')],
    ['no error', undefined],
  ])('is false for %s', (_, error) => {
    expect(isTransientRequestError(error)).toBe(false);
  });
});
