/* eslint-disable no-console */
/* eslint-disable no-return-await */
/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable consistent-return */
/* eslint-disable no-unsafe-finally */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-use-before-define */
/* eslint-disable vue/max-len */
// eslint-disable-next-line max-classes-per-file
const METAMASK_ERROR_USER_REJECTED_REQUEST = 4001;
const METAMASK_ERROR_CHAIN_NOT_ADDED_TO_METAMASK = 4902;
const METAMASK_ERROR_BLANKET_ERROR = -32603;
const METAMASK_METHOD_NOT_SUPPORTED = -32004;
const METAMASK_INVALID_METHOD_PARAMS = -32602;

interface IJsonRpcSuccess<TResult> {
  readonly jsonrpc: '2.0';
  readonly id: string | number | null;
  readonly result: TResult;
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

class Future<T> implements PromiseLike<T> {
  private promise: Promise<T>;

  private resolveFunction: (value: T | PromiseLike<T>) => void;

  private rejectFunction: (reason: Error) => void;

  constructor() {
    let resolveFunction: (value: T | PromiseLike<T>) => void;
    let rejectFunction: (reason: Error) => void;
    this.promise = new Promise((resolve: (value: T | PromiseLike<T>) => void, reject: (reason: Error) => void) => {
      resolveFunction = resolve;
      rejectFunction = reject;
    });
    // the function passed to the Promise constructor is called before the constructor returns, so we can be sure the resolve and reject functions have been set by here even if the compiler can't verify
    this.resolveFunction = resolveFunction!;
    this.rejectFunction = rejectFunction!;
  }

  public readonly then = <TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): PromiseLike<TResult1 | TResult2> => this.promise.then(onfulfilled, onrejected);

  public readonly resolve = (value: T | PromiseLike<T>) => this.resolveFunction!(value);

  public readonly reject = (reason: Error) => this.rejectFunction!(reason);
}

class EthereumJsonRpcError extends Error {
  constructor(public readonly code: number, message: string, public readonly data?: object) {
    super(message);
    this.name = this.constructor.name;
  }
}

type MessageMethodAndParams = {
  readonly method: string;
  readonly params?: readonly unknown[];
}

type InterceptedRequestBase = {
  readonly superheroWalletApproved: true;
  readonly requestId?: number;
  readonly method: string;
  readonly params?: readonly unknown[];
  readonly subscription?: string;
}

type InterceptedRequestForwardWithResult = InterceptedRequestBase & {
  readonly type: 'result';
  readonly result: unknown;
}

type InterceptedRequestForwardWithError = InterceptedRequestBase & {
  readonly type: 'result';
  readonly error: {
    readonly code: number;
    readonly message: string;
    readonly data?: object;
  };
}

type InterceptedRequestForwardToSigner = InterceptedRequestBase & { readonly type: 'forwardToSigner'; readonly replyWithSignersReply?: true }

type InterceptedRequestForward = InterceptedRequestForwardWithResult | InterceptedRequestForwardWithError | InterceptedRequestForwardToSigner

interface ProviderConnectInfo {
  readonly chainId: string;
}

interface ProviderRpcError extends Error {
  message: string;
  code: number;
  data?: unknown;
}

interface ProviderMessage {
  readonly type: string;
  readonly data: unknown;
}

type AnyCallBack = ((message: ProviderMessage) => void)
  | ((connectInfo: ProviderConnectInfo) => void)
  | ((accounts: readonly string[]) => void)
  | ((error: ProviderRpcError) => void)
  | ((chainId: string) => void)

type EthereumRequest = (methodAndParams: { readonly method: string; readonly params?: readonly unknown[] }) => Promise<unknown>

type InjectFunctions = {
  request: EthereumRequest;
  send: unknown;
  sendAsync: unknown;
  on: (kind: OnMessage, callback: AnyCallBack) => WindowEthereum;
  removeListener: (kind: OnMessage, callback: AnyCallBack) => WindowEthereum;
  isConnected?: () => boolean;
  enable: () => void;
}

type UnsupportedWindowEthereumMethods = {
  // We don't support these
  once?: () => void;
  prependListener?: () => void;
  prependOnceListener?: () => void;
  _metamask?: {
    isUnlocked: () => Promise<boolean>;
    requestBatch: () => Promise<void>;
  };
}

