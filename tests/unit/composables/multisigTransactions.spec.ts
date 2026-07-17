// @ts-nocheck
/**
 * `useMultisigTransactions` (src/composables/multisigTransactions.ts) gates real
 * multisig fund movement: `proposeTx`/`callContractMethod` call the on-chain GA
 * multisig contract (propose/confirm/refuse/revoke), and `sendTx` builds the
 * `authorize` calldata that actually authorizes a spend.
 *
 * Mocking boundary:
 *  - `@aeternity/aepp-sdk`'s `Contract.initialize` is mocked (see
 *    `tests/unit/protocols/aeternity/composables/aeAddressLinkContract.spec.js` for
 *    the established pattern of mocking only `Contract` from this package). We
 *    assert on the EXACT arguments passed to the mocked contract-call methods
 *    (method name, tx hash, FixedTTL/expiration height, signer).
 *  - `@/composables/aeSdk` and `@/composables/topHeader` are mocked at their
 *    specific submodule paths per the repo's Vitest ground rules (never mock the
 *    `@/composables` barrel wholesale - it would break real sibling imports).
 *  - `buildAuthTxHash` itself is exercised for real (imported directly from
 *    `@aeternity/aepp-sdk`, un-mocked) against a stubbed `onNode`, because its
 *    determinism/replay-safety property is exactly what this task must verify -
 *    mocking it away would make that assertion meaningless.
 *
 * `MULTISIG_TRANSACTION_EXPIRATION_HEIGHT` (480) and `GA_META_PARAMS`
 * (`{ fee: AE_GET_META_TX_FEE, gasPrice: 1e9 }`) are internal, non-exported
 * constants of the composable (src/composables/multisigTransactions.ts lines 35
 * and 38). They are duplicated here as literals; if they're ever renamed/changed
 * the corresponding assertions below must be updated too.
 */
import {
  buildTx,
  Tag,
  buildAuthTxHash as sdkBuildAuthTxHash,
} from '@aeternity/aepp-sdk';
import { AE_GET_META_TX_FEE } from '@/protocols/aeternity/config';
import SimpleGAMultiSigAci from '@/protocols/aeternity/aci/SimpleGAMultiSigACI.json';

// Valid checksummed `ak_` addresses, reused from
// tests/unit/protocols/aeternity/rebuildTransactionForSigner.spec.ts - real bech32
// decoding is exercised (e.g. by `AccountGeneralized`'s constructor), so these must
// be valid, not just address-shaped placeholders.
const ADDRESS_A = 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR';
const ADDRESS_B = 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E';

const MULTISIG_TRANSACTION_EXPIRATION_HEIGHT = 480;
const GA_META_PARAMS = { fee: AE_GET_META_TX_FEE, gasPrice: 1e9 };

describe('buildAuthTxHash (real aeternity SDK function, not mocked)', () => {
  // Only `getNodeInfo` is used by `buildAuthTxHash` itself; no real network call.
  const fakeNode = {
    getNodeInfo: async () => ({ nodeNetworkId: 'ae_uat', consensusProtocolVersion: 5 }),
  };

  function buildSampleSpendTx(nonce: number) {
    return buildTx({
      tag: Tag.SpendTx,
      senderId: ADDRESS_A,
      recipientId: ADDRESS_B,
      amount: '100',
      nonce,
    });
  }

  it('is deterministic: hashing the same encoded tx twice yields the same hash', async () => {
    const tx = buildSampleSpendTx(1);

    const hash1 = await sdkBuildAuthTxHash(tx, { onNode: fakeNode as any });
    const hash2 = await sdkBuildAuthTxHash(tx, { onNode: fakeNode as any });

    expect(Buffer.compare(hash1, hash2)).toBe(0);
  });

  it('CHANGES when the tx nonce changes - replay-safety property', async () => {
    // A GA multisig spend tx has its nonce embedded in the raw tx bytes that get
    // hashed (see node_modules/@aeternity/aepp-sdk es/contract/ga.js:
    // `hash(concatBuffers([networkId, decode(transaction)]))`), so two proposals
    // that differ only in nonce must never collide to the same auth tx hash -
    // otherwise a stale signature could authorize a different/replayed tx.
    const txNonce1 = buildSampleSpendTx(1);
    const txNonce2 = buildSampleSpendTx(2);

    const hash1 = await sdkBuildAuthTxHash(txNonce1, { onNode: fakeNode as any });
    const hash2 = await sdkBuildAuthTxHash(txNonce2, { onNode: fakeNode as any });

    expect(Buffer.compare(hash1, hash2)).not.toBe(0);
  });

  it('CHANGES when the network id changes - prevents cross-network replay', async () => {
    const tx = buildSampleSpendTx(1);
    const nodeMainnet = { getNodeInfo: async () => ({ nodeNetworkId: 'ae_mainnet', consensusProtocolVersion: 5 }) };
    const nodeTestnet = { getNodeInfo: async () => ({ nodeNetworkId: 'ae_uat', consensusProtocolVersion: 5 }) };

    const hashMainnet = await sdkBuildAuthTxHash(tx, { onNode: nodeMainnet as any });
    const hashTestnet = await sdkBuildAuthTxHash(tx, { onNode: nodeTestnet as any });

    expect(Buffer.compare(hashMainnet, hashTestnet)).not.toBe(0);
  });
});

