import BigNumber from 'bignumber.js';
import getters from '../../../src/store/getters';
import { transactions } from '../../../src/popup/utils/testsConfig';
import { AE_COIN_PRECISION } from '../../../src/protocols/aeternity/config';
import { TX_DIRECTION, STUB_TOKEN_CONTRACT_ADDRESS } from '../../../src/popup/utils';

const TEST_TOKEN_DECIMALS = 12;

const tests = [{
  transaction: transactions.payForGaAttach,
  resultSent: new BigNumber(transactions.payForGaAttach.tx.fee)
    .plus(transactions.payForGaAttach.tx.tx.tx.fee).shiftedBy(-AE_COIN_PRECISION),
  resultReceived: 0,
}, {
  transaction: transactions.gaMetaSpend,
  resultSent: new BigNumber(transactions.gaMetaSpend.tx.tx.tx.amount)
    .plus(transactions.gaMetaSpend.tx.tx.tx.fee)
    .plus(transactions.gaMetaSpend.tx.fee)
    .shiftedBy(-AE_COIN_PRECISION),
  resultReceived: new BigNumber(transactions.gaMetaSpend.tx.tx.tx.amount)
    .shiftedBy(-AE_COIN_PRECISION),
}, {
  transaction: transactions.nameClaim,
  resultSent: new BigNumber(transactions.nameClaim.tx.fee)
    .plus(transactions.nameClaim.tx.nameFee).shiftedBy(-AE_COIN_PRECISION),
},
...[transactions.spend, transactions.tip, transactions.retip, transactions.claim]
  .map((transaction) => ({
    transaction,
    resultSent: new BigNumber(transaction.tx.amount)
      .plus(transaction.tx.fee)
      .shiftedBy(-AE_COIN_PRECISION),
    resultReceived: new BigNumber(transaction.tx.amount).shiftedBy(-AE_COIN_PRECISION),
  })),
...[
  transactions.transfer, transactions.createAllowance,
  transactions.changeAllowance, transactions.tipToken, transactions.retipToken,
].map((transaction) => ({
  transaction,
  resultSent: new BigNumber(transaction.tx.arguments[transaction.tx.arguments.length - 1].value)
    .shiftedBy(-TEST_TOKEN_DECIMALS),
  resultReceived: new BigNumber(transaction.tx.arguments[transaction.tx.arguments.length - 1].value)
    .shiftedBy(-TEST_TOKEN_DECIMALS),
})),
];

const store = {
  fungibleTokens: {
    availableTokens: {
      [STUB_TOKEN_CONTRACT_ADDRESS]: {
        decimals: TEST_TOKEN_DECIMALS,
      },
    },
  },
};

describe('getTxAmountTotal', () => {
  tests.forEach((test) => it(
    `should return correct result for each type of transaction: for \
${test.transaction.tx.type}/${test.transaction.tx.function}`,
    () => {
      expect(
        new BigNumber(getters.getTxAmountTotal(store)(test.transaction, TX_DIRECTION.sent))
          .isEqualTo(test.resultSent),
      ).toBeTruthy();
      expect(
        new BigNumber(getters.getTxAmountTotal(store)(test.transaction)).isEqualTo(test.resultSent),
      ).toBeTruthy();
      if (test.resultReceived !== undefined) {
        expect(
          new BigNumber(getters.getTxAmountTotal(store)(test.transaction, TX_DIRECTION.received))
            .isEqualTo(test.resultReceived),
        ).toBeTruthy();
      }
    },
  ));
});
