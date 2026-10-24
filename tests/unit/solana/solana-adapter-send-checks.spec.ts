import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';

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

const RENT_EXEMPT_MIN = 890_880;
const BLOCKHASH = Keypair.generate().publicKey.toBase58();
const SPL_TRANSFER_CHECKED = 12;

const mint = Keypair.generate().publicKey;
const ownerTokenAccount = Keypair.generate().publicKey;

function decodeTokenTransfers(raw: Buffer | Uint8Array) {
  return Transaction.from(raw).instructions
    .filter((ix) => ix.programId.equals(TOKEN_PROGRAM_ID))
    .map((ix) => ({
      kind: ix.data[0],
      amount: Buffer.from(ix.data).readBigUInt64LE(1),
      decimals: ix.data[9],
      mint: ix.keys[1].pubkey.toBase58(),
    }));
}

function decodeSolTransfers(raw: Buffer | Uint8Array) {
  return Transaction.from(raw).instructions
    .filter((ix) => ix.programId.equals(SystemProgram.programId))
    .map((ix) => Buffer.from(ix.data).readBigUInt64LE(4));
}

function systemAccount(lamports: number) {
  return { lamports, owner: SystemProgram.programId, data: Buffer.alloc(0) };
}

function createConnection(overrides: Record<string, any> = {}) {
  return {
    getLatestBlockhash: vi.fn(() => Promise.resolve({
      blockhash: BLOCKHASH,
      lastValidBlockHeight: 1,
    })),
    getFeeForMessage: vi.fn(() => Promise.resolve({ value: 5000 })),
    getBalance: vi.fn(() => Promise.resolve(10_000_000_000)),
    getMultipleAccountsInfo: vi.fn((keys: PublicKey[]) => Promise.resolve(
      keys.map(() => systemAccount(RENT_EXEMPT_MIN)),
    )),
    getMinimumBalanceForRentExemption: vi.fn((size: number) => Promise.resolve(
      size === 0 ? RENT_EXEMPT_MIN : 2_039_280,
    )),
    getParsedAccountInfo: vi.fn(() => Promise.resolve({ value: { data: {} } })),
    getParsedTokenAccountsByOwner: vi.fn(() => Promise.resolve({
      value: [{ pubkey: ownerTokenAccount }],
    })),
    sendRawTransaction: vi.fn(() => Promise.resolve('signature')),
    ...overrides,
  };
}

async function createAdapter(conn: ReturnType<typeof createConnection>) {
  const { SolanaAdapter } = await import('@/protocols/solana/libs/SolanaAdapter');
  const adapter = new SolanaAdapter();
  vi.spyOn(adapter as any, 'getConnection').mockReturnValue(conn);
  return adapter;
}

const fromAccount = sender.publicKey.toBase58();

