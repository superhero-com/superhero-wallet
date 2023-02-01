import { categorizeContractCallTxObject } from '../../../src/popup/utils';

const expectedKeys = {
  retip_token: ['url', 'amount', 'token'],
  tip_token: ['url', 'note', 'amount', 'token'],
  other: ['to', 'amount', 'token'],
};

const testArgument = { type: '', value: '' };
const testCases = [{
  tx: {
    arguments: [
      testArgument,
      testArgument,
    ],
    contractId: 'contractId',
    function: 'transfer',
    type: 'ContractCallTx',
  },
  returnKeys: expectedKeys.other,
},
{
  tx: {
    arguments: [
      testArgument,
      testArgument,
      testArgument,
    ],
    contractId: 'contractId',
    function: 'retip_token',
    type: 'ContractCallTx',
  },
  returnKeys: expectedKeys.retip_token,
}, {
  tx: {
    arguments: [
      testArgument,
      testArgument,
      testArgument,
      testArgument,
    ],
    function: 'tip_token',
    contractId: 'contractId',
    type: 'ContractCallTx',
  },
  returnKeys: expectedKeys.tip_token,
}, {
  tx: {
    arguments: [
      testArgument,
      testArgument,
    ],
    contractId: 'contractId',
    type: 'ContractCallTx',
    function: 'change_allowance',
  },
  returnKeys: expectedKeys.other,
}, {
  tx: {
    arguments: [
      testArgument,
      testArgument,
    ],
    contractId: 'contractId',
    type: 'ContractCallTx',
    function: 'create_allowance',
  },
  returnKeys: expectedKeys.other,
},
{
  tx: {
    type: 'NamePreclaimTx',
  },
  returnNull: true,
},
{
  tx: {
    type: 'ContractCallTx',
    function: 'tip',
  },
  returnNull: true,
}];

describe('categorizeContractCallTxObject', () => {
  testCases.forEach((test) => it('should return null if transaction.tx.type is different to ContractCallTx or transaction.tx.function is not included in ["transfer, "change_allowance", "create_allowance", "tip_token", "retip_token"] otherwise return expected keys', () => {
    expect.hasAssertions();
    const result = categorizeContractCallTxObject(test);
    if (test.returnNull) {
      expect(result).toBe(null);
      return;
    }
    // eslint-disable-next-line no-unused-expressions
    test.returnKeys?.forEach((key) => {
      expect(result).toHaveProperty(key);
    });
  }));
});
