import BigNumber from 'bignumber.js';
import { PROTOCOLS } from '@/constants';
import { STUB_ACCOUNT } from '@/constants/stubs';

/**
 * Each test sends through the UI with every network call of the send path stubbed,
 * captures what the wallet broadcasts and decodes it (`decodeSignedTx` task).
 */

const SOLANA_ADDRESS = 'KL798nyZhQS2iPbW47bcak2eg4aoJo72rNF4SWAGhLd';

const RECIPIENTS = {
  aeternity: 'ak_wMHNCzQJ4HUL3TZ1fi6nQsHg6TjmHLs1bPXSp8iQ1VmxGNAZ4',
  bitcoin: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
  evm: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe',
  solana: 'Fgd99HpSz5aMgPMhTGCU2NPkDyFnQf5ZDyEqcykEL4WQ',
};

const GWEI = new BigNumber(1e9);

const toRpcHex = (value) => `0x${new BigNumber(value).toString(16)}`;

const parseAmount = (text) => new BigNumber(/\d[\d,]*(\.\d+)?/.exec(text)[0].replaceAll(',', ''));

/** Number of a rendered `TokenAmount`, e.g. "0.000231 ETH" -> 0.000231, once above 0 */
function readAmount(selector) {
  return cy.get(`${selector} .amount`)
    .should(($el) => expect(parseAmount($el.text()).toNumber()).to.be.greaterThan(0))
    .then(($el) => parseAmount($el.text()));
}

function waitForAmount(selector, expected, options = {}) {
  cy.get(`${selector} .amount`, options).should(($el) => {
    expect($el.text()).to.match(new RegExp(`^\\s*${expected.toFixed().replace('.', '\\.')}\\s`));
  });
}

function loginWith(protocol) {
  cy.login({
    accountsRaw: [{
      idx: 0, protocol, isRestored: true, type: 'hd-wallet',
    }],
  });
}

/** Typing would add the first prefix that happens to be a valid address as a recipient */
function pasteAddress(address) {
  cy.get('[data-cy=address] [data-cy=textarea]')
    .clear()
    .invoke('val', address)
    .trigger('input');
}

function decodeBroadcast(protocol, raw, additionalData = {}) {
  return cy.task('decodeSignedTx', { protocol, raw, ...additionalData });
}

/** Answers JSON-RPC calls by method; `sendMethod` is the broadcast, aliased `@broadcast`. */
function stubJsonRpc(hostname, results, sendMethod, sendResult) {
  cy.intercept({ method: 'POST', hostname }, (req) => {
    const { id, method } = req.body;
    if (method === sendMethod) {
      // eslint-disable-next-line no-param-reassign
      req.alias = 'broadcast';
      req.reply({ jsonrpc: '2.0', id, result: sendResult });
      return;
    }
    const result = typeof results[method] === 'function'
      ? results[method](req.body.params)
      : results[method];
    req.reply({ jsonrpc: '2.0', id, result: result ?? null });
  });
}

const SEPOLIA = {
  baseFee: GWEI.times(10),
  priorityFee: GWEI,
  nonce: 5,
};

const ERC20_TOKEN = {
  address: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',
  name: 'Test USD',
  symbol: 'TUSD',
  decimals: 6,
};

/** Sepolia node, Ethplorer with a 50 TUSD balance and an empty Etherscan history */
function stubSepolia() {
  const { baseFee, priorityFee, nonce } = SEPOLIA;
  const tokenInfo = {
    address: ERC20_TOKEN.address,
    // Ethplorer sends it as a string
    decimals: String(ERC20_TOKEN.decimals),
    name: ERC20_TOKEN.name,
    symbol: ERC20_TOKEN.symbol,
  };

  stubJsonRpc('ethereum-sepolia-rpc.publicnode.com', {
    eth_chainId: toRpcHex(11155111),
    eth_getBalance: toRpcHex(1e18),
    eth_gasPrice: toRpcHex(baseFee),
    eth_maxPriorityFeePerGas: toRpcHex(priorityFee),
    eth_getTransactionCount: toRpcHex(nonce),
    eth_blockNumber: '0x100',
    eth_getBlockByNumber: {
      number: '0x100',
      hash: `0x${'ab'.repeat(32)}`,
      parentHash: `0x${'cd'.repeat(32)}`,
      timestamp: '0x65000000',
      gasLimit: '0x1c9c380',
      gasUsed: '0x0',
      baseFeePerGas: toRpcHex(baseFee),
      miner: `0x${'00'.repeat(20)}`,
      transactions: [],
    },
    // decimals() of the token
    eth_call: `0x${ERC20_TOKEN.decimals.toString(16).padStart(64, '0')}`,
    // Its 15% headroom is a whole thousand, which the form rounds the gas up to
    eth_estimateGas: toRpcHex(40000),
  }, 'eth_sendRawTransaction', `0x${'12'.repeat(32)}`);
  cy.intercept({ hostname: 'sepolia-api.ethplorer.io', pathname: /^\/getAddressInfo\// }, {
    tokens: [{ rawBalance: '50000000', tokenInfo }],
  });
  cy.intercept({ hostname: 'sepolia-api.ethplorer.io', pathname: '/getTopTokens' }, {
    tokens: [tokenInfo],
  });
  cy.intercept({ hostname: 'api.etherscan.io' }, { status: '0', message: 'No transactions found', result: [] });
}

