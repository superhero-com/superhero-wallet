// @ts-nocheck
import {
  POPUP_ACTIONS,
  POPUP_METHODS,
  POPUP_TYPE_CONNECT,
} from '@/constants';

const WINDOW_ID = 7;
const props = { app: { host: 'dapp.example', href: 'https://dapp.example/' } };

function createPort(sender = {}) {
  const port = {
    sender,
    postMessage: vi.fn(),
    receive: () => {}, // Dropped while nothing listens
    onMessage: { addListener: vi.fn((listener) => { port.receive = listener; }) },
    onDisconnect: { addListener: vi.fn((listener) => { port.disconnect = listener; }) },
  };
  return port;
}

describe('offscreen popups shown in a side panel', () => {
  const originalBrowser = globalThis.browser;
  let sendMessage: vi.Mock;
  let openPopup;
  let addSidePanel;
  let getPopup;
  const requestId = (index = 0) => sendMessage.mock.calls
    .filter(([{ method }]) => method === POPUP_METHODS.openPopup)[index][0].params.id;

  function backgroundChooses(windowId?: number) {
    sendMessage.mockImplementation(async ({ method, params }) => {
      if (method !== POPUP_METHODS.openPopup) {
        return undefined;
      }
      // Like the background: only a window that has a side panel.
      const sidePanelWindowId = params.sidePanelWindowIds.includes(windowId) ? windowId : undefined;
      return { id: params.id, props, sidePanelWindowId };
    });
  }

  function connectSidePanel(windowId = WINDOW_ID, sender = {}) {
    const port = createPort(sender);
    addSidePanel(port);
    port.receive({ windowId, visible: true });
    return port;
  }

  beforeEach(async () => {
    vi.resetModules();
    sendMessage = vi.fn();
    ({ openPopup, addSidePanel, getPopup } = await import('@/offscreen/popupHandler'));
    // Set after the import, which installs its own `browser` stub.
    globalThis.browser = { runtime: { id: 'ext-id', getURL: (url) => url, sendMessage } };
  });

  afterEach(() => {
    globalThis.browser = originalBrowser;
  });

  it('tells the background which windows have a side panel', async () => {
    connectSidePanel();
    backgroundChooses(undefined);
    openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example', {});
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalled());

    expect(sendMessage.mock.calls[0][0].params.sidePanelWindowIds).toEqual([WINDOW_ID]);
  });

  it('rejects the request when the background cannot open its window', async () => {
    sendMessage.mockResolvedValue(null);
    await expect(openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example', {}))
      .rejects.toThrow('Could not open the approval window');
  });

  it('sends the popup to the side panel and resolves with its answer', async () => {
    const port = connectSidePanel();
    backgroundChooses(WINDOW_ID);
    const result = openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example', {});
    await vi.waitFor(() => expect(port.postMessage).toHaveBeenCalled());

    expect(port.postMessage).toHaveBeenCalledWith({
      id: requestId(),
      popupType: POPUP_TYPE_CONNECT,
      props,
    });
    port.receive({ id: requestId(), type: POPUP_ACTIONS.resolve, payload: { selectedAddress: 'ak_1' } });
    await expect(result).resolves.toEqual({ selectedAddress: 'ak_1' });
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      method: POPUP_METHODS.removePopup,
      params: { id: requestId() },
    }));
  });

  it('rejects when the side panel rejects', async () => {
    const port = connectSidePanel();
    backgroundChooses(WINDOW_ID);
    const result = openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example', {});
    await vi.waitFor(() => expect(port.postMessage).toHaveBeenCalled());

    port.receive({ id: requestId(), type: POPUP_ACTIONS.reject });
    await expect(result).rejects.toBeUndefined();
  });

  it('reports a delivery error when the side panel cannot take the popup', async () => {
    const { ApprovalWindowError } = await import('@/lib/errors');
    const port = connectSidePanel();
    port.postMessage.mockImplementation(() => {
      throw new Error('Attempting to use a disconnected port object');
    });
    backgroundChooses(WINDOW_ID);

    await expect(openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example', {}))
      .rejects.toBeInstanceOf(ApprovalWindowError);
    expect(getPopup(requestId())).toBeUndefined();
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      method: POPUP_METHODS.removePopup,
      params: { id: requestId() },
    }));
  });

  it('rejects the pending popups and forgets the side panel when it is closed', async () => {
    const port = connectSidePanel();
    backgroundChooses(WINDOW_ID);
    const result = openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example', {});
    await vi.waitFor(() => expect(port.postMessage).toHaveBeenCalled());

    port.disconnect();
    await expect(result).rejects.toBeUndefined();

    sendMessage.mockClear();
    backgroundChooses(undefined);
    openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example', {});
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalled());
    expect(sendMessage.mock.calls[0][0].params.sidePanelWindowIds).toEqual([]);
  });

  it('rejects only the popups of the side panel that was closed', async () => {
    const closedPanel = connectSidePanel(WINDOW_ID);
    const openPanel = connectSidePanel(WINDOW_ID + 1);
    backgroundChooses(WINDOW_ID);
    const closedPanelResult = openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example', {});
    await vi.waitFor(() => expect(closedPanel.postMessage).toHaveBeenCalled());
    backgroundChooses(WINDOW_ID + 1);
    const openPanelResult = openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example', {});
    await vi.waitFor(() => expect(openPanel.postMessage).toHaveBeenCalled());

    closedPanel.disconnect();
    await expect(closedPanelResult).rejects.toBeUndefined();

    openPanel.receive({ id: requestId(1), type: POPUP_ACTIONS.resolve, payload: 'answer' });
    await expect(openPanelResult).resolves.toBe('answer');
  });

  it('keeps using a reloaded side panel after its old page disconnects', async () => {
    const oldPage = connectSidePanel();
    const reloadedPage = connectSidePanel();
    oldPage.disconnect();
    backgroundChooses(WINDOW_ID);

    openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example', {});
    await vi.waitFor(() => expect(reloadedPage.postMessage).toHaveBeenCalled());

    const [[{ params }]] = sendMessage.mock.calls;
    expect(params.sidePanelWindowIds).toEqual([WINDOW_ID]);
  });

  it('leaves the side panel out while it is hidden behind another one', async () => {
    const port = connectSidePanel();
    port.receive({ windowId: WINDOW_ID, visible: false });
    backgroundChooses(WINDOW_ID);
    openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example', {});
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalled());
    expect(sendMessage.mock.calls[0][0].params.sidePanelWindowIds).toEqual([]);

    port.receive({ windowId: WINDOW_ID, visible: true });
    openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example', {});
    await vi.waitFor(() => expect(port.postMessage).toHaveBeenCalled());
  });

  it('opens a popup window when the side panel closes before the popup reaches it', async () => {
    const port = connectSidePanel();
    const replies = [];
    sendMessage.mockImplementation(({ method }) => (method === POPUP_METHODS.openPopup
      ? new Promise((reply) => { replies.push(reply); })
      : undefined));
    const result = openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example', {});
    await vi.waitFor(() => expect(replies).toHaveLength(1));

    port.disconnect();
    replies[0]({ id: requestId(), props, sidePanelWindowId: WINDOW_ID });
    await vi.waitFor(() => expect(replies).toHaveLength(2));
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      method: POPUP_METHODS.openPopup,
      params: expect.objectContaining({ sidePanelWindowIds: [] }),
    }));
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      method: POPUP_METHODS.removePopup,
      params: { id: requestId() },
    }));

    replies[1]({ id: requestId(1), props });
    // The popup window answers over its own port.
    await vi.waitFor(() => expect(getPopup(requestId(1))).toBeDefined());
    getPopup(requestId(1)).actions.resolve({ selectedAddress: 'ak_1' });
    await expect(result).resolves.toEqual({ selectedAddress: 'ak_1' });
    expect(port.postMessage).not.toHaveBeenCalled();
  });

  it('ignores the wallet opened in a tab, which any web page can do', async () => {
    const port = connectSidePanel();
    const tab = connectSidePanel(WINDOW_ID, { tab: { id: 1, windowId: WINDOW_ID } });
    backgroundChooses(WINDOW_ID);
    openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example', {});

    await vi.waitFor(() => expect(port.postMessage).toHaveBeenCalled());
    expect(tab.postMessage).not.toHaveBeenCalled();
  });

  it('ignores answers from another side panel', async () => {
    const port = connectSidePanel();
    const otherPort = connectSidePanel(WINDOW_ID + 1);
    backgroundChooses(WINDOW_ID);
    const result = openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example', {});
    await vi.waitFor(() => expect(port.postMessage).toHaveBeenCalled());

    otherPort.receive({ id: requestId(), type: POPUP_ACTIONS.resolve, payload: 'forged' });
    port.receive({ id: requestId(), type: POPUP_ACTIONS.resolve, payload: 'real' });
    await expect(result).resolves.toBe('real');
  });

  describe('on Firefox, where the background runs in the same page', () => {
    beforeEach(async () => {
      vi.resetModules();
      vi.doMock('@/constants', async () => ({
        ...(await vi.importActual('@/constants')),
        IS_FIREFOX: true,
      }));
      ({ openPopup, addSidePanel } = await import('@/offscreen/popupHandler'));
      const activeTab = {
        active: true, id: 4, windowId: WINDOW_ID, url: 'https://dapp.example/',
      };
      globalThis.browser = {
        runtime: { id: 'ext-id', getURL: (url) => url },
        tabs: { query: vi.fn().mockResolvedValue([activeTab]) },
        windows: {
          getLastFocused: vi.fn().mockResolvedValue({
            id: WINDOW_ID, focused: true, state: 'normal', tabs: [activeTab],
          }),
          create: vi.fn().mockResolvedValue({ id: 99 }),
        },
      };
    });

    afterEach(() => {
      vi.doUnmock('@/constants');
    });

    it('reports an opening failure without exposing the Firefox error', async () => {
      browser.windows.create.mockRejectedValue(new Error('Internal browser details'));
      await expect(openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example', {}))
        .rejects.toThrow('Could not open the approval window');
      expect(browser.windows.create).toHaveBeenCalledOnce();
    });

    it('settles an unconnected popup once Firefox removes its window', async () => {
      const { handlePopupWindowRemoved } = await import('@/offscreen/popupHandler');
      browser.windows.create.mockResolvedValue({ id: 99, tabs: [{ id: 53 }] });
      const declined = expect(openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example/'))
        .rejects.toBeUndefined();
      await vi.waitFor(() => expect(browser.windows.create).toHaveBeenCalledOnce());
      handlePopupWindowRemoved(99);
      await declined;
    });

    it('shows the popup in the side panel of the focused window', async () => {
      const port = connectSidePanel();
      const result = openPopup(POPUP_TYPE_CONNECT, 'https://dapp.example', {});
      await vi.waitFor(() => expect(port.postMessage).toHaveBeenCalled());

      const [[request]] = port.postMessage.mock.calls;
      expect(request).toMatchObject({
        popupType: POPUP_TYPE_CONNECT,
        props: { app: { host: 'dapp.example' } },
      });
      expect(browser.windows.create).not.toHaveBeenCalled();

      port.receive({ id: request.id, type: POPUP_ACTIONS.resolve, payload: 'answer' });
      await expect(result).resolves.toBe('answer');
    });
  });
});
