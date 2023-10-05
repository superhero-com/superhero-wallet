import BigNumber from 'bignumber.js';
import Vuex from 'vuex';
import { useFungibleTokens } from '@/composables';
import { TX_DIRECTION } from '../../../src/constants';
import { STUB_TOKEN_CONTRACT_ADDRESS, STUB_TRANSACTIONS } from '../../../src/constants/stubs';
import { AE_COIN_PRECISION } from '../../../src/protocols/aeternity/config';

const TEST_TOKEN_DECIMALS = 12;

const tests = [{
  transaction: STUB_TRANSACTIONS.payForGaAttach,
  resultSent: new BigNumber(STUB_TRANSACTIONS.payForGaAttach.tx.fee)
    .plus(STUB_TRANSACTIONS.payForGaAttach.tx.tx.tx.fee).shiftedBy(-AE_COIN_PRECISION),
  resultReceived: 0,
}, {
  transaction: STUB_TRANSACTIONS.gaMetaSpend,
  resultSent: new BigNumber(STUB_TRANSACTIONS.gaMetaSpend.tx.tx.tx.amount)
    .plus(STUB_TRANSACTIONS.gaMetaSpend.tx.tx.tx.fee)
    .plus(STUB_TRANSACTIONS.gaMetaSpend.tx.fee)
    .shiftedBy(-AE_COIN_PRECISION),
  resultReceived: new BigNumber(STUB_TRANSACTIONS.gaMetaSpend.tx.tx.tx.amount)
    .shiftedBy(-AE_COIN_PRECISION),
}, {
  transaction: STUB_TRANSACTIONS.nameClaim,
  resultSent: new BigNumber(STUB_TRANSACTIONS.nameClaim.tx.fee)
    .plus(STUB_TRANSACTIONS.nameClaim.tx.nameFee).shiftedBy(-AE_COIN_PRECISION),
},
...[
  STUB_TRANSACTIONS.spend,
  STUB_TRANSACTIONS.tip,
  STUB_TRANSACTIONS.retip,
  STUB_TRANSACTIONS.claim,
]
  .map((transaction) => ({
    transaction,
    resultSent: new BigNumber(transaction.tx.amount)
      .plus(transaction.tx.fee)
      .shiftedBy(-AE_COIN_PRECISION),
    resultReceived: new BigNumber(transaction.tx.amount).shiftedBy(-AE_COIN_PRECISION),
  })),
...[
  STUB_TRANSACTIONS.transfer,
  STUB_TRANSACTIONS.createAllowance,
  STUB_TRANSACTIONS.changeAllowance,
  STUB_TRANSACTIONS.tipToken,
  STUB_TRANSACTIONS.retipToken,
].map((transaction) => ({
  transaction,
  resultSent: new BigNumber(transaction.tx.arguments[transaction.tx.arguments.length - 1].value)
    .shiftedBy(-TEST_TOKEN_DECIMALS),
  resultReceived: new BigNumber(transaction.tx.arguments[transaction.tx.arguments.length - 1].value)
    .shiftedBy(-TEST_TOKEN_DECIMALS),
})),
];

describe('getTxAmountTotal', () => {
  const store = new Vuex.Store({});
  const { availableTokens, getTxAmountTotal } = useFungibleTokens({ store });

  availableTokens.value[STUB_TOKEN_CONTRACT_ADDRESS] = {
    decimals: TEST_TOKEN_DECIMALS,
  };

  tests.forEach((test) => it(
    `should return correct result for each type of transaction: for \
${test.transaction.tx.type}/${test.transaction.tx.function}`,
    () => {
      expect(
        new BigNumber(getTxAmountTotal(test.transaction, TX_DIRECTION.sent))
          .isEqualTo(test.resultSent),
      ).toBeTruthy();
      expect(
        new BigNumber(getTxAmountTotal(test.transaction)).isEqualTo(test.resultSent),
      ).toBeTruthy();
      if (test.resultReceived !== undefined) {
        expect(
          new BigNumber(getTxAmountTotal(test.transaction, TX_DIRECTION.received))
            .isEqualTo(test.resultReceived),
        ).toBeTruthy();
      }
    },
  ));
});
