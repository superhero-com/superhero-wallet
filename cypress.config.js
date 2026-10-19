// eslint-disable-next-line import/no-extraneous-dependencies
const { defineConfig } = require('cypress');

/** JSON-safe copy: bigints become decimal strings. */
const toPlain = (value) => JSON.parse(JSON.stringify(
  value,
  (_, v) => (typeof v === 'bigint' ? v.toString() : v),
));

/**
 * Decodes a signed transaction captured from a stubbed broadcast,
 * with the same libraries the wallet signs it with.
 */
async function decodeSignedTx({ protocol, raw }) {
  switch (protocol) {
    case 'aeternity': {
      const { unpackTx, Tag } = await import('@aeternity/aepp-sdk');
      const { encodedTx, signatures } = unpackTx(raw, Tag.SignedTx);
      return toPlain({ ...encodedTx, tag: Tag[encodedTx.tag], signatures: signatures.length });
    }
    case 'bitcoin': {
      const { Transaction, address, networks } = await import('bitcoinjs-lib');
      const tx = Transaction.fromHex(raw);
      return toPlain({
        ins: tx.ins.map(({ hash, index }) => ({
          txid: Buffer.from(hash).reverse().toString('hex'),
          vout: index,
        })),
        outs: tx.outs.map(({ script, value }) => ({
          address: address.fromOutputScript(script, networks.testnet),
          value,
        })),
      });
    }
    case 'evm': {
      const { TransactionFactory } = await import('@ethereumjs/tx');
      const tx = TransactionFactory.fromSerializedData(Buffer.from(raw.replace(/^0x/, ''), 'hex'));
      return toPlain({
        type: tx.type,
        chainId: tx.common.chainId(),
        from: tx.getSenderAddress().toString(),
        to: tx.to?.toString(),
        nonce: tx.nonce,
        value: tx.value,
        gasLimit: tx.gasLimit,
        gasPrice: tx.gasPrice,
        maxFeePerGas: tx.maxFeePerGas,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
        data: Buffer.from(tx.data).toString('hex'),
      });
    }
    case 'solana': {
      const { Transaction, SystemInstruction, SystemProgram } = await import('@solana/web3.js');
      const tx = Transaction.from(Buffer.from(raw, 'base64'));
      return toPlain({
        feePayer: tx.feePayer.toBase58(),
        recentBlockhash: tx.recentBlockhash,
        signatures: tx.signatures.length,
        isSignatureValid: tx.verifySignatures(),
        transfers: tx.instructions
          .filter(({ programId }) => programId.equals(SystemProgram.programId))
          .map((instruction) => {
            const { fromPubkey, toPubkey, lamports } = SystemInstruction
              .decodeTransfer(instruction);
            return { from: fromPubkey.toBase58(), to: toPubkey.toBase58(), lamports };
          }),
        instructions: tx.instructions.length,
      });
    }
    default:
      throw new Error(`Unknown protocol: ${protocol}`);
  }
}

module.exports = defineConfig({
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1',
  video: false,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  // Ensure Cypress waits long enough for initial webpack compile
  pageLoadTimeout: 120000,
  requestTimeout: 120000,
  fixturesFolder: 'tests/e2e/fixtures',
  screenshotsFolder: 'tests/e2e/screenshots',
  videosFolder: 'tests/e2e/videos',
  e2e: {
    specPattern: process.env.E2E_SPEC_PATTERN || 'tests/e2e/integration/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'tests/e2e/support/index.js',
    experimentalRunAllSpecs: true,
    baseUrl: 'http://localhost:8080',
    excludeSpecPattern: [
      'tests/e2e/integration/transaction-details.cy.js',
    ],
    setupNodeEvents(on) {
      on('task', { decodeSignedTx });
    },
  },
  viewportHeight: 660,
  viewportWidth: 420,
});