describe('SolanaAdapter - token transfers', () => {
  it('sends a checked transfer with the decimals passed by the form', async () => {
    const conn = createConnection({
      getParsedAccountInfo: vi.fn((pk: PublicKey) => (pk.equals(mint)
        ? Promise.reject(new Error('RPC down'))
        : Promise.resolve({ value: { data: {} } }))),
    });
    const adapter = await createAdapter(conn);
    // The token list can be wrong; the form's decimals win.
    (adapter as any).tokenListCache = [{ contractId: mint.toBase58(), decimals: 9 }];
    const recipient = Keypair.generate().publicKey.toBase58();

    await adapter.transferToken('1', recipient, mint.toBase58(), { fromAccount, decimals: 6 } as any);

    expect(decodeTokenTransfers(conn.sendRawTransaction.mock.calls[0][0])).toEqual([{
      kind: SPL_TRANSFER_CHECKED,
      amount: 1_000_000n,
      decimals: 6,
      mint: mint.toBase58(),
    }]);
    // From the sender's token account to the recipient's associated one
    const [{ keys }] = Transaction.from(conn.sendRawTransaction.mock.calls[0][0]).instructions
      .filter((ix) => ix.programId.equals(TOKEN_PROGRAM_ID));
    expect(keys[0].pubkey.toBase58()).toBe(ownerTokenAccount.toBase58());
    expect(keys[2].pubkey.toBase58())
      .toBe(getAssociatedTokenAddressSync(mint, new PublicKey(recipient)).toBase58());
  });

  it('sends a token with 0 decimals without reading the mint', async () => {
    const conn = createConnection();
    const adapter = await createAdapter(conn);

    await adapter.transferToken('5', Keypair.generate().publicKey.toBase58(), mint.toBase58(), { fromAccount, decimals: 0 } as any);

    expect(decodeTokenTransfers(conn.sendRawTransaction.mock.calls[0][0])).toEqual([{
      kind: SPL_TRANSFER_CHECKED,
      amount: 5n,
      decimals: 0,
      mint: mint.toBase58(),
    }]);
    expect(conn.getParsedAccountInfo.mock.calls.some(([pk]) => pk.equals(mint))).toBe(false);
  });

  it('reads the decimals from the mint when the form does not pass them', async () => {
    const conn = createConnection({
      getParsedAccountInfo: vi.fn((pk: PublicKey) => Promise.resolve(pk.equals(mint)
        ? { value: { data: { parsed: { info: { decimals: 6 } } } } }
        : { value: { data: {} } })),
    });
    const adapter = await createAdapter(conn);

    await adapter.transferToken('1', Keypair.generate().publicKey.toBase58(), mint.toBase58(), { fromAccount });

    const [transfer] = decodeTokenTransfers(conn.sendRawTransaction.mock.calls[0][0]);
    expect(transfer.amount).toBe(1_000_000n);
  });

  it('takes the token list decimals without reading the mint when the form does not pass them', async () => {
    const conn = createConnection({
      getParsedAccountInfo: vi.fn((pk: PublicKey) => (pk.equals(mint)
        ? Promise.reject(new Error('RPC down'))
        : Promise.resolve({ value: { data: {} } }))),
    });
    const adapter = await createAdapter(conn);
    (adapter as any).tokenListCache = [{ contractId: mint.toBase58(), decimals: 6 }];

    await adapter.transferToken('1', Keypair.generate().publicKey.toBase58(), mint.toBase58(), { fromAccount });

    expect(decodeTokenTransfers(conn.sendRawTransaction.mock.calls[0][0])).toEqual([{
      kind: SPL_TRANSFER_CHECKED,
      amount: 1_000_000n,
      decimals: 6,
      mint: mint.toBase58(),
    }]);
  });

  it('refuses to send when the decimals are unknown', async () => {
    const conn = createConnection({
      getParsedAccountInfo: vi.fn((pk: PublicKey) => (pk.equals(mint)
        ? Promise.reject(new Error('RPC down'))
        : Promise.resolve({ value: { data: {} } }))),
    });
    const adapter = await createAdapter(conn);

    await expect(adapter.transferToken('1', Keypair.generate().publicKey.toBase58(), mint.toBase58(), { fromAccount }))
      .rejects.toThrow(/Could not read the decimals/);
    expect(conn.sendRawTransaction).not.toHaveBeenCalled();
  });

  it('sends checked transfers in a batch', async () => {
    const conn = createConnection();
    const adapter = await createAdapter(conn);
    const recipients = [Keypair.generate(), Keypair.generate()].map((k) => k.publicKey.toBase58());

    await adapter.transferTokenBatch('2.5', recipients, mint.toBase58(), { fromAccount, decimals: 6 } as any);

    expect(decodeTokenTransfers(conn.sendRawTransaction.mock.calls[0][0])).toEqual(
      recipients.map(() => ({
        kind: SPL_TRANSFER_CHECKED,
        amount: 2_500_000n,
        decimals: 6,
        mint: mint.toBase58(),
      })),
    );
  });

  it('batch rejects with "Insufficient SOL" when the new token accounts cannot be paid', async () => {
    const conn = createConnection({
      getMultipleAccountsInfo: vi.fn((keys: PublicKey[]) => Promise.resolve(keys.map(() => null))),
      getBalance: vi.fn(() => Promise.resolve(0)),
    });
    const adapter = await createAdapter(conn);

    await expect(adapter.transferTokenBatch(
      '1',
      [Keypair.generate().publicKey.toBase58()],
      mint.toBase58(),
      { fromAccount, decimals: 6 } as any,
    )).rejects.toThrow(/Insufficient SOL/);
    expect(conn.sendRawTransaction).not.toHaveBeenCalled();
  });
});

