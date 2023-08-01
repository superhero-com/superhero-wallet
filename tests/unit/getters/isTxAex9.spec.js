import { isTransactionAex9 } from '../../../src/protocols/aeternity/helpers';
import { transactions } from '../../../src/popup/utils/testsConfig';

const tests = ({
  changeAllowance, createAllowance, transfer, pendingTransfer,
  pendingTipToken, tipToken, retipToken, incompleteTransfer, ...otherTxs
}) => [{
  transaction: {
    ...pendingTransfer,
    tx: {
      ...pendingTransfer.tx,
      type: 'contractCallTx', // should be case insensitive
    },
  },
  result: true,
},
...[
  changeAllowance, createAllowance, transfer,
  pendingTransfer, pendingTipToken, tipToken, retipToken, incompleteTransfer,
]
  .map((t) => ({ transaction: t, result: true })),
...Object.values(otherTxs).map((t) => ({ transaction: t, result: false })),
];

describe('isTransactionAex9', () => {
  tests(transactions).forEach(({ transaction, result }) => it(
    `should return correct result for ${transaction.tx.type}: ${transaction.tx.function}`,
    () => expect(isTransactionAex9(transaction)).toBe(result),
  ));
});
