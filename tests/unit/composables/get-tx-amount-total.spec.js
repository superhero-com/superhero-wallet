import BigNumber from 'bignumber.js';
import { Tag } from '@aeternity/aepp-sdk';

import { useFungibleTokens } from '@/composables';
import { PROTOCOLS, TX_DIRECTION } from '@/constants';
import {
  STUB_ADDRESS,
  STUB_CONTRACT_ADDRESS,
  STUB_TOKEN_CONTRACT_ADDRESS,
  STUB_TRANSACTIONS,
} from '@/constants/stubs';
import {
  ACTIVITIES_TYPES,
  AE_COIN_PRECISION,
  TX_FUNCTIONS,
} from '@/protocols/aeternity/config';
import { ETH_CONTRACT_ID } from '@/protocols/ethereum/config';

const TEST_TOKEN_DECIMALS = 12;
/** An Æternity token deliberately registered WITHOUT a `decimals` field. */
const AE_TOKEN_NO_DECIMALS_CONTRACT = 'ct_noDecimalsToken00000000000000000000000000000000000';
/** An EVM token contract so we can exercise the non-Æternity token branch. */
const ETH_TOKEN_CONTRACT = '0xtokencontract000000000000000000000000000000';

/**
 * Compare amounts by their canonical decimal string. `getTxAmountTotal` returns a
 * JS number; comparing `BigNumber(...).toFixed()` sidesteps float noise and gives a
 * readable diff on failure (unlike a bare `BigNumber.isEqualTo(...)` boolean).
 */
const amountStr = (value) => new BigNumber(value).toFixed();

/** The transferred amount for an Æternity token call lives in the last call argument. */
const lastArgValue = ({ tx }) => tx.arguments[tx.arguments.length - 1].value;

const {
  tokenBalances,
  getTxAmountTotal,
} = useFungibleTokens();

/**
 * `tokensAvailable` (the map `getTxAmountTotal` reads token decimals from) is a
 * `computed` derived from the writable `tokenBalances` ref, so seeding must go through
 * `tokenBalances` - not by mutating the read-only computed in place (which the previous,
 * skipped, version of this test did and only "worked" by accident of Vue's caching).
 * Re-seed before every test so an async storage restore can never clobber it mid-run.
 */
beforeEach(() => {
  tokenBalances.value = [
    {
      protocol: PROTOCOLS.aeternity,
      contractId: STUB_TOKEN_CONTRACT_ADDRESS,
      decimals: TEST_TOKEN_DECIMALS,
    },
    {
      // `decimals` intentionally omitted -> should fall back to AE_COIN_PRECISION.
      protocol: PROTOCOLS.aeternity,
      contractId: AE_TOKEN_NO_DECIMALS_CONTRACT,
    },
    {
      protocol: PROTOCOLS.ethereum,
      contractId: ETH_TOKEN_CONTRACT,
      decimals: 18,
    },
  ];
});

/**
 * The original coverage table: one entry per real transaction shape, asserting the
 * `sent` total (with fees) and, where meaningful, the `received` total (amount only).
 */
const coreCases = [
  // Nested "paying for" tx: only fees, no transferred amount.
  {
    transaction: STUB_TRANSACTIONS.payForGaAttach,
    resultSent: new BigNumber(STUB_TRANSACTIONS.payForGaAttach.tx.fee)
      .plus(STUB_TRANSACTIONS.payForGaAttach.tx.tx.tx.fee)
      .shiftedBy(-AE_COIN_PRECISION),
    resultReceived: new BigNumber(0),
  },
  // Generalized-account meta spend: inner amount + both fee layers.
  {
    transaction: STUB_TRANSACTIONS.gaMetaSpend,
    resultSent: new BigNumber(STUB_TRANSACTIONS.gaMetaSpend.tx.tx.tx.amount)
      .plus(STUB_TRANSACTIONS.gaMetaSpend.tx.tx.tx.fee)
      .plus(STUB_TRANSACTIONS.gaMetaSpend.tx.fee)
      .shiftedBy(-AE_COIN_PRECISION),
    resultReceived: new BigNumber(STUB_TRANSACTIONS.gaMetaSpend.tx.tx.tx.amount)
      .shiftedBy(-AE_COIN_PRECISION),
  },
  // Name claim: the `nameFee` stands in for the amount.
  {
    transaction: STUB_TRANSACTIONS.nameClaim,
    resultSent: new BigNumber(STUB_TRANSACTIONS.nameClaim.tx.fee)
      .plus(STUB_TRANSACTIONS.nameClaim.tx.nameFee)
      .shiftedBy(-AE_COIN_PRECISION),
    resultReceived: undefined,
  },
  // Plain coin transactions: amount + fee sent, amount received.
  ...[
    STUB_TRANSACTIONS.spend,
    STUB_TRANSACTIONS.tip,
    STUB_TRANSACTIONS.retip,
    STUB_TRANSACTIONS.claim,
  ].map((transaction) => ({
    transaction,
    resultSent: new BigNumber(transaction.tx.amount)
      .plus(transaction.tx.fee)
      .shiftedBy(-AE_COIN_PRECISION),
    resultReceived: new BigNumber(transaction.tx.amount).shiftedBy(-AE_COIN_PRECISION),
  })),
  // Æternity token contract calls: amount taken from the call arguments and shifted by
  // the token's own decimals; the network fee (paid in coin) is NOT part of the total.
  ...[
    STUB_TRANSACTIONS.transfer,
    STUB_TRANSACTIONS.createAllowance,
    STUB_TRANSACTIONS.changeAllowance,
    STUB_TRANSACTIONS.tipToken,
    STUB_TRANSACTIONS.retipToken,
  ].map((transaction) => ({
    transaction,
    resultSent: new BigNumber(lastArgValue(transaction)).shiftedBy(-TEST_TOKEN_DECIMALS),
    resultReceived: new BigNumber(lastArgValue(transaction)).shiftedBy(-TEST_TOKEN_DECIMALS),
  })),
];