type WindowEthereum = InjectFunctions & {
  isBraveWallet?: boolean;
  isMetaMask?: boolean;
  isSuperheroWallet?: boolean;
  providerMap?: Map<string, WindowEthereum>; // coinbase does not inject `isCoinbaseWallet` to the window.ethereum if there's already other wallets present (eg, Metamask), but instead injects a provider map that contains all these providers
  isCoinbaseWallet?: boolean;

  // for metamask compatibility mode
  selectedAddress?: string | null;
  chainId?: string;
  networkVersion?: string;
}
interface Window {
  dispatchEvent: (event: Event) => boolean;
  ethereum?: WindowEthereum;
  web3?: {
    currentProvider: WindowEthereum;
    accounts: readonly string[];
  };
}

interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

function shouldInjectProvider() {
  return doctypeCheck() && suffixCheck() && documentElementCheck();
}

/**
 * Checks the doctype of the current document if it exists
 */
function doctypeCheck() {
  const { doctype } = window.document;
  if (doctype) {
    return doctype.name === 'html';
  }
  return true;
}

/**
 * Returns whether or not the extension (suffix) of the current document is prohibited
 *
 * This checks {@code window.location.pathname} against a set of file extensions
 * that we should not inject the provider into. This check is indifferent of
 * query parameters in the location.
 */
