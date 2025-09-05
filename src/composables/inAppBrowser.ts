import {
  ref, watch, onMounted, onUnmounted,
} from 'vue';
import { BrowserWindowMessageConnection, RPC_STATUS } from '@aeternity/aepp-sdk';
import {
  IS_MOBILE_APP,
  PROTOCOLS,
} from '@/constants';
import {
  executeAndSetInterval,
} from '@/utils';
import {
  useAeSdk,
  useAccounts,
  useModals,
  useWalletConnect,
} from '@/composables';
import type { WalletConnectUri } from '@/composables';
import { useEthNetworkSettings } from '@/protocols/ethereum/composables/ethNetworkSettings';
import { useBnbNetworkSettings } from '@/protocols/bnb/composables/bnbNetworkSettings';
import { handleEvmRpcMethod } from '@/protocols/evm/libs/EvmRpcMethodsHandler';

export function buildIabOptions(): string {
  const opts = [
    'location=yes',
    'hideurlbar=no',
    'hardwareback=yes',
    'hidden=no',
    'beforeload=yes',
    'EnableViewPortScale=yes',
    'mediaPlaybackRequiresUserAction=no',
    'allowInlineMediaPlayback=yes',
  ];
  return opts.join(',');
}

export function useInAppBrowser() {
  const inAppBrowserRef = ref<any>();
  const iabAex2ClientId = ref<string>('');
  const iabShareWalletInfoInterval = ref<NodeJS.Timeout>();
  const currentUrl = ref<string>('');
  const isOpen = ref<boolean>(false);

  const { getAeSdk } = useAeSdk();
  const { modalsOpen } = useModals();
  const { activeAccount } = useAccounts();
  const { ethActiveNetworkSettings } = useEthNetworkSettings();
  const { bnbActiveNetworkSettings } = useBnbNetworkSettings();
  const { connect } = useWalletConnect();

  function hide() {
    try { inAppBrowserRef.value?.hide(); } catch (_) { /* noop */ }
  }
  function show() {
    try { inAppBrowserRef.value?.show(); } catch (_) { /* noop */ }
  }

  function emitEthereumEvent(event: string, payload: any) {
    if (!IS_MOBILE_APP || !inAppBrowserRef.value) return;
    try {
      inAppBrowserRef.value.executeScript({
        code: `window.postMessage(${JSON.stringify({
          __shw: true,
          type: 'event',
          event,
          payload,
        })}, '*')`,
      });
    } catch (_) { /* noop */ }
  }

  function injectProviderShim() {
    if (!inAppBrowserRef.value) return;
    const code = `
      (function(){
        if (window.superheroInjected) return;
        window.superheroInjected = true;
        const listeners = {};
        function emit(event, data){ (listeners[event]||[]).forEach((fn)=>{ try{ fn(data);}catch(_){} }); }
        function on(event, fn){ listeners[event] = listeners[event]||[]; listeners[event].push(fn); }
        function removeListener(event, fn){ listeners[event] = (listeners[event]||[]).filter(f=>f!==fn); }
        function postToApp(msg){
          try { window.cordova_iab.postMessage(JSON.stringify(msg)); return; } catch(_){ }
          try { if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.cordova_iab) { window.webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify(msg)); return; } } catch(_){ }
          try { window.postMessage(msg, '*'); } catch(_){ }
        }
        try {
          window._shwDeliver = function(msg){
            try {
              var data = (typeof msg === 'string') ? JSON.parse(msg) : msg;
              window.dispatchEvent(new MessageEvent('message', { data }));
            } catch(_){}
          };
        } catch(_){ }
        const req = async ({ method, params }) => new Promise((resolve, reject)=>{
          const requestId = Math.floor(Math.random()*1e9);
          const handler = (e) => {
            try {
              const msg = (typeof e.data === 'string') ? JSON.parse(e.data) : (e.data || {});
              if (msg && msg.__shw && msg.type === 'rpc-result' && msg.requestId === requestId) {
                window.removeEventListener('message', handler);
                if (msg.error) reject(msg.error); else resolve(msg.result);
              }
            } catch(_){ }
          };
          window.addEventListener('message', handler);
          postToApp({ __shw: true, type: 'rpc-request', requestId, method, params });
        });
        const ethereum = {
          isSuperheroWallet: true,
          isConnected: () => true,
          request: (args) => req(args),
          enable: () => req({ method: 'eth_requestAccounts' }),
          send: (payload, cb) => {
            const p = (typeof payload === 'string') ? { method: payload } : (payload || {});
            req({ method: p.method, params: p.params }).then((result) => {
              const res = { jsonrpc: '2.0', id: p.id || 1, result };
              if (cb) cb(null, res); else return res;
            }).catch((error) => {
              const err = { code: error?.code || -32603, message: error?.message || 'Error' };
              if (cb) cb(err, null); else throw err;
            });
          },
          sendAsync: (payload, cb) => {
            const p = (typeof payload === 'string') ? { method: payload } : (payload || {});
            req({ method: p.method, params: p.params })
              .then((result) => cb && cb(null, { jsonrpc: '2.0', id: p.id || 1, result }))
              .catch((error) => cb && cb({ code: error?.code || -32603, message: error?.message || 'Error' }));
          },
          on,
          removeListener,
          selectedAddress: null,
          chainId: null,
          networkVersion: null,
        };
        Object.defineProperty(window, 'ethereum', { get(){ return ethereum; } });
        try { window.web3 = { currentProvider: ethereum, accounts: [] }; } catch(_){ }
        window.addEventListener('message', (e)=>{
          try {
            const msg = (typeof e.data === 'string') ? JSON.parse(e.data) : (e.data || {});
            if (msg && msg.__shw && msg.type === 'event') {
              emit(msg.event, msg.payload);
              if (msg.event === 'accountsChanged') {
                try { ethereum.selectedAddress = (msg.payload && msg.payload[0]) || null; } catch(_){}
              }
              if (msg.event === 'chainChanged') {
                try { ethereum.chainId = msg.payload; ethereum.networkVersion = String(parseInt(String(msg.payload), 16)); } catch(_){}
              }
            }
          } catch(_){ }
        });
        window.dispatchEvent(new Event('ethereum#initialized'));
        try {
          var __shw_aex2_ready_interval = setInterval(function(){
            if (document && document.readyState === 'complete') {
              try { clearInterval(__shw_aex2_ready_interval); } catch(_){}
              postToApp({ __shw: true, type: 'aex2-ready' });
            }
          }, 10);
        } catch(_){ }
        // Lightweight address bar overlay
        try {
          var bar = document.querySelector('#__shw_addr_bar__');
          if (!bar) {
            bar = document.createElement('div');
            bar.id = '__shw_addr_bar__';
            bar.style.position = 'fixed';
            bar.style.left = '0';
            bar.style.right = '0';
            bar.style.top = '0';
            bar.style.zIndex = '999999999';
            bar.style.background = 'rgba(17,97,254,0.95)';
            bar.style.padding = '8px env(safe-area-inset-right) 8px env(safe-area-inset-left)';
            bar.style.display = 'flex';
            bar.style.alignItems = 'center';
            bar.style.gap = '6px';
            bar.style.backdropFilter = 'saturate(120%) blur(6px)';
            var input = document.createElement('input');
            input.id = '__shw_addr_input__';
            input.type = 'url';
            input.style.flex = '1';
            input.style.height = '32px';
            input.style.borderRadius = '6px';
            input.style.border = 'none';
            input.style.padding = '0 10px';
            input.style.outline = 'none';
            input.value = location.href;
            input.placeholder = 'Enter URL';
            input.addEventListener('keydown', function(e){
              try {
                if (e.key === 'Enter') {
                  var val = input.value || '';
                  if (!/^https?:///i.test(val)) val = 'https://' + val;
                  location.href = val;
                }
              } catch(_){ }
            });
            bar.appendChild(input);
            document.documentElement.style.paddingTop = '48px';
            document.body.style.paddingTop = '48px';
            document.body.appendChild(bar);
            window.addEventListener('hashchange', function(){ try { input.value = location.href; } catch(_){ } });
            window.addEventListener('popstate', function(){ try { input.value = location.href; } catch(_){ } });
          }
        } catch(_){ }
      })();
    `;
    inAppBrowserRef.value.executeScript({ code });
  }

  function attachBridge() {
    (async () => {
      try {
        const sdk = await getAeSdk();
        if (iabAex2ClientId.value) {
          try { sdk.removeRpcClient(iabAex2ClientId.value); } catch (_) { /* noop */ }
          iabAex2ClientId.value = '';
        }
        if (iabShareWalletInfoInterval.value) {
          try { clearInterval(iabShareWalletInfoInterval.value); } catch (_) { /* noop */ }
          iabShareWalletInfoInterval.value = undefined as any;
        }
        const proxyTarget = {
          postMessage: (msg: any) => {
            try {
              inAppBrowserRef.value.executeScript({ code: `window.postMessage(${JSON.stringify(msg)}, '*')` });
            } catch (_) { /* noop */ }
          },
        } as any;
        const connection = new BrowserWindowMessageConnection({ target: proxyTarget });
        iabAex2ClientId.value = sdk.addRpcClient(connection);
        iabShareWalletInfoInterval.value = executeAndSetInterval(() => {
          try {
            const rpcClient = (sdk as any)._getClient(iabAex2ClientId.value);
            if (!rpcClient) return;
            if (rpcClient.status === RPC_STATUS.WAITING_FOR_CONNECTION_REQUEST) {
              sdk.shareWalletInfo(iabAex2ClientId.value);
            } else if (rpcClient.status === RPC_STATUS.CONNECTED) {
              if (iabShareWalletInfoInterval.value) clearInterval(iabShareWalletInfoInterval.value);
              iabShareWalletInfoInterval.value = undefined as any;
            }
          } catch (_) { /* noop */ }
        }, 3000);
      } catch (_) { /* noop */ }
    })();
  }

  function open(url: string) {
    if (!IS_MOBILE_APP) return;
    const opts = buildIabOptions();
    const iab = (window as any).cordova?.InAppBrowser?.open(url, '_blank', opts);
    if (!iab) return;
    inAppBrowserRef.value = iab;
    isOpen.value = true;
    currentUrl.value = url;

    iab.addEventListener('loadstop', () => {
      injectProviderShim();
      attachBridge();
    });

    iab.addEventListener('beforeload', (event: any) => {
      const nextUrl = String(event?.url || '');
      if (!nextUrl) return;
      // Intercept WalletConnect deep links; keep dapp open
      if (nextUrl.startsWith('wc:') || nextUrl.startsWith('wc://') || nextUrl.startsWith('superhero://wc')) {
        let wcUri: WalletConnectUri | undefined;
        try {
          if (nextUrl.startsWith('superhero://wc')) {
            const u = new URL(nextUrl);
            const uriParam = u.searchParams.get('uri') || '';
            if (uriParam) wcUri = (uriParam.startsWith('wc:') ? uriParam : (`wc:${uriParam.replace(/^wc:\/\//, '')}`)) as WalletConnectUri;
          } else if (nextUrl.startsWith('wc://')) {
            wcUri = (`wc:${nextUrl.slice(5)}`) as WalletConnectUri;
          } else {
            wcUri = (nextUrl as WalletConnectUri);
          }
        } catch (_) { /* noop */ }
        if (wcUri) connect(wcUri, false);
        return;
      }
      currentUrl.value = nextUrl;
      try { inAppBrowserRef.value._loadAfterBeforeload(nextUrl); } catch (_) { /* noop */ }
    });

    iab.addEventListener('message', async (event: any) => {
      let data: any;
      try { data = typeof event?.data === 'string' ? JSON.parse(event.data) : (event?.data || {}); } catch (_) { data = event?.data || {}; }
      if (data?.__shw && data.type === 'aex2-ready') {
        try {
          const sdk = await getAeSdk();
          if (iabAex2ClientId.value) sdk.shareWalletInfo(iabAex2ClientId.value);
        } catch (_) { /* noop */ }
        return;
      }
      if (data?.__shw && data.type === 'aex2' && data.payload) {
        try { window.dispatchEvent(new MessageEvent('message', { data: data.payload })); } catch (_) { /* noop */ }
        return;
      }
      if (!data?.__shw) return;
      if (data.type === 'rpc-request') {
        const { method, params, requestId } = data;
        try {
          const { result, error } = await handleEvmRpcMethod(url, method as any, params as any);
          if (error) throw error;
          inAppBrowserRef.value.executeScript({
            code: `window.postMessage(${JSON.stringify({
              __shw: true, type: 'rpc-result', requestId, result: (result ?? null),
            })}, '*')`,
          });
          if (method === 'eth_requestAccounts' && Array.isArray(result) && result.length) {
            try {
              const chain = await handleEvmRpcMethod(url, 'eth_chainId' as any, {} as any);
              const chainIdHex = chain?.result || '0x0';
              inAppBrowserRef.value.executeScript({
                code: `window.postMessage(${JSON.stringify({
                  __shw: true, type: 'event', event: 'accountsChanged', payload: result,
                })}, '*')`,
              });
              inAppBrowserRef.value.executeScript({
                code: `window.postMessage(${JSON.stringify({
                  __shw: true, type: 'event', event: 'connect', payload: { chainId: chainIdHex },
                })}, '*')`,
              });
            } catch (_) { /* noop */ }
          }
          if (method === 'wallet_requestPermissions') {
            try {
              const { result: permissions } = await handleEvmRpcMethod(url, 'wallet_getPermissions' as any, {} as any);
              inAppBrowserRef.value.executeScript({
                code: `window.postMessage(${JSON.stringify({
                  __shw: true, type: 'event', event: 'permissionsChanged', payload: permissions,
                })}, '*')`,
              });
            } catch (_) { /* noop */ }
          }
          if (method === 'wallet_switchEthereumChain') {
            try {
              const requested = (params?.chainId || params?.[0]?.chainId);
              const chainIdHex = typeof requested === 'string' ? requested : undefined;
              if (chainIdHex) {
                inAppBrowserRef.value.executeScript({
                  code: `window.postMessage(${JSON.stringify({
                    __shw: true, type: 'event', event: 'chainChanged', payload: chainIdHex,
                  })}, '*')`,
                });
              }
            } catch (_) { /* noop */ }
          }
        } catch (e: any) {
          const error = { code: e?.code || -32603, message: e?.message || 'Unknown error' };
          inAppBrowserRef.value.executeScript({
            code: `window.postMessage(${JSON.stringify({
              __shw: true, type: 'rpc-result', requestId, error,
            })}, '*')`,
          });
        } finally {
          // noop
        }
      }
    });

    iab.addEventListener('loaderror', async () => {
      try { inAppBrowserRef.value?.close(); } catch (_) { /* noop */ }
      inAppBrowserRef.value = undefined;
      isOpen.value = false;
      try {
        if (iabShareWalletInfoInterval.value) clearInterval(iabShareWalletInfoInterval.value);
      } catch (_) { /* noop */ }
      iabShareWalletInfoInterval.value = undefined as any;
      try { const sdk = await getAeSdk(); if (iabAex2ClientId.value) sdk.removeRpcClient(iabAex2ClientId.value); } catch (_) { /* noop */ } finally { iabAex2ClientId.value = ''; }
    });

    iab.addEventListener('exit', async () => {
      inAppBrowserRef.value = undefined;
      isOpen.value = false;
      emitEthereumEvent('disconnect', { code: 4001, message: 'User closed in-app browser' });
      try {
        if (iabShareWalletInfoInterval.value) clearInterval(iabShareWalletInfoInterval.value);
      } catch (_) { /* noop */ }
      iabShareWalletInfoInterval.value = undefined as any;
      try { const sdk = await getAeSdk(); if (iabAex2ClientId.value) sdk.removeRpcClient(iabAex2ClientId.value); } catch (_) { /* noop */ } finally { iabAex2ClientId.value = ''; }
    });
  }

  function refresh() {
    if (!IS_MOBILE_APP) return;
    if (!inAppBrowserRef.value) return;
    try { inAppBrowserRef.value.executeScript({ code: 'location.reload()' }); } catch (_) { /* noop */ }
  }

  function navigate(url: string) {
    if (!IS_MOBILE_APP) return;
    if (!inAppBrowserRef.value) return;
    currentUrl.value = url;
    try { inAppBrowserRef.value._loadAfterBeforeload(url); } catch (_) { /* noop */ }
  }

  function close() {
    if (!IS_MOBILE_APP) return;
    try { inAppBrowserRef.value?.close(); } catch (_) { /* noop */ }
  }

  onMounted(() => {
    if (!IS_MOBILE_APP) return;
    watch(modalsOpen, (list) => {
      if (!inAppBrowserRef.value) return;
      const anyOpen = list?.length > 0;
      if (anyOpen) setTimeout(() => hide(), 0);
      else setTimeout(() => show(), 0);
    }, { deep: true, immediate: false });

    // accountsChanged events
    watch(() => ({
      addr: activeAccount.value.address,
      protocol: activeAccount.value.protocol,
    }), ({ addr, protocol }) => {
      if (!inAppBrowserRef.value) return;
      const isEvm = protocol === PROTOCOLS.ethereum || protocol === PROTOCOLS.bnb;
      emitEthereumEvent('accountsChanged', isEvm && addr ? [addr] : []);
    }, { immediate: true });

    // chainChanged events (throttled)
    let lastChainHex = '';
    let chainChangeTimer: any;
    watch(() => ({
      eth: ethActiveNetworkSettings.value.chainId,
      bnb: bnbActiveNetworkSettings.value.chainId,
      protocol: activeAccount.value.protocol,
    }), ({ eth, bnb, protocol }) => {
      if (!inAppBrowserRef.value) return;
      const chainDec = protocol === PROTOCOLS.bnb ? bnb : eth;
      if (!chainDec) return;
      const chainHex = `0x${BigInt(chainDec).toString(16)}`;
      if (chainHex === lastChainHex) return;
      clearTimeout(chainChangeTimer);
      chainChangeTimer = setTimeout(() => {
        lastChainHex = chainHex;
        emitEthereumEvent('chainChanged', chainHex);
      }, 200);
    }, { immediate: true });
  });

  onUnmounted(() => {
    try {
      if (iabShareWalletInfoInterval.value) clearInterval(iabShareWalletInfoInterval.value);
    } catch (_) { /* noop */ }
    iabShareWalletInfoInterval.value = undefined as any;
    try { inAppBrowserRef.value?.close(); } catch (_) { /* noop */ }
    inAppBrowserRef.value = undefined;
  });

  return {
    open,
    refresh,
    close,
    navigate,
    isOpen,
    currentUrl,
  };
}
