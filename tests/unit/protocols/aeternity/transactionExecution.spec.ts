import type { ITx } from '@/types';
import { getTransactionExecutionResult } from '@/protocols/aeternity/helpers';

function tx(fields: Record<string, unknown>): ITx {
  return { type: 'ContractCallTx', ...fields } as unknown as ITx;
}

function wrap(type: string, inner: ITx, fields: Record<string, unknown> = {}): ITx {
  return tx({ type, tx: { signatures: [], tx: inner }, ...fields });
}

const failedCall = tx({ returnType: 'revert', return: 'call failed' });
const okCall = tx({ returnType: 'ok', return: 'call result' });

describe('getTransactionExecutionResult', () => {
  it.each([
    ['a direct call', failedCall, 'revert', 'call failed'],
    ['a sponsored call', wrap('PayingForTx', failedCall), 'revert', 'call failed'],
    ['a GA call', wrap('GAMetaTx', failedCall, { returnType: 'ok' }), 'revert', 'call failed'],
    [
      'a sponsored GA call',
      wrap('PayingForTx', wrap('GAMetaTx', failedCall, { returnType: 'ok' })),
      'revert',
      'call failed',
    ],
    ['a failed GA authentication', wrap('GAMetaTx', okCall, { returnType: 'error' }), 'error', undefined],
    ['a successful sponsored call', wrap('PayingForTx', okCall), undefined, undefined],
  ])('reads the result of %s', (_, transaction, returnType, reason) => {
    const result = getTransactionExecutionResult(transaction);

    expect(result?.returnType).toBe(returnType);
    expect(result?.return).toBe(reason);
  });
});