describe('getTxAmountTotal', () => {
  coreCases.forEach((testCase) => it(
    `computes the total for ${testCase.transaction.tx.type}/${testCase.transaction.tx.function}`,
    () => {
      // Explicit `sent` direction.
      expect(amountStr(getTxAmountTotal(testCase.transaction, TX_DIRECTION.sent)))
        .toBe(amountStr(testCase.resultSent));
      // `sent` is also the default direction.
      expect(amountStr(getTxAmountTotal(testCase.transaction)))
        .toBe(amountStr(testCase.resultSent));

      if (testCase.resultReceived !== undefined) {
        expect(amountStr(getTxAmountTotal(testCase.transaction, TX_DIRECTION.received)))
          .toBe(amountStr(testCase.resultReceived));
      }
    },
  ));

  describe('direction handling', () => {
    it('excludes the fee from the received total but includes it when sent', () => {
      const { spend } = STUB_TRANSACTIONS;

      const sent = getTxAmountTotal(spend, TX_DIRECTION.sent);
      const received = getTxAmountTotal(spend, TX_DIRECTION.received);

      expect(amountStr(sent)).toBe(
        amountStr(new BigNumber(spend.tx.amount).plus(spend.tx.fee).shiftedBy(-AE_COIN_PRECISION)),
      );
      expect(amountStr(received)).toBe(
        amountStr(new BigNumber(spend.tx.amount).shiftedBy(-AE_COIN_PRECISION)),
      );
      expect(new BigNumber(sent).isGreaterThan(received)).toBe(true);
    });
  });

  describe('Æternity coin (generic) branch', () => {
    it('adds contract-call gas cost (gasPrice * gasUsed) to the sent total only', () => {
      const gasTx = {
        protocol: PROTOCOLS.aeternity,
        tx: {
          amount: 5000000000000000,
          fee: 100000000000000,
          gasPrice: 1000000000,
          gasUsed: 20000,
          function: 'some_contract_method', // not a categorized token call -> generic branch
          type: 'ContractCallTx',
          contractId: STUB_CONTRACT_ADDRESS, // not a known token -> no token branch
        },
      };
      const gasCost = new BigNumber(gasTx.tx.gasPrice).multipliedBy(gasTx.tx.gasUsed);

      expect(amountStr(getTxAmountTotal(gasTx, TX_DIRECTION.sent))).toBe(
        amountStr(
          new BigNumber(gasTx.tx.amount)
            .plus(gasTx.tx.fee)
            .plus(gasCost)
            .shiftedBy(-AE_COIN_PRECISION),
        ),
      );
      // Received ignores fee AND gas.
      expect(amountStr(getTxAmountTotal(gasTx, TX_DIRECTION.received))).toBe(
        amountStr(new BigNumber(gasTx.tx.amount).shiftedBy(-AE_COIN_PRECISION)),
      );
    });

    it('reads the claimed tip amount from the event log when amount/nameFee are absent', () => {
      const claimedAmount = 7000000000000000;
      const claimTx = {
        protocol: PROTOCOLS.aeternity,
        tx: {
          amount: 0,
          fee: 100000000000000,
          function: TX_FUNCTIONS.claim,
          type: 'ContractCallTx',
          contractId: STUB_CONTRACT_ADDRESS,
          log: [{ topics: ['event', 'address', claimedAmount] }],
        },
      };

      expect(amountStr(getTxAmountTotal(claimTx, TX_DIRECTION.sent))).toBe(
        amountStr(
          new BigNumber(claimedAmount).plus(claimTx.tx.fee).shiftedBy(-AE_COIN_PRECISION),
        ),
      );
      expect(amountStr(getTxAmountTotal(claimTx, TX_DIRECTION.received))).toBe(
        amountStr(new BigNumber(claimedAmount).shiftedBy(-AE_COIN_PRECISION)),
      );
    });

    it('returns zero for a call with no amount and no fee', () => {
      const emptyTx = {
        protocol: PROTOCOLS.aeternity,
        tx: {
          amount: 0,
          fee: 0,
          function: 'noop',
          type: 'ContractCallTx',
          contractId: STUB_CONTRACT_ADDRESS,
        },
      };

      expect(amountStr(getTxAmountTotal(emptyTx, TX_DIRECTION.sent))).toBe('0');
    });
  });

  describe('token-sale buy (isTokenSaleBuy flag)', () => {
    const callerId = STUB_ADDRESS;
    const paidAmount = 10000000000000000;
    const refundAmount = 3000000000000000;
    const tokenSaleTx = {
      protocol: PROTOCOLS.aeternity,
      tx: {
        amount: paidAmount,
        fee: 100000000000000,
        callerId,
        function: 'buy',
        type: 'ContractCallTx',
        contractId: STUB_CONTRACT_ADDRESS,
        internalEvents: [{
          type: ACTIVITIES_TYPES.internalContractCallEvent,
          payload: { internalTx: { recipientId: callerId, amount: refundAmount } },
        }],
      },
    };

    it('subtracts the refunded amount from the paid amount when the flag is set', () => {
      expect(amountStr(getTxAmountTotal(tokenSaleTx, TX_DIRECTION.sent, true))).toBe(
        amountStr(
          new BigNumber(paidAmount - refundAmount)
            .plus(tokenSaleTx.tx.fee)
            .shiftedBy(-AE_COIN_PRECISION),
        ),
      );
    });

    it('uses the raw paid amount when the flag is not set', () => {
      expect(amountStr(getTxAmountTotal(tokenSaleTx, TX_DIRECTION.sent, false))).toBe(
        amountStr(
          new BigNumber(paidAmount).plus(tokenSaleTx.tx.fee).shiftedBy(-AE_COIN_PRECISION),
        ),
      );
    });
  });

  describe('Æternity token branch', () => {
    it('falls back to AE_COIN_PRECISION when the token has no registered decimals', () => {
      const tokenAmount = 1000000000000000000;
      const transferTx = {
        protocol: PROTOCOLS.aeternity,
        tx: {
          amount: 0,
          fee: 16780000000000,
          function: TX_FUNCTIONS.transfer,
          type: 'ContractCallTx',
          contractId: AE_TOKEN_NO_DECIMALS_CONTRACT,
          arguments: [
            { type: 'address', value: STUB_ADDRESS },
            { type: 'int', value: tokenAmount },
          ],
        },
      };

      // Token branch ignores the fee and shifts by the fallback precision (18).
      const expected = amountStr(new BigNumber(tokenAmount).shiftedBy(-AE_COIN_PRECISION));
      expect(amountStr(getTxAmountTotal(transferTx, TX_DIRECTION.sent))).toBe(expected);
      expect(amountStr(getTxAmountTotal(transferTx, TX_DIRECTION.received))).toBe(expected);
    });
  });

  describe('non-Æternity (EVM) branch', () => {
    it('adds the fee for a native coin transfer (raw, un-shifted)', () => {
      const coinTx = {
        protocol: PROTOCOLS.ethereum,
        tx: { amount: 1000000, fee: 21000, contractId: ETH_CONTRACT_ID },
      };

      expect(getTxAmountTotal(coinTx, TX_DIRECTION.sent)).toBe(1000000 + 21000);
      expect(getTxAmountTotal(coinTx, TX_DIRECTION.received)).toBe(1000000);
    });

    it('excludes the fee for a known token contract transfer', () => {
      const tokenTx = {
        protocol: PROTOCOLS.ethereum,
        tx: { amount: 500, fee: 21000, contractId: ETH_TOKEN_CONTRACT },
      };

      expect(getTxAmountTotal(tokenTx, TX_DIRECTION.sent)).toBe(500);
      expect(getTxAmountTotal(tokenTx, TX_DIRECTION.received)).toBe(500);
    });

    it('adds the fee for a contract-creation / non-token contract call', () => {
      const createTx = {
        protocol: PROTOCOLS.ethereum,
        tx: {
          amount: 0,
          fee: 30000,
          contractId: 'ct_freshDeploy',
          tag: Tag.ContractCreateTx,
        },
      };

      expect(getTxAmountTotal(createTx, TX_DIRECTION.sent)).toBe(30000);
      expect(getTxAmountTotal(createTx, TX_DIRECTION.received)).toBe(0);
    });
  });
});
