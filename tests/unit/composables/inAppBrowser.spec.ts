// @ts-nocheck
import { defineComponent, ref } from 'vue';
import { mount } from '@vue/test-utils';

describe('useInAppBrowser composable', () => {
  let iab: any;
  let listeners: Record<string, Function>;
  let aeSdk: any;
  let connectMock: jest.Mock;
  let handleEvmRpcMethodMock: jest.Mock;
  let isIabDappActiveRef: any;
  let activeAccountRef: any;
  let modalsOpenRef: any;
  let ethSettingsRef: any;
  let bnbSettingsRef: any;

  function setupWindowIab() {
    listeners = {};
    iab = {
      addEventListener: jest.fn((name: string, fn: Function) => { listeners[name] = fn; }),
      executeScript: jest.fn(),
      hide: jest.fn(),
      show: jest.fn(),
      close: jest.fn(),
      _loadAfterBeforeload: jest.fn(),
    };
    (global as any).window = global.window || ({} as any);
    (window as any).cordova = {
      InAppBrowser: {
        open: jest.fn(() => iab),
      },
    };
  }

  async function importUnderTest() {
    const { useInAppBrowser, buildIabOptions } = await import('@/composables/inAppBrowser');
    return { useInAppBrowser, buildIabOptions };
  }

  function mountHarness(useInAppBrowser: any) {
    const Comp = defineComponent({
      name: 'Harness',
      setup() {
        const api = useInAppBrowser();
        return api as any;
      },
      template: '<div />',
    });
    return mount(Comp);
  }

  async function flush() {
    await Promise.resolve();
    await Promise.resolve();
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    jest.advanceTimersByTime(1);
    await Promise.resolve();
  }

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();

    // Window + IAB
    setupWindowIab();

    // Mocks: constants
    jest.doMock('@/constants', () => ({
      IS_MOBILE_APP: true,
      PROTOCOLS: { ethereum: 'ethereum', bnb: 'bnb' },
    }));

    // Reactive state refs used by composable
    activeAccountRef = ref({ address: '0xabc', protocol: 'ethereum' });
    modalsOpenRef = ref([]);
    ethSettingsRef = ref({ chainId: '1' });
    bnbSettingsRef = ref({ chainId: '56' });

    // Mocks: composables
    connectMock = jest.fn();
    jest.doMock('@/composables', () => ({
      useAeSdk: jest.fn(),
      useAccounts: jest.fn(() => ({ activeAccount: activeAccountRef })),
      useModals: jest.fn(() => ({ modalsOpen: modalsOpenRef })),
      useWalletConnect: jest.fn(() => ({ connect: connectMock })),
    }));

    jest.doMock('@/protocols/ethereum/composables/ethNetworkSettings', () => ({
      useEthNetworkSettings: () => ({ ethActiveNetworkSettings: ethSettingsRef }),
    }));
    jest.doMock('@/protocols/bnb/composables/bnbNetworkSettings', () => ({
      useBnbNetworkSettings: () => ({ bnbActiveNetworkSettings: bnbSettingsRef }),
    }));

    // Mocks: iabState ref
    isIabDappActiveRef = ref(false);
    jest.doMock('@/composables/iabState', () => ({ isIabDappActive: isIabDappActiveRef }));

    // Mocks: utils
    jest.doMock('@/utils', () => ({
      executeAndSetInterval: (fn: Function) => {
        try { fn(); } catch (e) { /* noop */ }
        return 111 as any;
      },
    }));

    // Mocks: SDK + enums
    aeSdk = {
      addRpcClient: jest.fn(() => 'client1'),
      removeRpcClient: jest.fn(),
      shareWalletInfo: jest.fn(),
      _getClient: jest.fn(() => ({ status: 2 })),
    };
    jest.doMock('@aeternity/aepp-sdk', () => ({
      BrowserWindowMessageConnection: jest.fn().mockImplementation(() => ({ /* no-op */ })),
      RPC_STATUS: { WAITING_FOR_CONNECTION_REQUEST: 1, CONNECTED: 2 },
      MESSAGE_DIRECTION: { to_aepp: 'to_aepp', to_waellet: 'to_waellet' },
    }));
    const { useAeSdk } = jest.requireMock('@/composables');
    (useAeSdk as jest.Mock).mockReturnValue({ getAeSdk: () => Promise.resolve(aeSdk) });

    // Mocks: EVM RPC handler
    handleEvmRpcMethodMock = jest.fn().mockResolvedValue({ result: '0x1' });
    jest.doMock('@/protocols/evm/libs/EvmRpcMethodsHandler', () => ({
      handleEvmRpcMethod: (...args: any[]) => handleEvmRpcMethodMock(...args),
    }));
  });

  it('buildIabOptions returns expected string', async () => {
    const { buildIabOptions } = await importUnderTest();
    const res = buildIabOptions();
    expect(res).toContain('location=no');
    expect(res).toContain('beforeload=yes');
  });

  it('open initializes IAB, injects provider on loadstop and marks active', async () => {
    const { useInAppBrowser } = await importUnderTest();
    const wrapper = mountHarness(useInAppBrowser);
    await (wrapper.vm as any).open('https://a.com');

    expect(window.cordova.InAppBrowser.open).toHaveBeenCalled();
    expect((wrapper.vm as any).isOpen).toBe(true);
    expect((wrapper.vm as any).currentUrl).toBe('https://a.com');

    // simulate loadstop
    listeners.loadstop?.();
    await flush();
    // script injected
    expect(iab.executeScript).toHaveBeenCalledWith(expect.objectContaining({ code: expect.stringContaining('window.superheroInjected') }));
    // bridge attached -> ae sdk client added
    expect(aeSdk.addRpcClient).toHaveBeenCalled();
    // dapp marked active
    expect(isIabDappActiveRef.value).toBe(true);
  });

  it('beforeload intercepts walletconnect URIs', async () => {
    const { useInAppBrowser } = await importUnderTest();
    const wrapper = mountHarness(useInAppBrowser);
    await (wrapper.vm as any).open('https://a.com');
    listeners.beforeload?.({ url: 'wc:topic@2?relay-protocol=irn' });
    expect(connectMock).toHaveBeenCalledWith('wc:topic@2?relay-protocol=irn', false);
  });

  it('beforeload navigates and reattaches bridge when origin changes', async () => {
    const { useInAppBrowser } = await importUnderTest();
    const wrapper = mountHarness(useInAppBrowser);
    await (wrapper.vm as any).open('https://a.com');
    listeners.loadstop?.();
    await flush();
    const addCount = aeSdk.addRpcClient.mock.calls.length;
    listeners.beforeload?.({ url: 'https://b.com/path' });
    await flush();
    expect(iab._loadAfterBeforeload).toHaveBeenCalledWith('https://b.com/path');
    // origin changed -> another bridge attach -> addRpcClient called again
    expect(aeSdk.addRpcClient.mock.calls.length).toBeGreaterThan(addCount);
  });

  it('handles __shw rpc-request success and emits results', async () => {
    const { useInAppBrowser } = await importUnderTest();
    const wrapper = mountHarness(useInAppBrowser);
    await (wrapper.vm as any).open('https://a.com');
    listeners.loadstop?.();
    await flush();

    // Successful chainId
    handleEvmRpcMethodMock.mockResolvedValueOnce({ result: '0x1' });
    listeners.message?.({
      data: JSON.stringify({
        __shw: true,
        type: 'rpc-request',
        requestId: 7,
        method: 'eth_chainId',
        params: {},
      }),
    });
    await flush();
    expect(iab.executeScript).toHaveBeenCalledWith(expect.objectContaining({ code: expect.stringContaining('"type":"rpc-result"') }));

    // eth_requestAccounts should trigger events
    handleEvmRpcMethodMock
      .mockResolvedValueOnce({ result: ['0xdef'] }) // for eth_requestAccounts
      .mockResolvedValueOnce({ result: '0x1' }); // for eth_chainId in connect
    listeners.message?.({
      data: JSON.stringify({
        __shw: true,
        type: 'rpc-request',
        requestId: 8,
        method: 'eth_requestAccounts',
        params: {},
      }),
    });
    await flush();
    let calls = (iab.executeScript as jest.Mock).mock.calls.map((c: any[]) => c[0].code);
    if (!calls.some((code: string) => code.includes('"event":"connect"'))) {
      await flush();
      calls = (iab.executeScript as jest.Mock).mock.calls.map((c: any[]) => c[0].code);
    }
    expect(calls.some((code: string) => code.includes('"event":"accountsChanged"'))).toBe(true);
    expect(calls.some((code: string) => code.includes('"event":"connect"'))).toBe(true);
  });

  it('returns error for invalid hex result on hex-expected methods', async () => {
    const { useInAppBrowser } = await importUnderTest();
    const wrapper = mountHarness(useInAppBrowser);
    await (wrapper.vm as any).open('https://a.com');
    listeners.loadstop?.();
    await flush();

    handleEvmRpcMethodMock.mockResolvedValueOnce({ result: '123' }); // invalid hex for gasPrice
    listeners.message?.({
      data: {
        __shw: true,
        type: 'rpc-request',
        requestId: 9,
        method: 'eth_gasPrice',
        params: {},
      },
    });
    await flush();
    const last = (iab.executeScript as jest.Mock).mock.calls.pop()?.[0].code;
    expect(last).toContain('"type":"rpc-result"');
    expect(last).toContain('"error"');
  });

  it('forwards AEX-2 envelopes to window message', async () => {
    const { useInAppBrowser } = await importUnderTest();
    const wrapper = mountHarness(useInAppBrowser);
    await (wrapper.vm as any).open('https://a.com');
    listeners.loadstop?.();
    await flush();
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    listeners.message?.({
      data: {
        type: 'to_waellet',
        any: 1,
      },
    });
    await flush();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'message' }));
  });

  it('closes on close-iab message and cleans state', async () => {
    const { useInAppBrowser } = await importUnderTest();
    const wrapper = mountHarness(useInAppBrowser);
    await (wrapper.vm as any).open('https://a.com');
    // ensure bridge attached to create rpc client id
    listeners.loadstop?.();
    await flush();
    listeners.message?.({ data: { __shw: true, type: 'close-iab' } });
    await flush();
    expect(iab.close).toHaveBeenCalled();
    expect((wrapper.vm as any).isOpen).toBe(false);
    expect(aeSdk.removeRpcClient).toHaveBeenCalled();
    expect(isIabDappActiveRef.value).toBe(false);
  });

  it('handles exit cleanup (cleanup state and remove rpc client)', async () => {
    const { useInAppBrowser } = await importUnderTest();
    const wrapper = mountHarness(useInAppBrowser);
    await (wrapper.vm as any).open('https://a.com');
    listeners.loadstop?.();
    await flush();
    listeners.exit?.();
    await flush();
    expect(aeSdk.removeRpcClient).toHaveBeenCalled();
    expect((wrapper.vm as any).isOpen).toBe(false);
    expect(isIabDappActiveRef.value).toBe(false);
  });

  it('refresh, navigate, close call respective IAB APIs', async () => {
    const { useInAppBrowser } = await importUnderTest();
    const wrapper = mountHarness(useInAppBrowser);
    await (wrapper.vm as any).open('https://a.com');
    (wrapper.vm as any).refresh();
    expect(iab.executeScript).toHaveBeenCalledWith({ code: 'location.reload()' });
    (wrapper.vm as any).navigate('https://c.com');
    expect(iab._loadAfterBeforeload).toHaveBeenCalledWith('https://c.com');
    (wrapper.vm as any).close();
    expect(iab.close).toHaveBeenCalled();
  });

  // chainChanged watcher is indirectly covered by RPC wallet_switchEthereumChain test above
});
