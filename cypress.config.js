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
async function decodeSignedTx({ protocol, raw, prevouts = [] }) {
  switch (protocol) {
    case 'aeternity': {
      const {
        unpackTx, Tag, rebuildUnpackedTx, decode, hash, verifySignature,
      } = await import('@aeternity/aepp-sdk');
      const { encodedTx, signatures } = unpackTx(raw, Tag.SignedTx);
      const unsignedTx = decode(rebuildUnpackedTx(encodedTx));
      const prefix = Buffer.from('ae_uat');
      const isSignatureValid = signatures.length === 1 && (
        verifySignature(Buffer.concat([prefix, unsignedTx]), signatures[0], encodedTx.senderId)
        || verifySignature(
          Buffer.concat([prefix, hash(unsignedTx)]),
          signatures[0],
          encodedTx.senderId,
        )
      );
      return toPlain({
        ...encodedTx,
        tag: Tag[encodedTx.tag],
        signatures: signatures.length,
        isSignatureValid,
      });
    }
    case 'bitcoin': {
      const {
        Transaction, address, networks, payments, script,
      } = await import('bitcoinjs-lib');
      const ecc = await import('@bitcoinerlab/secp256k1');
      const tx = Transaction.fromHex(raw);
      const signatureValidity = tx.ins.map((input, inputIndex) => {
        const previousOutput = prevouts.find(({ txid, vout }) => (
          txid === Buffer.from(input.hash).reverse().toString('hex') && vout === input.index
        ));
        if (!previousOutput) return false;

        const previousTx = Transaction.fromHex(previousOutput.hex);
        const output = previousTx.outs[previousOutput.vout];
        const [witnessSignature, publicKey] = input.witness;
        if (!output || !witnessSignature || !publicKey) return false;

        const key = Buffer.from(publicKey);
        const p2wpkh = payments.p2wpkh({ pubkey: key, network: networks.testnet });
        if (!p2wpkh.output || !Buffer.from(output.script).equals(Buffer.from(p2wpkh.output))) {
          return false;
        }
        const p2pkh = payments.p2pkh({ pubkey: key, network: networks.testnet });
        if (!p2pkh.output) return false;
        const decoded = script.signature.decode(Buffer.from(witnessSignature));
        const sighash = tx.hashForWitnessV0(
          inputIndex,
          p2pkh.output,
          output.value,
          decoded.hashType,
        );
        return ecc.verify(sighash, key, decoded.signature);
      });
      return toPlain({
        ins: tx.ins.map(({ hash, index }) => ({
          txid: Buffer.from(hash).reverse().toString('hex'),
          vout: index,
        })),
        outs: tx.outs.map(({ script: outputScript, value }) => ({
          address: address.fromOutputScript(outputScript, networks.testnet),
          value,
        })),
        signatureValidity,
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
