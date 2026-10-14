// @ts-nocheck
import { ref } from 'vue';
import {
  CONNECTION_TYPES,
  MODAL_CONFIRM_ACCOUNT_LIST,
  MODAL_CONFIRM_CONNECT,
  MODAL_CONFIRM_RAW_SIGN,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  MODAL_CONFIRM_UNSAFE_SIGN,
  MODAL_MESSAGE_SIGN,
  POPUP_ACTIONS,
  POPUP_TYPE_ACCOUNT_LIST,
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_RAW_SIGN,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_UNSAFE_SIGN,
} from '@/constants';

const WINDOW_ID = 5;
const props = { app: { host: 'dapp.example' } };

describe('SidePanelConnection', () => {
  const originalBrowser = globalThis.browser;
  let ports;
  let openModal: vi.Mock;
  let isAuthenticated;
  let isLoggedIn;

  function createPort() {
    const port = {
      postMessage: vi.fn(),
      onMessage: { addListener: vi.fn((listener) => { port.receive = listener; }) },
      onDisconnect: { addListener: vi.fn((listener) => { port.disconnect = listener; }) },
    };
    ports.push(port);
    return port;
  }

  function deferModal() {
    let resolve;
    let reject;
    openModal.mockImplementationOnce(() => new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    }));
    return { resolve: (value) => resolve(value), reject: () => reject(new Error('rejected')) };
  }

  async function load(constants = {}) {
    vi.doMock('@/constants', async () => ({
      ...(await vi.importActual('@/constants')),
      IS_SIDE_PANEL: true,
      ...constants,
    }));
    const { SidePanelConnection } = await import('@/lib/SidePanelConnection');
    // Set after the import, which installs its own `browser` stub.
    globalThis.browser = {
      windows: { getCurrent: vi.fn().mockResolvedValue({ id: WINDOW_ID }) },
      runtime: { connect: vi.fn(createPort) },
    };
    return SidePanelConnection;
  }

  async function init() {
    (await load()).init();
    await vi.waitFor(() => expect(ports).toHaveLength(1));
    return ports[0];
  }

  beforeEach(() => {
    vi.resetModules();
    ports = [];
    openModal = vi.fn();
    isAuthenticated = ref(true);
    isLoggedIn = ref(true);
    vi.doMock('@/composables', () => ({
      useModals: () => ({ openModal }),
      useAuth: () => ({ isAuthenticated }),
      useAccounts: () => ({ isLoggedIn }),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.doUnmock('@/constants');
    globalThis.browser = originalBrowser;
  });

  it('registers the browser window of the side panel', async () => {
    const port = await init();

    expect(browser.runtime.connect).toHaveBeenCalledWith({ name: CONNECTION_TYPES.SIDE_PANEL });
    expect(port.postMessage).toHaveBeenCalledWith({ windowId: WINDOW_ID, visible: true });
  });

  it('tells whether it is shown, as Chrome keeps it alive behind another side panel', async () => {
    const port = await init();
    const setVisibility = (visibilityState) => {
      Object.defineProperty(document, 'visibilityState', { value: visibilityState, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    };

    try {
      setVisibility('hidden');
      expect(port.postMessage).toHaveBeenLastCalledWith({ windowId: WINDOW_ID, visible: false });
      setVisibility('visible');
      expect(port.postMessage).toHaveBeenLastCalledWith({ windowId: WINDOW_ID, visible: true });

      vi.useFakeTimers();
      port.disconnect();
      port.postMessage.mockClear();
      setVisibility('hidden');
      expect(port.postMessage).not.toHaveBeenCalled();
    } finally {
      delete document.visibilityState;
    }
  });

  it.each([
    ['outside of the side panel', { IS_SIDE_PANEL: false }],
    ['in a frame', { IN_FRAME: true }],
  ])('does not connect %s', async (_where, constants) => {
    (await load(constants)).init();
    await new Promise((resolve) => setTimeout(resolve));

    expect(browser.runtime.connect).not.toHaveBeenCalled();
  });

  it('shows the confirmation modal and sends back the answer', async () => {
    const port = await init();
    const modal = deferModal();

    port.receive({ id: 'popup-1', popupType: POPUP_TYPE_SIGN, props });
    await vi.waitFor(() => expect(openModal).toHaveBeenCalled());
    expect(openModal).toHaveBeenCalledWith(
      MODAL_CONFIRM_TRANSACTION_SIGN,
      { ...props, isOffscreenRequest: true },
    );

    modal.resolve({ selectedAddress: 'ak_1' });
    await vi.waitFor(() => expect(port.postMessage).toHaveBeenLastCalledWith({
      id: 'popup-1',
      type: POPUP_ACTIONS.resolve,
      payload: { selectedAddress: 'ak_1' },
    }));
  });

  // The same modals the popup windows show for these requests.
  it.each([
    [POPUP_TYPE_CONNECT, MODAL_CONFIRM_CONNECT],
    [POPUP_TYPE_ACCOUNT_LIST, MODAL_CONFIRM_ACCOUNT_LIST],
    [POPUP_TYPE_SIGN, MODAL_CONFIRM_TRANSACTION_SIGN],
    [POPUP_TYPE_RAW_SIGN, MODAL_CONFIRM_RAW_SIGN],
    [POPUP_TYPE_MESSAGE_SIGN, MODAL_MESSAGE_SIGN],
    [POPUP_TYPE_UNSAFE_SIGN, MODAL_CONFIRM_UNSAFE_SIGN],
  ])('shows a %s request in the %s modal', async (popupType, modalName) => {
    const port = await init();

    port.receive({ id: 'popup-1', popupType, props });
    await vi.waitFor(() => expect(openModal).toHaveBeenCalledWith(
      modalName,
      { ...props, isOffscreenRequest: true },
    ));
  });

  it('sends a rejection when the modal is rejected', async () => {
    const port = await init();
    const modal = deferModal();

    port.receive({ id: 'popup-1', popupType: POPUP_TYPE_CONNECT, props });
    await vi.waitFor(() => expect(openModal).toHaveBeenCalled());
    modal.reject();

    await vi.waitFor(() => expect(port.postMessage).toHaveBeenLastCalledWith({
      id: 'popup-1',
      type: POPUP_ACTIONS.reject,
    }));
  });

  it.each(['isLoggedIn', 'isAuthenticated'])('waits for %s', async (state) => {
    const wallet = { isLoggedIn, isAuthenticated };
    wallet[state].value = false;
    const port = await init();
    deferModal();

    port.receive({ id: 'popup-1', popupType: POPUP_TYPE_CONNECT, props });
    await new Promise((resolve) => setTimeout(resolve));
    expect(openModal).not.toHaveBeenCalled();

    wallet[state].value = true;
    await vi.waitFor(() => expect(openModal).toHaveBeenCalledWith(
      MODAL_CONFIRM_CONNECT,
      expect.anything(),
    ));
  });

  it('drops a request when the offscreen document goes away before the unlock', async () => {
    isAuthenticated.value = false;
    const port = await init();
    port.receive({ id: 'popup-1', popupType: POPUP_TYPE_CONNECT, props });

    vi.useFakeTimers();
    port.disconnect();
    isAuthenticated.value = true;
    await vi.advanceTimersByTimeAsync(0);

    expect(openModal).not.toHaveBeenCalled();
  });

  it('shows one confirmation at a time, not within a double click of the last', async () => {
    const port = await init();
    const firstModal = deferModal();
    deferModal();
    vi.useFakeTimers();

    port.receive({ id: 'popup-1', popupType: POPUP_TYPE_CONNECT, props });
    port.receive({ id: 'popup-2', popupType: POPUP_TYPE_SIGN, props });
    await vi.advanceTimersByTimeAsync(0);
    expect(openModal).toHaveBeenCalledOnce();

    firstModal.resolve();
    await vi.advanceTimersByTimeAsync(499);
    expect(port.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'popup-1' }));
    expect(openModal).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(1);
    expect(openModal).toHaveBeenCalledTimes(2);
    expect(openModal.mock.calls[1][0]).toBe(MODAL_CONFIRM_TRANSACTION_SIGN);
  });

  it('keeps showing confirmations after an answer could not be sent', async () => {
    const port = await init();
    openModal.mockResolvedValue(undefined);
    port.postMessage.mockImplementationOnce(() => {
      throw new Error('Attempting to use a disconnected port object');
    });
    vi.useFakeTimers();

    port.receive({ id: 'popup-1', popupType: POPUP_TYPE_CONNECT, props });
    port.receive({ id: 'popup-2', popupType: POPUP_TYPE_SIGN, props });
    await vi.runAllTimersAsync();

    expect(openModal).toHaveBeenCalledTimes(2);
    expect(port.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'popup-2' }));
  });

  it('drops the answer and reconnects when the offscreen document goes away', async () => {
    const port = await init();
    const modal = deferModal();
    port.receive({ id: 'popup-1', popupType: POPUP_TYPE_CONNECT, props });
    await vi.waitFor(() => expect(openModal).toHaveBeenCalled());

    vi.useFakeTimers();
    port.disconnect();
    modal.resolve();
    await vi.runOnlyPendingTimersAsync();

    expect(port.postMessage).not.toHaveBeenCalledWith(expect.objectContaining({ id: 'popup-1' }));
    expect(ports).toHaveLength(2);
    expect(ports[1].postMessage).toHaveBeenCalledWith({ windowId: WINDOW_ID, visible: true });
  });
});
