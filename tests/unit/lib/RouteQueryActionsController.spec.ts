// @ts-nocheck
import { createMemoryHistory, createRouter } from 'vue-router';
import { MODAL_TRANSFER_SEND, PROTOCOLS } from '@/constants';
import { ROUTE_NETWORK_ADD } from '@/popup/router/routeNames';

const setActiveAccountByProtocol = vi.fn();
const openModal = vi.fn();
const closeAllModals = vi.fn();

const SPL_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const EVM_TOKEN = '0x55d398326f99059fF775485246999027B3197955';
const AEX9_TOKEN = 'ct_mijZGKXeqQBS1dDmdJbbrDzKRrP58XLjJ2u5edkwafzfcXMsY';

async function getGuard() {
  const { RouteQueryActionsController } = await import('@/lib/RouteQueryActionsController');
  let guard;
  RouteQueryActionsController.init({ beforeResolve: (fn) => { guard = fn; } });
  return guard;
}

async function makeRouter() {
  const { RouteQueryActionsController } = await import('@/lib/RouteQueryActionsController');
  const component = { render: () => null };
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component },
      { path: '/networks/add', name: ROUTE_NETWORK_ADD, component },
    ],
  });
  RouteQueryActionsController.init(router);
  return router;
}

async function openLink(query) {
  const guard = await getGuard();
  return guard({ query: { op: 'transferSend', account: 'recipient', ...query } }, {});
}

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

describe('RouteQueryActionsController transferSend', () => {
  it.each([
    [PROTOCOLS.solana, SPL_MINT],
    [PROTOCOLS.bnb, EVM_TOKEN],
    [PROTOCOLS.avalanche, EVM_TOKEN],
    [PROTOCOLS.polygonPos, EVM_TOKEN],
    [PROTOCOLS.ethereum, EVM_TOKEN],
  ])('opens a %s token link on its own chain', async (protocol, token) => {
    const result = await openLink({ protocol, token });

    expect(setActiveAccountByProtocol).toHaveBeenCalledWith(protocol);
    expect(openModal).toHaveBeenCalledWith(MODAL_TRANSFER_SEND);
    expect(result).toBe(true);
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

describe('RouteQueryActionsController addNetwork', () => {
  const networkQuery = { name: 'Local', url: 'http://localhost:3013' };

  it('redirects to the network form without the action', async () => {
    const guard = await getGuard();

    expect(guard({ query: { op: 'addNetwork', ...networkQuery } }, {}))
      .toEqual({ name: ROUTE_NETWORK_ADD, query: networkQuery });
  });

  it('settles the navigation on the network form', async () => {
    const router = await makeRouter();

    await router.push({ path: '/', query: { op: 'addNetwork', ...networkQuery } });

    expect(router.currentRoute.value)
      .toMatchObject({ name: ROUTE_NETWORK_ADD, query: networkQuery });
  });
});

describe('RouteQueryActionsController', () => {
  it('opens a page without an action', async () => {
    const guard = await getGuard();

    expect(guard({ query: { foo: 'bar' } }, {})).toBe(true);
  });

  it.each([
    'toString',
    'constructor',
    'hasOwnProperty',
  ])('opens a page whose action is an inherited object key: %s', async (op) => {
    const router = await makeRouter();
    // `constructor` would return this query as a redirect location.
    const query = { op, path: '/networks/add' };

    const failure = await router.push({ path: '/', query });

    expect(failure).toBeUndefined();
    expect(router.currentRoute.value).toMatchObject({ path: '/', query });
  });
});