describe('useMultisigTransactions', () => {
  let mockAeSdk: any;
  let mockDryAeSdk: any;
  let mockGaContractRpc: any;
  let contractInitializeMock: any;
  let fetchCurrentTopBlockHeightMock: any;

  const FIXED_TOP_HEIGHT = 1000;
  const EXPECTED_EXPIRATION = FIXED_TOP_HEIGHT + MULTISIG_TRANSACTION_EXPIRATION_HEIGHT;
  const PROPOSED_TX_HASH_BUFFER = Buffer.from('aa'.repeat(32), 'hex');

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();

    mockGaContractRpc = {
      propose: vi.fn().mockResolvedValue('propose-call-result'),
      confirm: vi.fn().mockResolvedValue('confirm-call-result'),
      refuse: vi.fn().mockResolvedValue('refuse-call-result'),
      revoke: vi.fn().mockResolvedValue('revoke-call-result'),
      _calldata: { encode: vi.fn().mockReturnValue('encoded-authorize-calldata') },
      _name: 'SimpleGAMultiSig',
    };

    contractInitializeMock = vi.fn().mockResolvedValue(mockGaContractRpc);

    // Only `Contract.initialize` is mocked; nothing else from the SDK is needed by
    // the code paths under test (the composable's own imports of `Tag`/`encode`/
    // `Encoding`/`unpackTx`/`AccountGeneralized` are exercised for real).
    vi.doMock('@aeternity/aepp-sdk', async (importOriginal) => {
      const actual = await importOriginal<Record<string, unknown>>();
      return {
        ...actual,
        Contract: { initialize: contractInitializeMock },
      };
    });

    mockAeSdk = {
      buildAuthTxHash: vi.fn().mockResolvedValue(PROPOSED_TX_HASH_BUFFER),
      getContext: vi.fn().mockReturnValue({ onAccount: 'context-account' }),
    };
    mockDryAeSdk = {
      getContext: vi.fn().mockReturnValue({ dry: true }),
      sendTransaction: vi.fn().mockResolvedValue({ hash: 'th_sent' }),
    };

    fetchCurrentTopBlockHeightMock = vi.fn().mockResolvedValue(FIXED_TOP_HEIGHT);

    // These mocks must be registered *before* `registerAdapters` is imported below:
    // the `@/composables` barrel eagerly loads all composables, so `vi.doMock`
    // after that import is too late.
    vi.doMock('@/composables/aeSdk', () => ({
      useAeSdk: () => ({
        getAeSdk: vi.fn().mockResolvedValue(mockAeSdk),
        getDryAeSdk: vi.fn().mockResolvedValue(mockDryAeSdk),
      }),
    }));
    vi.doMock('@/composables/topHeader', () => ({
      useTopHeaderData: () => ({
        fetchCurrentTopBlockHeight: fetchCurrentTopBlockHeightMock,
      }),
    }));

    await import('@/protocols/registerAdapters');
  });

  describe('proposeTx', () => {
    it('passes expirationHeight = currentTopBlockHeight + 480 as FixedTTL to the contract', async () => {
      const { useMultisigTransactions } = await import('@/composables/multisigTransactions');
      const { proposeTx } = useMultisigTransactions();

      await proposeTx('tx_spend' as any, 'ct_contract' as any, { someOption: true });

      expect(fetchCurrentTopBlockHeightMock).toHaveBeenCalled();
      expect(mockGaContractRpc.propose).toHaveBeenCalledWith(
        PROPOSED_TX_HASH_BUFFER,
        { FixedTTL: [EXPECTED_EXPIRATION] },
        { someOption: true },
      );
    });

    it('hashes the spend tx via aeSdk.buildAuthTxHash with the GA meta params before proposing', async () => {
      const { useMultisigTransactions } = await import('@/composables/multisigTransactions');
      const { proposeTx } = useMultisigTransactions();

      await proposeTx('tx_spend' as any, 'ct_contract' as any);

      expect(mockAeSdk.buildAuthTxHash).toHaveBeenCalledWith('tx_spend', GA_META_PARAMS);
    });

    it('initializes the GA multisig contract instance at the given contract address', async () => {
      const { useMultisigTransactions } = await import('@/composables/multisigTransactions');
      const { proposeTx } = useMultisigTransactions();

      await proposeTx('tx_spend' as any, 'ct_contract' as any);

      expect(contractInitializeMock).toHaveBeenCalledWith(expect.objectContaining({
        aci: SimpleGAMultiSigAci,
        address: 'ct_contract',
      }));
    });

    it('returns the hex-encoded spend tx hash alongside the raw contract call result', async () => {
      const { useMultisigTransactions } = await import('@/composables/multisigTransactions');
      const { proposeTx } = useMultisigTransactions();

      const result = await proposeTx('tx_spend' as any, 'ct_contract' as any);

      expect(result.proposeTxHash).toBe(PROPOSED_TX_HASH_BUFFER.toString('hex'));
      expect(result.callResult).toBe('propose-call-result');
    });

    it('defaults options to {} when none are given', async () => {
      const { useMultisigTransactions } = await import('@/composables/multisigTransactions');
      const { proposeTx } = useMultisigTransactions();

      await proposeTx('tx_spend' as any, 'ct_contract' as any);

      expect(mockGaContractRpc.propose).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        {},
      );
    });
  });

  describe('callContractMethod (confirm / refuse / revoke)', () => {
    it.each([
      ['confirm'],
      ['refuse'],
      ['revoke'],
    ])('invokes exactly the "%s" method on the GA multisig contract, never the other two', async (action) => {
      const { useMultisigTransactions } = await import('@/composables/multisigTransactions');
      const { callContractMethod } = useMultisigTransactions();

      await callContractMethod(action as any, 'ct_contract' as any, 'spend-tx-hash-hex');

      expect(mockGaContractRpc[action]).toHaveBeenCalledWith(
        'spend-tx-hash-hex',
        { FixedTTL: [EXPECTED_EXPIRATION] },
      );
      ['confirm', 'refuse', 'revoke']
        .filter((other) => other !== action)
        .forEach((other) => expect(mockGaContractRpc[other]).not.toHaveBeenCalled());
    });

    it('passes the chosen signer account through to the contract call via options.onAccount', async () => {
      const { useMultisigTransactions } = await import('@/composables/multisigTransactions');
      const { callContractMethod } = useMultisigTransactions();

      await callContractMethod(
        'confirm',
        'ct_contract' as any,
        'spend-tx-hash-hex',
        { onAccount: ADDRESS_A },
      );

      expect(mockGaContractRpc.confirm).toHaveBeenCalledWith(
        'spend-tx-hash-hex',
        { FixedTTL: [EXPECTED_EXPIRATION], onAccount: ADDRESS_A },
      );
    });

    it('lets caller-supplied options override the locally computed FixedTTL', async () => {
      const { useMultisigTransactions } = await import('@/composables/multisigTransactions');
      const { callContractMethod } = useMultisigTransactions();

      await callContractMethod(
        'confirm',
        'ct_contract' as any,
        'spend-tx-hash-hex',
        { FixedTTL: ['custom-ttl'] },
      );

      expect(mockGaContractRpc.confirm).toHaveBeenCalledWith(
        'spend-tx-hash-hex',
        { FixedTTL: ['custom-ttl'] },
      );
    });
  });

  describe('expiration-height handling', () => {
    it('recomputes FixedTTL fresh from the CURRENT chain height on every call', async () => {
      const { useMultisigTransactions } = await import('@/composables/multisigTransactions');
      const { callContractMethod } = useMultisigTransactions();

      fetchCurrentTopBlockHeightMock.mockResolvedValueOnce(5000);
      await callContractMethod('confirm', 'ct_contract' as any, 'hash-a');
      expect(mockGaContractRpc.confirm).toHaveBeenLastCalledWith(
        'hash-a',
        { FixedTTL: [5000 + MULTISIG_TRANSACTION_EXPIRATION_HEIGHT] },
      );

      fetchCurrentTopBlockHeightMock.mockResolvedValueOnce(9000);
      await callContractMethod('confirm', 'ct_contract' as any, 'hash-b');
      expect(mockGaContractRpc.confirm).toHaveBeenLastCalledWith(
        'hash-b',
        { FixedTTL: [9000 + MULTISIG_TRANSACTION_EXPIRATION_HEIGHT] },
      );
    });

    /**
     * NOTE (not encoded as an it.fails - see report): `callContractMethod` has NO
     * local "is this proposal already expired" guard of its own. It always
     * proceeds to call the contract, no matter how far the current chain height is
     * past a proposal's known `expirationHeight`. This is safe in practice ONLY
     * because the UI layer gates it independently:
     *   - src/composables/pendingMultisigTransaction.ts `pendingMultisigTxExpired`
     *     (`topBlockHeight.value >= activeMultisigAccount.value.expirationHeight`)
     *   - src/popup/pages/MultisigProposalDetails.vue disables the "sign"/"send"
     *     buttons with `:disabled="... || pendingMultisigTxExpired"` (lines ~210,
     *     ~223).
     * The "refuse" and "revoke" buttons in that same file are NOT disabled by
     * `pendingMultisigTxExpired` - refusing/revoking an expired proposal is
     * harmless (no fund movement) so this is not flagged as a bug, but it means
     * this composable function must never be called directly for `confirm`
     * without that external check; a future caller that skips the UI guard (e.g.
     * a new automated/CLI flow) would silently attempt to confirm an expired
     * proposal here with no defense in depth.
     */
    it('does NOT block a confirm call itself when the chain height is already far past a stale proposal height (no local expiry guard - see note above)', async () => {
      const { useMultisigTransactions } = await import('@/composables/multisigTransactions');
      const { callContractMethod } = useMultisigTransactions();

      // Chain height is now 5000; a proposal that expired at (e.g.) height 1200
      // would be well past its expiration, yet the composable still dispatches.
      fetchCurrentTopBlockHeightMock.mockResolvedValueOnce(5000);

      await callContractMethod('confirm', 'ct_contract' as any, 'expired-proposal-hash');

      expect(mockGaContractRpc.confirm).toHaveBeenCalledWith(
        'expired-proposal-hash',
        { FixedTTL: [5000 + MULTISIG_TRANSACTION_EXPIRATION_HEIGHT] },
      );
    });
  });

  describe('sendTx', () => {
    it('builds the GA "authorize" calldata with the given nonce and sends it via the dry (no-account) SDK', async () => {
      const { useMultisigTransactions } = await import('@/composables/multisigTransactions');
      const { sendTx } = useMultisigTransactions();

      await sendTx(ADDRESS_A as any, 'tx_spend' as any, 7);

      expect(contractInitializeMock).toHaveBeenCalledWith(expect.objectContaining({
        bytecode: expect.any(String),
      }));
      expect(mockGaContractRpc._calldata.encode).toHaveBeenCalledWith('SimpleGAMultiSig', 'authorize', [7]);
      expect(mockDryAeSdk.sendTransaction).toHaveBeenCalledWith('tx_spend', {
        authData: { callData: 'encoded-authorize-calldata', ...GA_META_PARAMS },
        onAccount: expect.objectContaining({ address: ADDRESS_A }),
      });
    });

    it('CHANGES the encoded authorize calldata when the nonce changes - the same replay-safety property as buildAuthTxHash', async () => {
      const { useMultisigTransactions } = await import('@/composables/multisigTransactions');
      const { sendTx } = useMultisigTransactions();

      await sendTx(ADDRESS_A as any, 'tx_spend' as any, 1);
      await sendTx(ADDRESS_A as any, 'tx_spend' as any, 2);

      expect(mockGaContractRpc._calldata.encode).toHaveBeenNthCalledWith(1, 'SimpleGAMultiSig', 'authorize', [1]);
      expect(mockGaContractRpc._calldata.encode).toHaveBeenNthCalledWith(2, 'SimpleGAMultiSig', 'authorize', [2]);
    });

    it('uses an AccountGeneralized signer whose address is the given accountId (never the caller-provided default account)', async () => {
      const { useMultisigTransactions } = await import('@/composables/multisigTransactions');
      const { sendTx } = useMultisigTransactions();

      await sendTx(ADDRESS_B as any, 'tx_spend' as any, 1);

      const [, sendOptions] = mockDryAeSdk.sendTransaction.mock.calls[0];
      expect(sendOptions.onAccount.address).toBe(ADDRESS_B);
    });
  });
});
