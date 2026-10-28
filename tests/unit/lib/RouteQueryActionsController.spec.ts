// @ts-nocheck
import { MODAL_TRANSFER_SEND, PROTOCOLS } from '@/constants';

const setActiveAccountByProtocol = vi.fn();
const openModal = vi.fn();
const closeAllModals = vi.fn();

const SPL_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const EVM_TOKEN = '0x55d398326f99059fF775485246999027B3197955';
const AEX9_TOKEN = 'ct_mijZGKXeqQBS1dDmdJbbrDzKRrP58XLjJ2u5edkwafzfcXMsY';

async function openLink(query) {
  const { RouteQueryActionsController } = await import('@/lib/RouteQueryActionsController');
  let guard;
  RouteQueryActionsController.init({ beforeResolve: (fn) => { guard = fn; } });
  const next = vi.fn();
  guard({ query: { op: 'transferSend', account: 'recipient', ...query } }, {}, next);
  return next;
}

describe('RouteQueryActionsController transferSend', () => {
  beforeEach(async () => {
    vi.resetModules();
    setActiveAccountByProtocol.mockReset();
    openModal.mockReset();
    closeAllModals.mockReset();
    vi.doMock('@/composables/accounts', () => ({
      useAccounts: () => ({ setActiveAccountByProtocol }),
    }));
    vi.doMock('@/composables/modals', () => ({
      useModals: () => ({ openModal, closeAllModals }),
    }));
    await import('@/protocols/registerAdapters');
  });

  it.each([
    [PROTOCOLS.solana, SPL_MINT],
    [PROTOCOLS.bnb, EVM_TOKEN],
    [PROTOCOLS.avalanche, EVM_TOKEN],
    [PROTOCOLS.polygonPos, EVM_TOKEN],
    [PROTOCOLS.ethereum, EVM_TOKEN],
  ])('opens a %s token link on its own chain', async (protocol, token) => {
    const next = await openLink({ protocol, token });

    expect(setActiveAccountByProtocol).toHaveBeenCalledWith(protocol);
    expect(openModal).toHaveBeenCalledWith(MODAL_TRANSFER_SEND);
    expect(next).toHaveBeenCalled();
  });

  it.each([
    ['an EVM token', EVM_TOKEN, PROTOCOLS.ethereum],
    ['the bitcoin coin', 'bitcoin', PROTOCOLS.bitcoin],
    ['an AEX-9 token', AEX9_TOKEN, PROTOCOLS.aeternity],
  ])('opens a link without a protocol by its token: %s', async (_, token, protocol) => {
    await openLink({ token });

    expect(setActiveAccountByProtocol).toHaveBeenCalledWith(protocol);
  });

  it('ignores an unknown protocol', async () => {
    await openLink({ protocol: 'unknown', token: 'bitcoin' });

    expect(setActiveAccountByProtocol).toHaveBeenCalledWith(PROTOCOLS.bitcoin);
  });
});