/** Sender, nonce and the fees the send form showed (aliased `fee` and `maxFee`) */
function expectSepoliaFees(tx, { fee, maxFee }) {
  const gasLimit = new BigNumber(tx.gasLimit);

  expect(tx.type).to.eq(2);
  expect(tx.chainId).to.eq('11155111');
  expect(tx.from).to.eq(STUB_ACCOUNT.addressEthereum.toLowerCase());
  expect(tx.nonce).to.eq(String(SEPOLIA.nonce));
  expect(new BigNumber(tx.maxFeePerGas).times(gasLimit).shiftedBy(-18).toFixed())
    .to.eq(maxFee.toFixed());
  expect(SEPOLIA.baseFee.plus(tx.maxPriorityFeePerGas).times(gasLimit).shiftedBy(-18).toFixed())
    .to.eq(fee.toFixed());
}

describe('Send modal', () => {
  it('sends AE with the fee and nonce shown on the review', () => {
    const nodeHost = 'testnet.aeternity.io';
    const address = STUB_ACCOUNT.addressAeternity;
    const amount = 0.1;
    const txHash = 'th_8WwpJCixn9cKe3jAyXvxNeo5JrBFKj43ULkUeTfeLMqLiZPjj';

    cy.intercept({ method: 'GET', hostname: nodeHost, pathname: `/v3/accounts/${address}` }, {
      headers: { 'content-type': 'application/json' },
      body: `{"id":"${address}","balance":5000000000000000000,"nonce":7,"payable":true,"kind":"basic"}`,
    });
    cy.intercept({ method: 'GET', hostname: nodeHost, pathname: `/v3/accounts/${address}/next-nonce` }, { next_nonce: 8 });
    cy.intercept({ method: 'GET', hostname: nodeHost, pathname: `/v3/accounts/${address}/transactions/pending` }, { transactions: [] });
    cy.intercept({ method: 'GET', hostname: nodeHost, pathname: `/v3/accounts/${RECIPIENTS.aeternity}` }, {
      statusCode: 404,
      body: { reason: 'Account not found' },
    });
    cy.intercept({ method: 'GET', hostname: nodeHost, pathname: '/v3/key-blocks/current/height' }, { height: 1000000 });
    // The SDK uses these endpoints to price transactions. A 404 makes it use
    // its default protocol parameters without making fee estimation depend on
    // the live testnet node.
    cy.intercept({ method: 'GET', hostname: nodeHost, pathname: '/v3/protocol-parameters' }, { statusCode: 404 })
      .as('protocolParameters');
    cy.intercept({ method: 'GET', hostname: nodeHost, pathname: '/v3/node-settings' }, { statusCode: 404 })
      .as('nodeSettings');
    cy.intercept({ method: 'GET', hostname: nodeHost, pathname: '/v3/recent-gas-prices' }, [
      { min_gas_price: 1000000000, minutes: 1, utilization: 70 },
    ]).as('recentGasPrices');
    cy.intercept({ method: 'POST', hostname: nodeHost, pathname: '/v3/transactions' }, { tx_hash: txHash })
      .as('broadcast');
    // Stays in the mempool, so the wallet keeps it pending
    cy.intercept({ method: 'GET', hostname: nodeHost, pathname: `/v3/transactions/${txHash}` }, {
      hash: txHash,
      block_hash: 'none',
      block_height: -1,
      signatures: [],
      tx: {
        type: 'SpendTx',
        version: 1,
        sender_id: address,
        recipient_id: RECIPIENTS.aeternity,
        amount: 100000000000000000,
        fee: 20000000000000,
        ttl: 0,
        nonce: 8,
        payload: 'ba_Xfbg4g==',
      },
    });

    cy.login()
      .openSendModal()

      .get('[data-cy=scan-button]')
      .click()
      .get('.qr-code-scanner video')
      .should('be.visible')
      .get('.qr-code-scanner [data-cy=btn-close]')
      .click()

      .enterInputAmount(amount)
      .get('[data-cy=amount]')
      .should('not.have.class', 'error')
      .enterAddress('asd{enter}')
      .inputShouldHaveError('[data-cy=address]')
      .get('[data-cy=clear-address-button]')
      .first()
      .click()
      .enterAddress(address)
      .get('[data-cy=address]')
      .should('have.class', 'warning')
      .get('[data-cy=clear-address-button]')
      .first()
      .click()
      .enterAddress(RECIPIENTS.aeternity)
      .get('[data-cy=address]')
      .should('not.have.class', 'error')
      .should('not.have.class', 'warning');
    // Fee estimation builds a transaction through the SDK; wait for its node
    // pricing inputs before asserting the asynchronously updated fee in the UI.
    cy.wait(['@protocolParameters', '@nodeSettings', '@recentGasPrices']);
    readAmount('[data-cy=review-fee]');
    cy.get('[data-cy=next-step-button]')
      .should('not.have.class', 'disabled')
      .click()
      .get('[data-cy=review-recipient]')
      .should('contain', RECIPIENTS.aeternity.slice(0, 6))
      .get('[data-cy=accordion-item-label]')
      .contains('Advanced transaction details')
      .click()
      .get('[data-cy=advanced-nonce-input] [data-cy=input]')
      .should('have.value', '8');

    readAmount('[data-cy=review-fee]').then((minimumFee) => {
      cy.wrap(minimumFee.plus(0.00001)).as('fee');
    });
    cy.get('@fee').then((fee) => {
      cy.get('[data-cy=advanced-fee-input] [data-cy=input]')
        .clear()
        .type(fee.toFixed());
      waitForAmount('[data-cy=review-fee]', fee);
      readAmount('[data-cy=review-total]').then((total) => {
        expect(total.minus(fee).toNumber()).to.eq(amount);
      });
    });

    cy.get('[data-cy=next-step-button]').click();

    cy.wait('@broadcast').then(({ request }) => decodeBroadcast('aeternity', request.body.tx))
      .then(function assertTx(tx) {
        expect(tx.tag).to.eq('SpendTx');
        expect(tx.signatures).to.eq(1);
        expect(tx.isSignatureValid).to.eq(true);
        expect(tx.senderId).to.eq(address);
        expect(tx.recipientId).to.eq(RECIPIENTS.aeternity);
        expect(tx.amount).to.eq(new BigNumber(amount).shiftedBy(18).toFixed());
        expect(tx.fee).to.eq(this.fee.shiftedBy(18).toFixed());
        expect(tx.nonce).to.eq(8);
      });
    cy.get('[data-cy=pending-txs]').should('exist');
  });

  it('sends BTC paying the fee shown on the review', () => {
    const nodeUrl = 'https://blockstream.info/testnet/api';
    const address = STUB_ACCOUNT.addressBitcoinTestnet;
    const amount = 0.0005;
    // A 0.002 tBTC output to the account
    const utxo = {
      txid: '17468f904c57f1f3d298b3aa338862b97b80dc5819fc9743bf39d7045d22bfab',
      vout: 0,
      value: 200000,
      hex: '0200000000010107070707070707070707070707070707070707070707070707070707070707070000000000ffffffff01400d03000000000016001405c5643912c1074efaf11d3a431a119eb3a53c3f01010100000000',
    };
    const sentTxId = 'a'.repeat(64);

    cy.intercept('GET', `${nodeUrl}/address/${address}`, {
      address,
      chain_stats: { funded_txo_sum: utxo.value, spent_txo_sum: 0 },
      mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 },
    });
    cy.intercept('GET', `${nodeUrl}/address/${address}/txs*`, []);
    cy.intercept('GET', `${nodeUrl}/address/${address}/utxo`, [{
      txid: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
      status: { confirmed: true, block_height: 100 },
    }]);
    cy.intercept('GET', `${nodeUrl}/tx/${utxo.txid}/hex`, utxo.hex);
    cy.intercept('GET', `${nodeUrl}/fee-estimates`, { 1: 3, 5: 2, 6: 2 });
    cy.intercept('POST', `${nodeUrl}/tx`, sentTxId).as('broadcast');
    cy.intercept('GET', `${nodeUrl}/tx/${sentTxId}`, { statusCode: 404, body: 'Transaction not found' });

    loginWith(PROTOCOLS.bitcoin);
    cy.openSendModal();
    pasteAddress(RECIPIENTS.bitcoin);
    cy.enterInputAmount(amount);
    readAmount('[data-cy=review-fee]');
    cy.get('[data-cy=next-step-button]')
      .should('not.have.class', 'disabled')
      .click();

    readAmount('[data-cy=review-fee]').as('fee');
    cy.get('[data-cy=review-amount]').should('contain', amount);
    cy.get('[data-cy=next-step-button]').click();

    cy.wait('@broadcast').then(({ request }) => decodeBroadcast('bitcoin', request.body, {
      prevouts: [{ txid: utxo.txid, vout: utxo.vout, hex: utxo.hex }],
    }))
      .then(function assertTx(tx) {
        const feeInSats = this.fee.shiftedBy(8).toNumber();
        const [payment, change] = tx.outs;

        expect(tx.ins).to.deep.eq([{ txid: utxo.txid, vout: utxo.vout }]);
        expect(tx.signatureValidity).to.deep.eq([true]);
        expect(payment).to.deep.eq({
          address: RECIPIENTS.bitcoin,
          value: new BigNumber(amount).shiftedBy(8).toFixed(),
        });
        expect(change.address).to.eq(address);
        expect(feeInSats).to.be.greaterThan(0);
        expect(utxo.value - +payment.value - +change.value).to.eq(feeInSats);
      });
    cy.get('[data-cy=pending-txs]').should('exist');
  });

  it('sends ETH with the EIP-1559 fees shown on the form', () => {
    const amount = 0.01;

    stubSepolia();
    loginWith(PROTOCOLS.ethereum);
    cy.openSendModal();
    pasteAddress(RECIPIENTS.evm);
    cy.enterInputAmount(amount);

    // fee: (base fee + priority fee) * 21000 gas, max fee: (2 * base fee + 2 * priority fee) * gas
    waitForAmount('[data-cy=review-fee]', new BigNumber('0.000231'));
    readAmount('[data-cy=review-max-fee]').as('maxFee');
    cy.get('[data-cy=next-step-button]')
      .should('not.have.class', 'disabled')
      .click();

    readAmount('[data-cy=review-fee]').as('fee');
    cy.get('[data-cy=next-step-button]').click();

    cy.wait('@broadcast').then(({ request }) => decodeBroadcast('evm', request.body.params[0]))
      .then(function assertTx(tx) {
        expect(tx.to).to.eq(RECIPIENTS.evm.toLowerCase());
        expect(tx.value).to.eq(new BigNumber(amount).shiftedBy(18).toFixed());
        expect(tx.data).to.eq('');
        expectSepoliaFees(tx, this);
      });
    cy.get('[data-cy=pending-txs]').should('exist');
  });

  it('sends an ERC-20 token with the EIP-1559 fees shown on the form', () => {
    const amount = 0.5;

    stubSepolia();
    loginWith(PROTOCOLS.ethereum);
    cy.openSendModal();
    cy.get('[data-cy=select-asset]').click();
    cy.get('.asset-selector [data-cy=list]').contains(ERC20_TOKEN.name).click();
    pasteAddress(RECIPIENTS.evm);
    cy.enterInputAmount(amount);

    // The token transfer's gas estimate plus 15%, which the form picks up on its 5s polling
    waitForAmount('[data-cy=review-fee]', new BigNumber('0.000506'), { timeout: 10000 });
    readAmount('[data-cy=review-max-fee]').as('maxFee');
    cy.get('[data-cy=next-step-button]')
      .should('not.have.class', 'disabled')
      .click();

    cy.get('[data-cy=review-amount]').should('contain', ERC20_TOKEN.symbol);
    readAmount('[data-cy=review-fee]').as('fee');
    cy.get('[data-cy=next-step-button]').click();

    cy.wait('@broadcast').then(({ request }) => decodeBroadcast('evm', request.body.params[0]))
      .then(function assertTx(tx) {
        const [selector, recipient, tokenAmount] = [
          tx.data.slice(0, 8),
          tx.data.slice(8, 72),
          tx.data.slice(72),
        ];

        expect(tx.to).to.eq(ERC20_TOKEN.address);
        expect(tx.value).to.eq('0');
        // transfer(address,uint256)
        expect(selector).to.eq('a9059cbb');
        expect(`0x${recipient.slice(24)}`).to.eq(RECIPIENTS.evm.toLowerCase());
        expect(new BigNumber(tokenAmount, 16).toFixed())
          .to.eq(new BigNumber(amount).shiftedBy(ERC20_TOKEN.decimals).toFixed());
        expectSepoliaFees(tx, this);
      });
    cy.get('[data-cy=pending-txs]').should('exist');
  });

  it('sends BNB with the legacy gas price shown on the review', () => {
    const gasPrice = GWEI.times(10);
    const amount = 0.01;

    stubJsonRpc('data-seed-prebsc-1-s1.binance.org', {
      eth_chainId: toRpcHex(97),
      eth_getBalance: toRpcHex(1e18),
      eth_gasPrice: toRpcHex(gasPrice),
      eth_getTransactionCount: '0x3',
      eth_blockNumber: '0x100',
    }, 'eth_sendRawTransaction', `0x${'34'.repeat(32)}`);
    cy.intercept({ hostname: 'bnb-testnet.g.alchemy.com' }, {
      jsonrpc: '2.0',
      id: 1,
      result: { address: STUB_ACCOUNT.addressEthereum, tokenBalances: [] },
    });
    cy.intercept({ hostname: 'api.etherscan.io' }, { status: '0', message: 'No transactions found', result: [] });

    loginWith(PROTOCOLS.bnb);
    cy.openSendModal();
    pasteAddress(RECIPIENTS.evm);
    cy.enterInputAmount(amount);

    // The node's gas price plus 10%, for 21000 gas
    waitForAmount('[data-cy=review-fee]', new BigNumber('0.000231'));
    cy.get('[data-cy=next-step-button]')
      .should('not.have.class', 'disabled')
      .click();

    readAmount('[data-cy=review-fee]').as('fee');
    cy.get('[data-cy=next-step-button]').click();

    cy.wait('@broadcast').then(({ request }) => decodeBroadcast('evm', request.body.params[0]))
      .then(function assertTx(tx) {
        expect(tx.type).to.eq(0);
        expect(tx.chainId).to.eq('97');
        expect(tx.from).to.eq(STUB_ACCOUNT.addressEthereum.toLowerCase());
        expect(tx.to).to.eq(RECIPIENTS.evm.toLowerCase());
        expect(tx.value).to.eq(new BigNumber(amount).shiftedBy(18).toFixed());
        expect(tx.nonce).to.eq('3');
        expect(tx.gasPrice).to.eq(
          this.fee.shiftedBy(18).dividedBy(tx.gasLimit).toFixed(),
        );
      });
    cy.get('[data-cy=pending-txs]').should('exist');
  });

  it('sends SOL paying the fee shown on the review', () => {
    const lamportsPerSignature = 5000;
    const amount = 0.01;
    const blockhash = '4Ss5JMkXAD9Z7cktFEdrqeMuT6jGMF1pVozTyPHZ6zT4';
    const context = { slot: 1000 };

    stubJsonRpc('solana-devnet.g.alchemy.com', {
      getBalance: { context, value: 2e9 },
      getLatestBlockhash: { context, value: { blockhash, lastValidBlockHeight: 2000 } },
      getFeeForMessage: { context, value: lamportsPerSignature },
      getMultipleAccountsInfo: (params) => ({ context, value: params[0].map(() => null) }),
      getMinimumBalanceForRentExemption: 890880,
      getTokenAccountsByOwner: { context, value: [] },
      getSignaturesForAddress: [],
      getSignatureStatuses: (params) => ({ context, value: params[0].map(() => null) }),
    }, 'sendTransaction', 'gaiC7Rnf9J6tV3SGwJyzvMDdz9RMmreSWZDyDK682MUB3bdBc5gVodbQCgxJUR7CVEkqMnd9xjWo8q8YP1RYyub');

    loginWith(PROTOCOLS.solana);
    cy.openSendModal();
    pasteAddress(RECIPIENTS.solana);
    cy.enterInputAmount(amount);

    waitForAmount('[data-cy=review-fee]', new BigNumber(lamportsPerSignature).shiftedBy(-9));
    cy.get('[data-cy=next-step-button]')
      .should('not.have.class', 'disabled')
      .click();

    readAmount('[data-cy=review-fee]').as('fee');
    cy.get('[data-cy=next-step-button]').click();

    cy.wait('@broadcast').then(({ request }) => decodeBroadcast('solana', request.body.params[0]))
      .then(function assertTx(tx) {
        expect(tx.feePayer).to.eq(SOLANA_ADDRESS);
        expect(tx.recentBlockhash).to.eq(blockhash);
        expect(tx.isSignatureValid).to.eq(true);
        expect(tx.instructions).to.eq(1);
        expect(tx.transfers).to.deep.eq([{
          from: SOLANA_ADDRESS,
          to: RECIPIENTS.solana,
          lamports: new BigNumber(amount).shiftedBy(9).toFixed(),
        }]);
        // Solana charges per signature, which is the fee the review showed
        expect(tx.signatures * lamportsPerSignature).to.eq(this.fee.shiftedBy(9).toNumber());
      });
    cy.get('[data-cy=pending-txs]').should('exist');
  });
});
