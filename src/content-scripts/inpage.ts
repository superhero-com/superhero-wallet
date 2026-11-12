import { SUPERHERO_EIP6963_PROVIDER_INFO } from './eip6963ProviderInfo';

const METAMASK_ERROR_BLANKET_ERROR = -32603;
const METAMASK_INVALID_METHOD_PARAMS = -32602;

interface IJsonRpcSuccess {
  readonly jsonrpc: '2.0';
  readonly id: string | number | null;
  readonly result: unknown;
}

interface IJsonRpcError {
  readonly jsonrpc: '2.0';
  readonly id: string | number | null;
  readonly error: {
    readonly code: number;
    readonly message: string;
    readonly data?: unknown;
  };
}

type RequestArguments = { readonly method: string; readonly params?: readonly unknown[] };
type LegacyPayload = RequestArguments & { readonly id: string | number | null };
type LegacyCallback = (error: IJsonRpcError | null, response: IJsonRpcSuccess | null) => void;
type Listener = (payload: any) => void;

/** The content script's answer to a request, or an event of the wallet without `requestId` */
interface IWalletMessage {
  readonly method: string;
  readonly requestId?: number;
  readonly result?: unknown;
  readonly error?: IJsonRpcError['error'];
}

type WindowEthereum = {
  readonly isSuperheroWallet: true;
  isConnected: () => boolean;
  request: (args: RequestArguments) => Promise<unknown>;
  send: (payload: LegacyPayload | string, callback?: LegacyCallback) => unknown;
  sendAsync: (payload: LegacyPayload | LegacyPayload[], callback: LegacyCallback) => void;
  on: (event: string, listener: Listener) => WindowEthereum;
  removeListener: (event: string, listener: Listener) => WindowEthereum;
  enable: () => Promise<unknown>;
  once: () => void;
  prependListener: () => void;
  prependOnceListener: () => void;
  _metamask: {
    isUnlocked: () => Promise<boolean>;
    requestBatch: () => Promise<void>;
  };
  // MetaMask's legacy fields
  selectedAddress?: string | null;
  chainId?: string;
  networkVersion?: string;
};

declare global {
  interface Window {
    ethereum?: WindowEthereum;
  }
}