describe('SolanaAdapter - SOL transfers', () => {
  const rentError = /Solana accounts must hold at least 0\.00089088 SOL\. Send at least 0\.00089088 SOL to/;

  it('spendBatch rejects with "Insufficient SOL" when the balance is too low', async () => {
    const conn = createConnection({ getBalance: vi.fn(() => Promise.resolve(0)) });
    const adapter = await createAdapter(conn);

    const recipient = Keypair.generate().publicKey.toBase58();
    await expect(adapter.spendBatch(0.5, [recipient], { fromAccount }))
      .rejects.toThrow(/Insufficient SOL/);
    expect(conn.sendRawTransaction).not.toHaveBeenCalled();
  });

  it('spendBatch refuses to leave a new recipient below the rent-exempt minimum', async () => {
    const conn = createConnection({
      getMultipleAccountsInfo: vi.fn((keys: PublicKey[]) => Promise.resolve(
        keys.map((_, idx) => (idx ? null : systemAccount(RENT_EXEMPT_MIN))),
      )),
    });
    const adapter = await createAdapter(conn);
    const recipients = [Keypair.generate(), Keypair.generate()].map((k) => k.publicKey.toBase58());

    await expect(adapter.spendBatch(0.0001, recipients, { fromAccount }))
      .rejects.toThrow(new RegExp(`${rentError.source} ${recipients[1]}`));
    expect(conn.sendRawTransaction).not.toHaveBeenCalled();
  });

  it('spend refuses to leave a new recipient below the rent-exempt minimum', async () => {
    const conn = createConnection({
      getMultipleAccountsInfo: vi.fn(() => Promise.resolve([null])),
    });
    const adapter = await createAdapter(conn);

    await expect(adapter.spend(0.0001, Keypair.generate().publicKey.toBase58(), { fromAccount }))
      .rejects.toThrow(rentError);
    expect(conn.sendRawTransaction).not.toHaveBeenCalled();
  });

  it('spend asks only for the missing part of the minimum', async () => {
    const conn = createConnection({
      getMultipleAccountsInfo: vi.fn(() => Promise.resolve([systemAccount(890_000)])),
    });
    const adapter = await createAdapter(conn);

    const recipient = Keypair.generate().publicKey.toBase58();
    await expect(adapter.spend(0.00000001, recipient, { fromAccount }))
      .rejects.toThrow(/Send at least 0\.00000088 SOL/);
  });

  it('spend sends to a recipient that stays rent-exempt', async () => {
    const conn = createConnection();
    const adapter = await createAdapter(conn);

    const recipient = Keypair.generate().publicKey.toBase58();
    const res = await adapter.spend(0.0001, recipient, { fromAccount });

    expect(res).toEqual({ hash: 'signature' });
    expect(decodeSolTransfers(conn.sendRawTransaction.mock.calls[0][0])).toEqual([100_000n]);
  });

  it('spend sends exactly the minimum to a new recipient', async () => {
    const conn = createConnection({
      getMultipleAccountsInfo: vi.fn(() => Promise.resolve([null])),
    });
    const adapter = await createAdapter(conn);

    await adapter.spend(0.00089088, Keypair.generate().publicKey.toBase58(), { fromAccount });

    expect(decodeSolTransfers(conn.sendRawTransaction.mock.calls[0][0])).toEqual([890_880n]);
  });

  it('spend holds a recipient with data to the minimum for its size', async () => {
    const conn = createConnection({
      getMultipleAccountsInfo: vi.fn(() => Promise.resolve([
        { lamports: 2_000_000, owner: TOKEN_PROGRAM_ID, data: Buffer.alloc(165) },
      ])),
    });
    const adapter = await createAdapter(conn);

    await expect(adapter.spend(0.00001, Keypair.generate().publicKey.toBase58(), { fromAccount }))
      .rejects.toThrow(/at least 0\.00203928 SOL\. Send at least 0\.00003928 SOL/);
    expect(conn.sendRawTransaction).not.toHaveBeenCalled();
  });

  it('spend still sends when the recipient cannot be read', async () => {
    const conn = createConnection({
      getMultipleAccountsInfo: vi.fn(() => Promise.reject(new Error('RPC down'))),
    });
    const adapter = await createAdapter(conn);

    await adapter.spend(0.0001, Keypair.generate().publicKey.toBase58(), { fromAccount });

    expect(decodeSolTransfers(conn.sendRawTransaction.mock.calls[0][0])).toEqual([100_000n]);
  });

  describe('to the incinerator, which the chain never holds to the minimum', () => {
    const INCINERATOR = '1nc1nerator11111111111111111111111111111111';
    const newAccounts = () => createConnection({
      getMultipleAccountsInfo: vi.fn((keys: PublicKey[]) => Promise.resolve(keys.map(() => null))),
    });

    it('spend sends 1 lamport', async () => {
      const conn = newAccounts();
      const adapter = await createAdapter(conn);

      await adapter.spend(0.000000001, INCINERATOR, { fromAccount });

      expect(decodeSolTransfers(conn.sendRawTransaction.mock.calls[0][0])).toEqual([1n]);
    });

    it('spendBatch still names the other recipient left below the minimum', async () => {
      const conn = newAccounts();
      const adapter = await createAdapter(conn);
      const recipient = Keypair.generate().publicKey.toBase58();

      await expect(adapter.spendBatch(0.0001, [INCINERATOR, recipient], { fromAccount }))
        .rejects.toThrow(new RegExp(`${rentError.source} ${recipient}`));
      expect(conn.sendRawTransaction).not.toHaveBeenCalled();
    });
  });
});
