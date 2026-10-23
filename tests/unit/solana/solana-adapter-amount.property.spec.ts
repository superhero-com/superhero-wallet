import fc from 'fast-check';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { amountWithBaseUnits } from '../../fixtures/amountArbitraries';

// The setup files already evaluated the adapters against the real composables.
vi.hoisted(() => vi.resetModules());

const sender = Keypair.generate();

vi.mock('@/composables/accounts', () => ({
  useAccounts: () => ({
    getAccountByProtocolAndAddress: (_protocol: string, address: string) => ({
      address,
      protocol: 'solana',
      secretKey: Array.from(sender.secretKey),
    }),
  }),
}));

const fromAccount = sender.publicKey.toBase58();
const mint = Keypair.generate().publicKey;

function decodeSolTransfers(raw: Buffer | Uint8Array) {
  return Transaction.from(raw).instructions
    .filter((ix) => ix.programId.equals(SystemProgram.programId))
    .map((ix) => Buffer.from(ix.data).readBigUInt64LE(4));
}

function decodeTokenTransfers(raw: Buffer | Uint8Array) {
  return Transaction.from(raw).instructions
    .filter((ix) => ix.programId.equals(TOKEN_PROGRAM_ID))
    .map((ix) => Buffer.from(ix.data).readBigUInt64LE(1));
}

function createConnection() {
  return {
    getLatestBlockhash: vi.fn(() => Promise.resolve({
      blockhash: Keypair.generate().publicKey.toBase58(),
      lastValidBlockHeight: 1,
    })),
    getFeeForMessage: vi.fn(() => Promise.resolve({ value: 5000 })),
    getBalance: vi.fn(() => Promise.resolve(2 ** 60)),
    getMultipleAccountsInfo: vi.fn((keys: PublicKey[]) => Promise.resolve(keys.map(() => ({
      lamports: 1e9, owner: SystemProgram.programId, data: Buffer.alloc(0),
    })))),
    getMinimumBalanceForRentExemption: vi.fn(() => Promise.resolve(890_880)),
    getParsedAccountInfo: vi.fn(() => Promise.resolve({ value: { data: {} } })),
    getParsedTokenAccountsByOwner: vi.fn(() => Promise.resolve({
      value: [{ pubkey: Keypair.generate().publicKey }],
    })),
    sendRawTransaction: vi.fn(() => Promise.resolve('signature')),
  };
}

async function createAdapter() {
  const { SolanaAdapter } = await import('@/protocols/solana/libs/SolanaAdapter');
  const adapter = new SolanaAdapter();
  const conn = createConnection();
  vi.spyOn(adapter as any, 'getConnection').mockReturnValue(conn);
  return { adapter, conn };
}

// Below 2^23 SOL every amount with 9 decimals is its own double (the form hands numbers over).
const solAmount = amountWithBaseUnits(9, 2n ** 23n - 1n)
  .filter(({ baseUnits }) => baseUnits > 0n);

describe('SolanaAdapter - amounts (property)', () => {
  it('spend signs the exact lamports', async () => {
    const { adapter, conn } = await createAdapter();

    await fc.assert(fc.asyncProperty(solAmount, async ({ amount, baseUnits }) => {
      conn.sendRawTransaction.mockClear();
      const recipient = Keypair.generate().publicKey.toBase58();

      await adapter.spend(Number(amount), recipient, { fromAccount });

      expect(decodeSolTransfers(conn.sendRawTransaction.mock.calls[0][0])).toEqual([baseUnits]);
    }), { numRuns: 200 });
  });

  it('spendBatch signs the exact lamports for each recipient', async () => {
    const { adapter, conn } = await createAdapter();

    await fc.assert(fc.asyncProperty(solAmount, async ({ amount, baseUnits }) => {
      conn.sendRawTransaction.mockClear();
      const recipients = [Keypair.generate(), Keypair.generate()]
        .map((k) => k.publicKey.toBase58());

      await adapter.spendBatch(Number(amount), recipients, { fromAccount });

      expect(decodeSolTransfers(conn.sendRawTransaction.mock.calls[0][0]))
        .toEqual([baseUnits, baseUnits]);
    }), { numRuns: 100 });
  });

  it.each([0, 6, 8, 9])('transferToken signs the exact base units at %i decimals', async (decimals) => {
    const { adapter, conn } = await createAdapter();
    // SPL amounts are u64.
    const maxWhole = (2n ** 64n - 1n) / 10n ** BigInt(decimals) - 1n;

    await fc.assert(fc.asyncProperty(
      amountWithBaseUnits(decimals, maxWhole).filter(({ baseUnits }) => baseUnits > 0n),
      async ({ amount, baseUnits }) => {
        conn.sendRawTransaction.mockClear();
        const recipient = Keypair.generate().publicKey.toBase58();

        await adapter.transferToken(
          amount,
          recipient,
          mint.toBase58(),
          { fromAccount, decimals } as any,
        );

        expect(decodeTokenTransfers(conn.sendRawTransaction.mock.calls[0][0])).toEqual([baseUnits]);
      },
    ), { numRuns: 50 });
  });
});
