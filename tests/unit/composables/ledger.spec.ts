// @ts-nocheck
const ADDRESS = 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR';

describe('useLedger', () => {
  let transport;
  let ledgerAccount;
  let accountFactory;

  beforeEach(() => {
    vi.resetModules();
    transport = { close: vi.fn().mockResolvedValue(undefined) };
    ledgerAccount = {
      signMessage: vi.fn().mockResolvedValue(new Uint8Array([1])),
      signTransaction: vi.fn().mockResolvedValue('tx_signed'),
    };
    accountFactory = {
      initialize: vi.fn().mockResolvedValue(ledgerAccount),
      discover: vi.fn().mockResolvedValue([ledgerAccount]),
    };
    vi.doMock('@ledgerhq/hw-transport-webusb', () => ({
      default: { create: vi.fn(async () => transport) },
    }));
    // Constructed with `new`, so the implementations can't be arrow functions.
    vi.doMock('@aeternity/aepp-sdk', () => ({
      AccountLedger: vi.fn(function AccountLedger() { Object.assign(this, ledgerAccount); }),
      AccountLedgerFactory: vi.fn(function AccountLedgerFactory() {
        Object.assign(this, accountFactory);
      }),
    }));
    vi.doMock('@/composables', () => ({
      useAeSdk: () => ({
        getAeSdk: async () => ({ api: {} }),
        nodeNetworkId: { value: 'ae_uat' },
      }),
      useModals: () => ({ openModal: vi.fn() }),
    }));
    vi.doMock('@/constants', async () => ({
      ...(await vi.importActual('@/constants')),
      IS_WEB: true,
    }));
  });

  async function useLedger() {
    return (await import('@/composables/ledger')).useLedger();
  }

  const calls = {
    deriveAccount: (ledger) => ledger.deriveAccount(0),
    discoverAccounts: (ledger) => ledger.discoverAccounts(),
    signMessage: (ledger) => ledger.signMessage(ADDRESS, 0, 'message'),
    signTransaction: (ledger) => ledger.signTransaction(ADDRESS, 0, 'tx_unsigned'),
  };
  const deviceCalls = {
    deriveAccount: () => accountFactory.initialize,
    discoverAccounts: () => accountFactory.discover,
    signMessage: () => ledgerAccount.signMessage,
    signTransaction: () => ledgerAccount.signTransaction,
  };
  const deviceAnswers = {
    deriveAccount: () => ledgerAccount,
    discoverAccounts: () => [ledgerAccount],
    signMessage: () => new Uint8Array([1]),
    signTransaction: () => 'tx_signed',
  };

  describe.each(Object.keys(calls))('%s', (name) => {
    it('closes the transport once it is done, passing on the device answer', async () => {
      await expect(calls[name](await useLedger())).resolves.toEqual(deviceAnswers[name]());
      expect(transport.close).toHaveBeenCalledTimes(1);
    });

    it('closes the transport when the device fails, and passes the failure on', async () => {
      deviceCalls[name]().mockRejectedValue(new Error('Rejected on the device'));

      await expect(calls[name](await useLedger())).rejects.toThrow('Rejected on the device');
      expect(transport.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('signing, as every call', () => {
    const sign = (ledger) => ledger.signTransaction(ADDRESS, 0, 'tx_unsigned');

    it('keeps the transport open until the device answers', async () => {
      let answer;
      ledgerAccount.signTransaction.mockImplementation(
        () => new Promise((resolve) => { answer = resolve; }),
      );
      const signing = sign(await useLedger());
      await vi.waitFor(() => expect(answer).toBeDefined());
      await new Promise((resolve) => { setTimeout(resolve, 0); }); // Time for an early close.
      expect(transport.close).not.toHaveBeenCalled();

      answer('tx_signed');
      await signing;
      expect(transport.close).toHaveBeenCalledTimes(1);
    });

    it('passes on the device answer when closing the transport then fails', async () => {
      transport.close.mockRejectedValue(new Error('Transport already closed'));

      await expect(sign(await useLedger())).resolves.toBe('tx_signed');
    });

    it('passes on the device failure, not a failed close of an unplugged device', async () => {
      ledgerAccount.signTransaction.mockRejectedValue(new Error('Device disconnected'));
      transport.close.mockRejectedValue(new Error('Transport already closed'));

      await expect(sign(await useLedger())).rejects.toThrow('Device disconnected');
    });
  });
});