function suffixCheck() {
  const prohibitedTypes = [/\.xml$/u, /\.pdf$/u];
  const currentUrl = window.location.pathname;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < prohibitedTypes.length; i++) {
    if (prohibitedTypes[i].test(currentUrl)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks the documentElement of the current document
 */
function documentElementCheck() {
  const documentElement = document.documentElement.nodeName;
  if (documentElement) {
    return documentElement.toLowerCase() === 'html';
  }
  return true;
}

type SingleSendAsyncParam = { readonly id: string | number | null; readonly method: string; readonly params: readonly unknown[] }

type OnMessage = 'accountsChanged' | 'message' | 'connect' | 'close' | 'disconnect' | 'chainChanged'
type Signer = 'NoSigner' | 'NotRecognizedSigner' | 'MetaMask' | 'Brave' | 'CoinbaseWallet'

class SuperheroWalletMessageListener {
  private connected = false;

  private requestId = 0;

  private metamaskCompatibilityMode = true;

  private signerWindowEthereumRequest: EthereumRequest | undefined = undefined;

  private readonly outstandingRequests: Map<number, Future<unknown> > = new Map();

  private readonly onMessageCallBacks: Set<((message: ProviderMessage) => void)> = new Set();

  private readonly onConnectCallBacks: Set<((connectInfo: ProviderConnectInfo) => void)> = new Set();

  private readonly onAccountsChangedCallBacks: Set<((accounts: readonly string[]) => void)> = new Set();

  private readonly onDisconnectCallBacks: Set<((error: ProviderRpcError) => void)> = new Set();

  private readonly onChainChangedCallBacks: Set<((chainId: string) => void)> = new Set();

  private currentAddress = '';

  private currentChainId = '';

  private currentSigner: Signer = 'NoSigner';

  private waitForAccountsFromWallet: Future<boolean> | undefined = undefined;

  private signerAccounts: string[] = [];

  private pendingSignerAddressRequest: Future<boolean> | undefined = undefined;

  public constructor() {
    if (shouldInjectProvider()) {
      this.injectEthereumIntoWindow();
    }
    this.onPageLoad();
  }

  private readonly WindowEthereumIsConnected = () => this.connected;

  private readonly sendMessageToBackgroundPage = async (messageMethodAndParams: MessageMethodAndParams) => {
    // eslint-disable-next-line no-plusplus
    this.requestId++;
    const pendingRequestId = this.requestId;
    const future = new Future<unknown>();
    this.outstandingRequests.set(pendingRequestId, future);
    try {
      window.postMessage({
        superheroWalletRequest: true,
        method: messageMethodAndParams.method,
        params: messageMethodAndParams.params,
        usingSuperheroWalletWithoutSigner: this.signerWindowEthereumRequest === undefined,
        requestId: pendingRequestId,
      }, '*');
      return await future;
    } finally {
      this.outstandingRequests.delete(pendingRequestId);
    }
  };

  // sends a message to superheroWallets background script
  private readonly WindowEthereumRequest = async (methodAndParams: { readonly method: string; readonly params?: readonly unknown[] }) => {
    try {
      // make a message that the background script will catch and reply us. We'll wait until the background script replies to us and return only after that
      return await this.sendMessageToBackgroundPage({ method: methodAndParams.method, params: methodAndParams.params });
    } catch (error: unknown) {
      if (error instanceof Error) throw error;
      throw new EthereumJsonRpcError(METAMASK_ERROR_BLANKET_ERROR, 'Unexpected thrown value.', { error, request: methodAndParams });
    }
  };

  private readonly WindowEthereumSend = (payload: { readonly id: string | number | null; readonly method: string; readonly params: readonly unknown[] } | string, maybeCallBack: undefined | ((error: IJsonRpcError | null, response: IJsonRpcSuccess<unknown> | null) => void)) => {
    const fullPayload = typeof payload === 'string' ? { method: payload, id: 1, params: [] } : payload;
    if (maybeCallBack !== undefined && typeof maybeCallBack === 'function') return this.WindowEthereumSendAsync(fullPayload, maybeCallBack);
    if (this.metamaskCompatibilityMode) {
      if (window.ethereum === undefined) throw new Error('window.ethereum is missing');
      switch (fullPayload.method) {
        case 'eth_coinbase':
        case 'eth_accounts': return { jsonrpc: '2.0', id: fullPayload.id, result: window.ethereum.selectedAddress === undefined || window.ethereum.selectedAddress === null ? [] : [window.ethereum.selectedAddress] };
        case 'net_version': return { jsonrpc: '2.0', id: fullPayload.id, result: window.ethereum.networkVersion };
        case 'eth_chainId': return { jsonrpc: '2.0', id: fullPayload.id, result: window.ethereum.chainId };
        default: throw new EthereumJsonRpcError(METAMASK_INVALID_METHOD_PARAMS, `Invalid method parameter for window.ethereum.send: ${fullPayload.method}`);
      }
    }
    throw new EthereumJsonRpcError(METAMASK_METHOD_NOT_SUPPORTED, 'Method not supported (window.ethereum.send).');
  };

  private readonly WindowEthereumSendAsync = async (payload: SingleSendAsyncParam | SingleSendAsyncParam[], callback: (error: IJsonRpcError | null, response: IJsonRpcSuccess<unknown> | null) => void) => {
    const payloadArray = Array.isArray(payload) ? payload : [payload];
    payloadArray.map((param) => this.WindowEthereumRequest(param)
      .then((result) => {
        callback(null, { jsonrpc: '2.0', id: param.id, result });
      })
    // since `request(...)` only throws things shaped like `JsonRpcError`, we can rely on it having those properties.
      .catch((error) => {
        if (SuperheroWalletMessageListener.getErrorCodeAndMessage(error)) {
          const data = 'data' in error && typeof error.data === 'object' && error.data !== null ? error.data : {};
          const stack = 'stack' in error && typeof error.stack === 'string' ? { stack: error.stack } : {};
          return callback({
            jsonrpc: '2.0',
            id: param.id,
            error: {
              code: error.code,
              message: error.message,
              data: { ...data, ...stack },
            },
          }, null);
        }
        return callback({
          jsonrpc: '2.0',
          id: param.id,
          error: { message: 'unknown error', code: METAMASK_ERROR_BLANKET_ERROR },
        }, null);
      }));
  };

  static exhaustivenessCheck = (_thing: never) => {};

  private readonly WindowEthereumOn = (kind: OnMessage, callback: AnyCallBack) => {
    if (window.ethereum === undefined) throw new Error('window.ethereum is not defined');
    switch (kind) {
      case 'accountsChanged':
        this.onAccountsChangedCallBacks.add(callback as (accounts: readonly string[]) => void);
        break;
      case 'message':
        this.onMessageCallBacks.add(callback as (message: ProviderMessage) => void);
        break;
      case 'connect':
        this.onConnectCallBacks.add(callback as (connectInfo: ProviderConnectInfo) => void);
        break;
      case 'close': // close is deprecated on eip-1193 by disconnect but its still used by dapps (MyEtherWallet)
        this.onDisconnectCallBacks.add(callback as (error: ProviderRpcError) => void);
        break;
      case 'disconnect':
        this.onDisconnectCallBacks.add(callback as (error: ProviderRpcError) => void);
        break;
      case 'chainChanged':
        this.onChainChangedCallBacks.add(callback as (chainId: string) => void);
        break;
      default: SuperheroWalletMessageListener.exhaustivenessCheck(kind);
    }
    return window.ethereum;
  };

  private readonly WindowEthereumRemoveListener = (kind: OnMessage, callback: AnyCallBack) => {
    if (window.ethereum === undefined) throw new Error('window.ethereum is not defined');
    switch (kind) {
      case 'accountsChanged':
        this.onAccountsChangedCallBacks.delete(callback as (accounts: readonly string[]) => void);
        break;
      case 'message':
        this.onMessageCallBacks.delete(callback as (message: ProviderMessage) => void);
        break;
      case 'connect':
        this.onConnectCallBacks.delete(callback as (connectInfo: ProviderConnectInfo) => void);
        break;
      case 'close': // close is deprecated on eip-1193 by disconnect but its still used by dapps (MyEtherWallet)
        this.onDisconnectCallBacks.delete(callback as (error: ProviderRpcError) => void);
        break;
      case 'disconnect':
        this.onDisconnectCallBacks.delete(callback as (error: ProviderRpcError) => void);
        break;
      case 'chainChanged':
        this.onChainChangedCallBacks.delete(callback as (chainId: string) => void);
        break;
      default: SuperheroWalletMessageListener.exhaustivenessCheck(kind);
    }
    return window.ethereum;
  };

  private readonly WindowEthereumEnable = async () => this.WindowEthereumRequest({ method: 'eth_requestAccounts' });

  // attempts to call signer for eth_accounts
  private readonly getAccountsFromSigner = async () => {
    if (this.signerWindowEthereumRequest === undefined) return;
    try {
      const reply = await this.signerWindowEthereumRequest({ method: 'eth_accounts', params: [] });
      if (!Array.isArray(reply)) throw new Error('Signer returned something else than an array');
      await this.sendMessageToBackgroundPage({ method: 'eth_accounts_reply', params: [{ type: 'success', accounts: this.signerAccounts, requestAccounts: false }] });
    } catch (error: unknown) {
      if (SuperheroWalletMessageListener.getErrorCodeAndMessage(error)) return await this.sendMessageToBackgroundPage({ method: 'eth_accounts_reply', params: [{ type: 'error', requestAccounts: false, error }] });
      if (error instanceof Error) return await this.sendMessageToBackgroundPage({ method: 'eth_accounts_reply', params: [{ type: 'error', requestAccounts: false, error: { message: error.message, code: METAMASK_ERROR_BLANKET_ERROR } }] });
      return await this.sendMessageToBackgroundPage({ method: 'eth_accounts_reply', params: [{ type: 'error', requestAccounts: false, error: { message: 'unknown error', code: METAMASK_ERROR_BLANKET_ERROR } }] });
    }
  };

  private static isStringArray(arr: unknown[]): arr is string[] {
    return arr.every((item) => typeof item === 'string');
  }

  // attempts to call signer for eth_requestAccounts
  private readonly requestAccountsFromSigner = async () => {
    if (this.signerWindowEthereumRequest === undefined) return;
    if (this.pendingSignerAddressRequest !== undefined) {
      await this.pendingSignerAddressRequest;
      await this.sendMessageToBackgroundPage({ method: 'eth_accounts_reply', params: [{ type: 'success', accounts: this.signerAccounts, requestAccounts: true }] });
      return;
    }
    this.pendingSignerAddressRequest = new Future();
    try {
      const reply = await this.signerWindowEthereumRequest({ method: 'eth_requestAccounts', params: [] });
      if (!Array.isArray(reply)) throw new Error('Signer returned something else than an array');
      if (!SuperheroWalletMessageListener.isStringArray(reply)) throw new Error('Signer did not return a string array');
      this.signerAccounts = reply;
      await this.sendMessageToBackgroundPage({ method: 'eth_accounts_reply', params: [{ type: 'success', accounts: this.signerAccounts, requestAccounts: true }] });
    } catch (error: unknown) {
      if (SuperheroWalletMessageListener.getErrorCodeAndMessage(error)) return await this.sendMessageToBackgroundPage({ method: 'eth_accounts_reply', params: [{ type: 'error', requestAccounts: true, error }] });
      if (error instanceof Error) return await this.sendMessageToBackgroundPage({ method: 'eth_accounts_reply', params: [{ type: 'error', requestAccounts: true, error: { message: error.message, code: METAMASK_ERROR_BLANKET_ERROR } }] });
      return await this.sendMessageToBackgroundPage({ method: 'eth_accounts_reply', params: [{ type: 'error', requestAccounts: true, error: { message: 'unknown error', code: METAMASK_ERROR_BLANKET_ERROR } }] });
    } finally {
      this.pendingSignerAddressRequest.resolve(true);
      this.pendingSignerAddressRequest = undefined;
    }
  };

  private readonly requestChainIdFromSigner = async () => {
    if (this.signerWindowEthereumRequest === undefined) return;
    try {
      const reply = await this.signerWindowEthereumRequest({ method: 'eth_chainId', params: [] });
      if (typeof reply !== 'string') return;
      return await this.sendMessageToBackgroundPage({ method: 'signer_chainChanged', params: [reply] });
    } catch (e) {
      console.error('failed to get chain Id from signer');
      console.error(e);
      return await this.sendMessageToBackgroundPage({ method: 'signer_chainChanged', params: ['0x1'] });
    }
  };

  private static readonly getErrorCodeAndMessage = (error: unknown): error is { code: number; message: string } => {
    if (typeof error !== 'object') return false;
    if (error === null) return false;
    if (!('code' in error) || !('message' in error)) return false;
    if (typeof (error as { code: unknown }).code !== 'number') return false;
    if (typeof (error as { message: unknown }).message !== 'string') return false;
    return true;
  };

  private readonly requestChangeChainFromSigner = async (chainId: string) => {
    if (this.signerWindowEthereumRequest === undefined) return;

    try {
      const reply = await this.signerWindowEthereumRequest({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
      if (reply !== null) return;
      await this.sendMessageToBackgroundPage({ method: 'wallet_switchEthereumChain_reply', params: [{ accept: true, chainId }] });
    } catch (error: unknown) {
      if (SuperheroWalletMessageListener.getErrorCodeAndMessage(error) && (error.code === METAMASK_ERROR_USER_REJECTED_REQUEST || error.code === METAMASK_ERROR_CHAIN_NOT_ADDED_TO_METAMASK)) {
        await this.sendMessageToBackgroundPage({ method: 'wallet_switchEthereumChain_reply', params: [{ accept: false, chainId, error }] });
      }
      throw error;
    }
  };

  private readonly handleReplyRequest = async (replyRequest: InterceptedRequestForwardWithResult) => {
    try {
      if (replyRequest.subscription !== undefined) {
        for (const callback of this.onMessageCallBacks) {
          callback({ type: 'eth_subscription', data: replyRequest.result });
        }
        return;
      }
      // inform callbacks
      switch (replyRequest.method) {
        case 'accountsChanged': {
          const reply = replyRequest.result as readonly string[];
          const replyAddress = reply.length > 0 ? reply[0] : '';
          if (this.currentAddress === replyAddress) return;
          this.currentAddress = replyAddress;
          if (this.metamaskCompatibilityMode && window.ethereum !== undefined) {
            try { window.ethereum.selectedAddress = replyAddress; } catch (error) {}
            if ('web3' in window && window.web3 !== undefined) try { window.web3.accounts = reply; } catch (error) {}
          }
          for (const callback of this.onAccountsChangedCallBacks) {
            callback(reply);
          }
          return;
        }
        case 'connect': {
          if (this.connected) return;
          this.connected = true;
          for (const callback of this.onConnectCallBacks) {
            callback({ chainId: replyRequest.result as string });
          }
          return;
        }
        case 'disconnect': {
          if (!this.connected) return;
          this.connected = false;
          for (const callback of this.onDisconnectCallBacks) {
            callback({ name: 'disconnect', code: METAMASK_ERROR_USER_REJECTED_REQUEST, message: 'User refused access to the wallet' });
          }
          return;
        }
        case 'chainChanged': {
          const reply = replyRequest.result as string;
          if (this.currentChainId === reply) return;
          this.currentChainId = reply;
          if (this.metamaskCompatibilityMode && this.signerWindowEthereumRequest === undefined && window.ethereum !== undefined) {
            try { window.ethereum.chainId = reply; } catch (error) {}
            try { window.ethereum.networkVersion = Number(reply).toString(10); } catch (error) {}
          }
          for (const callback of this.onChainChangedCallBacks) {
            callback(reply);
          }
          return;
        }
        case 'request_signer_to_eth_requestAccounts': return await this.requestAccountsFromSigner();
        case 'request_signer_to_eth_accounts': return await this.getAccountsFromSigner();
        case 'request_signer_to_wallet_switchEthereumChain': return await this.requestChangeChainFromSigner(replyRequest.result as string);
        case 'request_signer_chainId': return await this.requestChainIdFromSigner();
        default: break;
      }
    } finally {
      if (replyRequest.requestId === undefined) return;
      const pending = this.outstandingRequests.get(replyRequest.requestId);
      if (pending === undefined) return;
      return pending.resolve(replyRequest.result);
    }
  };

  // coinbase wallet sends different kind of message on inject, this function identifies that and reinjects
  private checkIfCoinbaseInjectionMessageAndInject(messageEvent: unknown) {
    if (
      typeof messageEvent !== 'object'
      || messageEvent === null
      || !('data' in messageEvent)
      || typeof messageEvent.data !== 'object'
      || messageEvent.data === null
      || !('type' in messageEvent.data)
      || !('data' in messageEvent.data)
      || messageEvent.data.data === null
      || typeof messageEvent.data.data !== 'object'
      || !('action' in messageEvent.data.data)
    ) return;
    if (messageEvent.data.type === 'extensionUIRequest' && messageEvent.data.data.action === 'loadWalletLinkProvider') {
      return this.injectEthereumIntoWindow();
    }
  }

  private parseRpcError = (maybeErrorObject: unknown) => {
    if (typeof maybeErrorObject !== 'object' || maybeErrorObject === null) return new EthereumJsonRpcError(METAMASK_ERROR_BLANKET_ERROR, 'Unexpected thrown value.', { rawError: maybeErrorObject });
    if ('code' in maybeErrorObject
      && maybeErrorObject.code !== undefined && typeof maybeErrorObject.code === 'number'
      && 'message' in maybeErrorObject && maybeErrorObject.message !== undefined && typeof maybeErrorObject.message === 'string'
    ) {
      return new EthereumJsonRpcError(maybeErrorObject.code, maybeErrorObject.message, 'data' in maybeErrorObject && typeof maybeErrorObject.data === 'object' && maybeErrorObject.data !== null ? maybeErrorObject.data : undefined);
    }
    return new EthereumJsonRpcError(METAMASK_ERROR_BLANKET_ERROR, 'Unexpected thrown value.', maybeErrorObject);
  };

  public readonly onMessage = async (messageEvent: unknown) => {
    this.checkIfCoinbaseInjectionMessageAndInject(messageEvent);
    if (
      typeof messageEvent !== 'object'
      || messageEvent === null
      || !('data' in messageEvent)
      || typeof messageEvent.data !== 'object'
      || messageEvent.data === null
      || !('superheroWalletApproved' in messageEvent.data)
    ) return;
    try {
      if (!('ethereum' in window) || !window.ethereum) throw new Error('window.ethereum missing');
      if (!('method' in messageEvent.data)) throw new Error('missing method field');
      if (!('type' in messageEvent)) throw new Error('missing type field');
      const forwardRequest = messageEvent.data as InterceptedRequestForward; // use 'as' here as we don't want to inject funtypes here
      if (forwardRequest.type === 'result' && 'error' in forwardRequest) {
        if (forwardRequest.requestId === undefined) throw new EthereumJsonRpcError(forwardRequest.error.code, forwardRequest.error.message, forwardRequest.error.data);
        const pending = this.outstandingRequests.get(forwardRequest.requestId);
        if (pending === undefined) throw new EthereumJsonRpcError(forwardRequest.error.code, forwardRequest.error.message, forwardRequest.error.data);
        return pending.reject(new EthereumJsonRpcError(forwardRequest.error.code, forwardRequest.error.message, forwardRequest.error.data));
      }
      if (forwardRequest.type === 'result' && 'result' in forwardRequest) {
        if (this.metamaskCompatibilityMode && this.signerWindowEthereumRequest === undefined && window.ethereum !== undefined) {
          switch (messageEvent.data.method) {
            case 'eth_requestAccounts':
            case 'eth_accounts': {
              if (!Array.isArray(forwardRequest.result) || forwardRequest.result === null) throw new Error('wrong type');
              const addrArray = forwardRequest.result as string[];
              const addr = addrArray.length > 0 ? addrArray[0] : '';
              try { window.ethereum.selectedAddress = addr; } catch (e) {}
              if ('web3' in window && window.web3 !== undefined) try { window.web3.accounts = addrArray; } catch (e) {}
              this.currentAddress = addr;
              break;
            }
            case 'eth_chainId': {
              if (typeof forwardRequest.result !== 'string') throw new Error('wrong type');
              const chainId = forwardRequest.result as string;
              try { window.ethereum.chainId = chainId; } catch (e) {}
              try { window.ethereum.networkVersion = Number(chainId).toString(10); } catch (e) {}
              this.currentChainId = chainId;
              break;
            }
            default:
          }
        }
        await this.handleReplyRequest(forwardRequest);
        return;
      }
      if (forwardRequest.type !== 'forwardToSigner') throw new Error('type: forwardToSigner missing');
      if (forwardRequest.requestId === undefined) throw new Error('requestId missing');
      const pendingRequest = this.outstandingRequests.get(forwardRequest.requestId);
      if (pendingRequest === undefined) throw new Error('Request did not exist anymore');
      const signerRequest = this.signerWindowEthereumRequest;
      if (signerRequest === undefined) throw new Error('We are in wallet mode and should not forward to an external wallet');

      const sendToSignerWithCatchError = async () => {
        try {
          const reply = await signerRequest({ method: forwardRequest.method, params: 'params' in forwardRequest ? forwardRequest.params : [] });
          return { success: true as const, forwardRequest, reply };
        } catch (error: unknown) {
          return { success: false as const, forwardRequest, error };
        }
      };
      const signerReply = await sendToSignerWithCatchError();
      try {
        if ('replyWithSignersReply' in forwardRequest) {
          if (signerReply.success) {
            await this.handleReplyRequest({
              requestId: forwardRequest.requestId,
              superheroWalletApproved: true,
              method: forwardRequest.method,
              type: 'result',
              result: signerReply.reply,
            });
            return;
          }
          return pendingRequest.reject(this.parseRpcError(signerReply.error));
        }
        await this.sendMessageToBackgroundPage({ method: 'signer_reply', params: [signerReply] });
      } catch (error: unknown) {
        if (error instanceof Error) return pendingRequest.reject(error);
        return pendingRequest.reject(this.parseRpcError(error));
      }
    } catch (error: unknown) {
      console.error(messageEvent);
      console.error(error);
      await this.sendMessageToBackgroundPage({ method: 'SuperheroWalletError', params: [error] });
      const requestId = 'requestId' in messageEvent.data && typeof messageEvent.data.requestId === 'number' ? messageEvent.data.requestId : undefined;
      if (requestId === undefined) return;
      const pendingRequest = this.outstandingRequests.get(requestId);
      if (pendingRequest === undefined) throw new Error('Request did not exist anymore');
      if (error instanceof Error) return pendingRequest.reject(error);
      return pendingRequest.reject(this.parseRpcError(error));
    }
  };

  private readonly unsupportedMethods = (windowEthereum: WindowEthereum & UnsupportedWindowEthereumMethods | undefined) => {
    const unsupportedError = (method: string) => console.error(`The application tried to call a deprecated or non-standard method: '${method}'. Please contact the application developer to fix this issue.`);
    return {
      once: (() => unsupportedError('window.ethereum.once()')),
      prependListener: (() => unsupportedError('window.ethereum.prependListener()')),
      prependOnceListener: (() => unsupportedError('window.ethereum.prependOnceListener()')),
      _metamask: {
        isUnlocked: (async () => {
          unsupportedError('window.ethereum._metamask.isUnlocked()');
          return this.connected;
        }),
        requestBatch: async () => unsupportedError('window.ethereum._metamask.requestBatch()'),
      },
    };
  };

  private readonly onPageLoad = () => {
    const superheroWalletMessageListener = this;
    function announceProvider() {
      const info: EIP6963ProviderInfo = {
        uuid: '010f6849-a205-46a9-a721-c6ca943d479a',
        name: 'Superhero Wallet',
        icon: 'data:image/svg+xml,%3Csvg%20data-v-d6e638c8%3D%22%22%20viewBox%3D%220%200%2034%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20class%3D%22icon%20home-icon%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M0%208.09196L9.00282%200H24.9972L34%208.09196L17.0479%2024L0%208.09196ZM10.0085%202.48276H14.893L25.3324%2012.7356L17%2020.5517L3.73521%208.13794L10.0085%202.48276Z%22%20fill%3D%22%231161fe%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E',
        rdns: 'com.superhero.wallet',
      };

      if (window.ethereum === undefined || !window.ethereum.isSuperheroWallet) superheroWalletMessageListener.injectEthereumIntoWindow();
      const provider = window.ethereum;
      if (provider === undefined) throw new Error('Superhero Wallet provider was not initialized');
      window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info, provider }) }));
    }
    window.addEventListener('eip6963:requestProvider', () => { announceProvider(); });
    announceProvider();
  };

  public readonly injectEthereumIntoWindow = () => {
    const superheroWalletProvider = {
      isSuperheroWallet: true,
      isConnected: this.WindowEthereumIsConnected.bind(window.ethereum),
      request: this.WindowEthereumRequest.bind(window.ethereum),
      send: this.WindowEthereumSend.bind(window.ethereum),
      sendAsync: this.WindowEthereumSendAsync.bind(window.ethereum),
      on: this.WindowEthereumOn.bind(window.ethereum),
      removeListener: this.WindowEthereumRemoveListener.bind(window.ethereum),
      enable: this.WindowEthereumEnable.bind(window.ethereum),
      ...this.unsupportedMethods(window.ethereum),
    };
    Object.defineProperties(window, {
      superheroWallet: {
        value: superheroWalletProvider,
        configurable: false,
        writable: false,
      },
      ethereum: {
        get() {
          // @ts-expect-error
          return window.superheroWalletRouter.currentProvider;
        },
        set(newProvider) {
          // @ts-expect-error
          window.superheroWalletRouter?.addProvider(newProvider);
        },
        configurable: false,
      },
      superheroWalletRouter: {
        value: {
          superheroWalletProvider,
          lastInjectedProvider: window.ethereum,
          currentProvider: superheroWalletProvider,
          providers: [
            superheroWalletProvider,
            ...(window.ethereum ? [window.ethereum] : []),
          ],
          addProvider(provider: any) {
            // @ts-expect-error
            if (!window.superheroWalletRouter?.providers?.includes(provider)) {
              // @ts-expect-error
              window.superheroWalletRouter?.providers?.push(provider);
            }
            if (superheroWalletProvider !== provider) {
              // @ts-expect-error
              window.superheroWalletRouter.lastInjectedProvider = provider;
            }
          },
        },
        configurable: false,
        writable: false,
      },
    });
    this.connected = true;
  };
}

function injectSuperheroWallet() {
  const superheroWalletMessageListener = new SuperheroWalletMessageListener();
  window.addEventListener('message', superheroWalletMessageListener.onMessage);
  window.dispatchEvent(new Event('ethereum#initialized'));
}

injectSuperheroWallet();
