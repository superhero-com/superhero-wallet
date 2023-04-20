import {
  AETERNITY_CONTRACT_ID,
  STUB_TOKEN_CONTRACT_ADDRESS,
  isTransactionAex9,
} from '../../../src/popup/utils';

const tests = [{
  transaction: {
    tx: {
      amount: 0,
      arguments: [
        {
          type: 'address',
          value: 'ak_2ZEoCKcqXkbz2uahRrsWeaPooZs9SdCv6pmC4kc55rD4MhqYSu',
        },
        {
          type: 'int',
          value: 99900000000000000,
        },
      ],
      contractId: STUB_TOKEN_CONTRACT_ADDRESS,
      function: 'change_allowance',
      type: 'ContractCallTx',
    },
  },
  result: true,
}, {
  transaction: {
    type: 'spend',
    tx: {
      type: 'SpendTx',
    },
  },
  result: false,
}, {
  transaction: {
    tx: {
      arguments: [
        {
          type: 'address',
          value: 'ak_2AVeRypSdS4ZosdKWW1C4avWU4eeC2Yq7oP7guBGy8jkxdYVUy',
        },
        {
          type: 'int',
          value: 1000000000000000000,
        },
      ],
      contractId: 'ct_2qFg7M6MFdQioY3LQMUJh4b4awhK6rsEdi9pCf4cigkmFjQGkv',
      function: 'transfer',
      type: 'ContractCallTx',
    },
  },
  result: true,
}, {
  transaction: {
    pending: true,
    tx: {
      amount: 743000000000000000,
      recipientId: 'nm_UHPJ119gp9HoFJuTxukbP29z52Nm2jHNjJXvfRe77X3X5yXEv',
      senderId: 'ak_BrJErWKWYUNqGcXzDniXf13saPV6H1dsh1NaDsm913vbPGAH6',
      type: 'SpendTx',
    },
  },
  result: false,
}, {
  transaction: {
    amount: 195697771897021980,
    incomplete: true,
    tx: {
      callerId: 'ak_2ZjEWgr4BaLrqEHwRvgWwp4E834xnsknJ1HxSnCkdsHH2Mm5No',
      contractId: 'ct_7tTzPfvv3Vx8pCEcuk1kmgtn4sFsYCQDzLi1LvFs8T5PJqgsC',
      recipientId: 'ak_2AVeRypSdS4ZosdKWW1C4avWU4eeC2Yq7oP7guBGy8jkxdYVUy',
      type: 'ContractCallTx',
    },
  },
  result: true,
}, {
  transaction: {
    amount: 195697771897021980,
    incomplete: true,
    tx: {
      callerId: 'ak_2ZjEWgr4BaLrqEHwRvgWwp4E834xnsknJ1HxSnCkdsHH2Mm5No',
      contractId: 'ct_7tTzPfvv3Vx8pCEcuk1kmgtn4sFsYCQDzLi1LvFs8T5PJqgsC',
      recipientId: 'ak_2AVeRypSdS4ZosdKWW1C4avWU4eeC2Yq7oP7guBGy8jkxdYVUy',
      type: 'contractCallTx', // should be case insensitive
    },
  },
  result: true,
}, {
  transaction: {
    pending: true,
    tx: {
      callerId: 'ak_2AVeRypSdS4ZosdKWW1C4avWU4eeC2Yq7oP7guBGy8jkxdYVUy',
      contractId: 'ct_2qFg7M6MFdQioY3LQMUJh4b4awhK6rsEdi9pCf4cigkmFjQGkv',
      function: 'tip',
      type: 'ContractCallTx',
      selectedTokenContractId: AETERNITY_CONTRACT_ID,
    },
  },
  result: false,
}, {
  transaction: {
    pending: true,
    tx: {
      callerId: 'ak_2AVeRypSdS4ZosdKWW1C4avWU4eeC2Yq7oP7guBGy8jkxdYVUy',
      contractId: 'ct_2qFg7M6MFdQioY3LQMUJh4b4awhK6rsEdi9pCf4cigkmFjQGkv',
      function: 'tip',
      type: 'ContractCallTx',
      selectedTokenContractId: 'ct_7tTzPfvv3Vx8pCEcuk1kmgtn4sFsYCQDzLi1LvFs8T5PJqgsC',
    },
  },
  result: true,
}];

describe('isTransactionAex9', () => {
  it('should return correct result for each type of transaction', () => {
    tests.forEach(
      ({ transaction, result }) => expect(isTransactionAex9(transaction)).toBe(result),
    );
  });
});