class EthereumJsonRpcError extends Error {
  constructor(public readonly code: number, message: string, public readonly data?: unknown) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** Not in XML documents and PDFs, as MetaMask */
function shouldInjectProvider() {
  const { doctype, documentElement } = window.document;
  return (!doctype || doctype.name === 'html')
    && !/\.(xml|pdf)$/u.test(window.location.pathname)
    && (!documentElement?.nodeName || documentElement.nodeName.toLowerCase() === 'html');
}

function toJsonRpcError(error: any): IJsonRpcError['error'] {
  if (typeof error?.code !== 'number' || typeof error?.message !== 'string') {
    return { code: METAMASK_ERROR_BLANKET_ERROR, message: 'unknown error' };
  }
  return {
    code: error.code,
    message: error.message,
    data: {
      ...(typeof error.data === 'object' && error.data !== null ? error.data : {}),
      ...(typeof error.stack === 'string' ? { stack: error.stack } : {}),
    },
  };
}

type PendingRequest = {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
};

function createProvider() {
  const pendingRequests = new Map<number, PendingRequest>();
  const listeners = new Map<string, Set<Listener>>();
  let lastRequestId = 0;
  let currentAddress: string | null = null;
  let currentChainId: string | undefined;

  function emit(event: string, payload: unknown) {
    listeners.get(event)?.forEach((listener) => {
      try {
        listener(payload);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    });
  }

  async function request({ method, params }: RequestArguments) {
    lastRequestId += 1;
    const requestId = lastRequestId;
    try {
      return await new Promise((resolve, reject) => {
        pendingRequests.set(requestId, { resolve, reject });
        window.postMessage({
          superheroWalletRequest: true,
          method,
          params,
          requestId,
        }, window.location.origin);
      });
    } finally {
      pendingRequests.delete(requestId);
    }
  }

  function sendAsync(payload: LegacyPayload | LegacyPayload[], callback: LegacyCallback) {
    (Array.isArray(payload) ? payload : [payload]).forEach(({ id, method, params }) => {
      request({ method, params }).then(
        (result) => callback(null, { jsonrpc: '2.0', id, result }),
        (error) => callback({ jsonrpc: '2.0', id, error: toJsonRpcError(error) }, null),
      );
    });
  }

  const unsupported = (method: string) => {
    // eslint-disable-next-line no-console
    console.error(`The application tried to call a deprecated or non-standard method: '${method}'. Please contact the application developer to fix this issue.`);
  };

  const provider: WindowEthereum = {
    isSuperheroWallet: true,
    isConnected: () => true,
    request,
    send(payload, callback) {
      const fullPayload = typeof payload === 'string' ? { method: payload, id: 1, params: [] } : payload;
      if (typeof callback === 'function') return sendAsync(fullPayload, callback);
      switch (fullPayload.method) {
        case 'eth_coinbase':
        case 'eth_accounts':
          return {
            jsonrpc: '2.0',
            id: fullPayload.id,
            result: provider.selectedAddress ? [provider.selectedAddress] : [],
          };
        case 'net_version': return { jsonrpc: '2.0', id: fullPayload.id, result: provider.networkVersion };
        case 'eth_chainId': return { jsonrpc: '2.0', id: fullPayload.id, result: provider.chainId };
        default:
          throw new EthereumJsonRpcError(
            METAMASK_INVALID_METHOD_PARAMS,
            `Invalid method parameter for window.ethereum.send: ${fullPayload.method}`,
          );
      }
    },
    sendAsync,
    on(event, listener) {
      listeners.set(event, (listeners.get(event) ?? new Set()).add(listener));
      return provider;
    },
    removeListener(event, listener) {
      listeners.get(event)?.delete(listener);
      return provider;
    },
    enable: () => request({ method: 'eth_requestAccounts' }),
    once: () => unsupported('window.ethereum.once()'),
    prependListener: () => unsupported('window.ethereum.prependListener()'),
    prependOnceListener: () => unsupported('window.ethereum.prependOnceListener()'),
    _metamask: {
      isUnlocked: async () => {
        unsupported('window.ethereum._metamask.isUnlocked()');
        return true;
      },
      requestBatch: async () => unsupported('window.ethereum._metamask.requestBatch()'),
    },
  };

  function setAccounts(accounts: unknown[]) {
    const address = typeof accounts[0] === 'string' ? accounts[0] : null;
    const isChanged = address !== currentAddress;
    currentAddress = address;
    provider.selectedAddress = address;
    return isChanged;
  }

  function setChainId(chainId: unknown) {
    if (typeof chainId !== 'string') return false;
    const isChanged = chainId !== currentChainId;
    currentChainId = chainId;
    provider.chainId = chainId;
    provider.networkVersion = Number(chainId).toString(10);
    return isChanged;
  }

  function onWalletEvent({ method, result }: IWalletMessage) {
    if (method === 'accountsChanged' && Array.isArray(result) && setAccounts(result)) {
      emit(method, result);
    }
    if (method === 'chainChanged' && setChainId(result)) {
      emit(method, result);
    }
  }

  function onMessage({ data, origin, source }: MessageEvent) {
    if (source !== window || origin !== window.location.origin) return;
    if (!data?.superheroWalletApproved || data.type !== 'result') return;
    const message = data as IWalletMessage;
    if (message.requestId === undefined) {
      onWalletEvent(message);
      return;
    }
    const pendingRequest = pendingRequests.get(message.requestId);
    if (!pendingRequest) return;
    if (message.error) {
      const { code, message: errorMessage, data: errorData } = message.error;
      pendingRequest.reject(new EthereumJsonRpcError(code, errorMessage, errorData));
      return;
    }
    if (
      (message.method === 'eth_accounts' || message.method === 'eth_requestAccounts')
      && Array.isArray(message.result)
    ) {
      setAccounts(message.result);
    }
    if (message.method === 'eth_chainId') {
      setChainId(message.result);
    }
    pendingRequest.resolve(message.result);
  }

  return { provider, onMessage };
}

/**
 * `window.ethereum` stays with a wallet that set it first, and another wallet may replace ours.
 * Except Brave Wallet's: by default Brave sets it but leaves it to extensions.
 * Dapps find every wallet through EIP-6963.
 */
function setGlobals(provider: WindowEthereum) {
  try {
    Object.defineProperty(window, 'superheroWallet', { value: provider });
  } catch {
    // Defined by the page
  }
  try {
    if (
      window.ethereum === undefined
      || (window.ethereum as { isBraveWallet?: boolean }).isBraveWallet
    ) {
      window.ethereum = provider;
    }
  } catch {
    // Locked by another wallet, or by Brave set to use only its own
  }
}

function injectSuperheroWallet() {
  // Frames sandboxed without `allow-same-origin` (and `file://` documents) have an
  // opaque origin, which serializes to the literal string `'null'`. `postMessage`
  // rejects that as a target origin - it only accepts a real origin, `'*'` or `'/'` -
  // so every request this provider forwards would throw a `SyntaxError`. The
  // content script stays out of those frames for the same reason, so nothing
  // would answer us anyway. Do not advertise a wallet that cannot work there.
  // `location.origin` comes from the URL and stays real in a sandboxed frame.
  // Messaging still uses it: a page global named `origin` replaces `window.origin`.
  if (!window.origin || window.origin === 'null') return;
  if (!shouldInjectProvider()) return;

  const { provider, onMessage } = createProvider();
  window.addEventListener('message', onMessage);
  setGlobals(provider);
  const announceProvider = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
    detail: Object.freeze({ info: SUPERHERO_EIP6963_PROVIDER_INFO, provider }),
  }));
  window.addEventListener('eip6963:requestProvider', announceProvider);
  announceProvider();
  window.dispatchEvent(new Event('ethereum#initialized'));
}

injectSuperheroWallet();
