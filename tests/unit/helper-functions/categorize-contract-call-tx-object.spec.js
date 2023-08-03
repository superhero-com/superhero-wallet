import { STUB_TRANSACTIONS } from '../../../src/constants/stubs';
import { categorizeContractCallTxObject } from '../../../src/protocols/aeternity/helpers';

const expectedKeys = {
  retip_token: ['url', 'amount', 'token'],
  tip_token: ['url', 'note', 'amount', 'token'],
  other: ['to', 'amount', 'token'],
};

const testCases = ({ retipToken, tipToken, ...otherTxs }) => [
  ...Object.values(otherTxs).map((transaction) => ({
    ...transaction,
    ...(
      ['transfer', 'change_allowance', 'create_allowance'].includes(transaction.tx.function)
      || (
        transaction.tx.type === 'ContractCallTx'
        && (transaction.incomplete || transaction.pending)
      )
    )
      ? { returnKeys: expectedKeys.other }
      : { returnNull: true },
  })),
  {
    ...retipToken,
    returnKeys: expectedKeys.retip_token,
  }, {
    ...tipToken,
    returnKeys: expectedKeys.tip_token,
  }];

describe('categorizeContractCallTxObject', () => {
  testCases(STUB_TRANSACTIONS).forEach((test) => it(
    `should return correct object for ${test.tx.type}/${test.tx.function ?? ''}\
${test.pending ? '/pending' : ''}${test.incomplete ? '/incomplete' : ''}`,
    () => {
      const result = categorizeContractCallTxObject(test);
      if (test.returnNull) {
        expect(result).toBe(null);
      } else {
        test.returnKeys.forEach((key) => {
          expect(result).toHaveProperty(key);
        });
      }
    },
  ));
});
