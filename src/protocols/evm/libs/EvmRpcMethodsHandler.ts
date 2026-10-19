import { ref } from 'vue';
import { METHODS, Tag } from '@aeternity/aepp-sdk';
import {
  bytesToHex,
  fromWei,
  hexToBytes,
  isAddress,
  numberToHex,
  toChecksumAddress,
  toWei,
  utf8ToBytes,
} from 'web3-utils';
import { sign, signMessageWithPrivateKey } from 'web3-eth-accounts';
import { isEmpty } from 'lodash-es';

import type {
  AppOriginSource,
  IModalProps,
  ISignModalResolution,
  Protocol,
} from '@/types';
import type { IEthRpcMethodParameters, EthRpcSupportedMethods } from '@/protocols/ethereum/types';

import { createAppData, fetchJson, watchUntilTruthy } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { withGasHeadroom } from '@/protocols/evm/helpers';
import {
  getSignedTypedData,
  hashTypedData,
  type ITypedData,
} from '@/protocols/evm/helpers/hashTypedData';
import { toEvmRpcParams } from '@/protocols/evm/helpers/toEvmRpcParams';
import { useEthNetworkSettings } from '@/protocols/ethereum/composables/ethNetworkSettings';
import { useBnbNetworkSettings } from '@/protocols/bnb/composables/bnbNetworkSettings';
import { useAvalancheNetworkSettings } from '@/protocols/avalanche/composables/avalancheNetworkSettings';
import { useEthFeeCalculation } from '@/protocols/ethereum/composables/ethFeeCalculation';
import { usePolygonNetworkSettings } from '@/protocols/polygonPos/composables/polygonPosNetworkSettings';
import {
  ETH_CONTRACT_ID,
  ETH_RPC_METHODS,
  ETH_RPC_NODE_METHODS,
  ETH_RPC_WALLET_EVENTS,
} from '@/protocols/ethereum/config';
import { AVALANCHE_CONTRACT_ID } from '@/protocols/avalanche/config';
import { BNB_CONTRACT_ID } from '@/protocols/bnb/config';
import { POLYGON_POS_CONTRACT_ID } from '@/protocols/polygonPos/config';

import {
  CONNECT_PERMISSIONS,
  EVM_PROTOCOLS,
  PROTOCOLS,
} from '@/constants';
import {
  useAccounts,
  useNetworks,
  usePermissions,
} from '@/composables';

type EvmRpcResponse = { result?: any; error?: { code: number; message: string } };

function getUnknownError(message: string) {
  return { error: { code: -32603, message } };
}

const ERROR_USER_REJECTED_REQUEST = {
  error: {
    code: 4001,
    message: 'User have rejected the request',
  },
};

const ERROR_UNAUTHORIZED = {
  error: {
    code: 4100,
    message: 'The requested account and/or method has not been authorized by the user',
  },
};

const isCheckingPermissions = ref(false);

/** WalletConnect sessions whose dapp the user let connect, kept apart from the sites' grants */
const approvedSessionTopics = new Set<string>();

export function approveWalletConnectSession(topic: string) {
  approvedSessionTopics.add(topic);
}

/** A hex message as the user reads it: its text, or the hex when it is not text */
function getMessageText(hex: string): string {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(hexToBytes(hex));
    return /[^\P{Cc}\t\n\r]/u.test(text) ? hex : text;
  } catch {
    return hex;
  }
}

async function checkOrAskEvmPermission(
  aepp: string,
  protocol: Protocol,
  originSource?: AppOriginSource,
  sessionTopic?: string,
) {
  const { checkOrAskPermission, permissions } = usePermissions();
  const { activeAccount } = useAccounts();
  await watchUntilTruthy(() => !isCheckingPermissions.value);

  isCheckingPermissions.value = true;
  try {
    const isApprovedSession = !!sessionTopic && approvedSessionTopics.has(sessionTopic);
    const permission = isApprovedSession || await checkOrAskPermission(
      METHODS.subscribeAddress,
      aepp,
      {
        protocol,
        app: aepp ? createAppData(aepp, originSource) : undefined,
        access: [
          CONNECT_PERMISSIONS.address,
          CONNECT_PERMISSIONS.networks,
          CONNECT_PERMISSIONS.transactions,
        ],
      },
    );
    if (permission && sessionTopic) {
      approveWalletConnectSession(sessionTopic);
    } else if (permission && aepp && originSource !== 'self-reported') {
      // The popup answers before the permission it stores reaches this context
      await watchUntilTruthy(() => permissions.value[new URL(aepp).host], 3000);
    }
    await watchUntilTruthy(() => !isEmpty(activeAccount.value));
    return permission;
  } finally {
    isCheckingPermissions.value = false;
  }
}

/**
 * Whether the user connected the site (even without remembering it) or approved the
 * WalletConnect session. One that is not connected gets one answer for any account,
 * so it can't tell which accounts the wallet holds.
 */
function isConnectedApp(aepp: string, originSource?: AppOriginSource) {
  if (originSource === 'self-reported') return true;
  const { permissions } = usePermissions();
  return !!aepp && !!permissions.value[new URL(aepp).host];
}

/**
 * The account a dapp asks to sign with, if the dapp was given it:
 * a WalletConnect session lists all accounts, a site gets the active one.
 */
function getRequestedAccount(protocol: Protocol, address?: string, originSource?: AppOriginSource) {
  // A wrong checksum is still accepted, as in MetaMask
  if (!address || !isAddress(address, false)) return undefined;
  const { getAccountByProtocolAndAddress, getLastActiveProtocolAccount } = useAccounts();
  const checksumAddress = toChecksumAddress(address);
  const account = (originSource === 'self-reported')
    ? getAccountByProtocolAndAddress(protocol, checksumAddress)
    : getLastActiveProtocolAccount(protocol);
  return account?.address === checksumAddress ? account : undefined;
}

function getProtocolCoinContractId(protocol: Protocol) {
  if (protocol === PROTOCOLS.bnb) return BNB_CONTRACT_ID as any;
  if (protocol === PROTOCOLS.avalanche) return AVALANCHE_CONTRACT_ID as any;
  if (protocol === PROTOCOLS.polygonPos) return POLYGON_POS_CONTRACT_ID as any;
  return ETH_CONTRACT_ID as any;
}

function parseCaipChainId(chainIdOrCaip?: string): string | undefined {
  if (!chainIdOrCaip) return undefined;
  if (chainIdOrCaip.includes(':')) return chainIdOrCaip.split(':')[1];
  // could be hex like 0x38 or decimal
  return chainIdOrCaip.startsWith('0x')
    ? BigInt(chainIdOrCaip).toString(10)
    : chainIdOrCaip;
}

/** The currently active EVM protocol if available, otherwise ethereum */
function getActiveEvmProtocol(): Protocol {
  const { activeAccount } = useAccounts();
  return EVM_PROTOCOLS.includes(activeAccount.value.protocol)
    ? activeAccount.value.protocol
    : PROTOCOLS.ethereum;
}

/** `undefined` for a chain that is not on the active network */
function selectProtocolByChainId(targetChainId?: string): Protocol | undefined {
  if (!targetChainId) return getActiveEvmProtocol();
  const { activeNetwork, networks } = useNetworks();
  const network = networks.value[activeNetwork.value.name];
  return EVM_PROTOCOLS.find((protocol) => (
    (network.protocols[protocol] as any)?.chainId?.toString() === targetChainId.toString()
  ));
}

function getActiveEvmNetworkSettings(protocol: Protocol) {
  if (protocol === PROTOCOLS.bnb) {
    const { bnbActiveNetworkSettings } = useBnbNetworkSettings();
    return {
      chainId: bnbActiveNetworkSettings.value.chainId,
      nodeUrl: bnbActiveNetworkSettings.value.nodeUrl,
    };
  }
  if (protocol === PROTOCOLS.avalanche) {
    const { avalancheActiveNetworkSettings } = useAvalancheNetworkSettings();
    return {
      chainId: avalancheActiveNetworkSettings.value.chainId,
      nodeUrl: avalancheActiveNetworkSettings.value.nodeUrl,
    };
  }
  if (protocol === PROTOCOLS.polygonPos) {
    const { polygonActiveNetworkSettings } = usePolygonNetworkSettings();
    return {
      chainId: polygonActiveNetworkSettings.value.chainId,
      nodeUrl: polygonActiveNetworkSettings.value.nodeUrl,
    };
  }
  const { ethActiveNetworkSettings } = useEthNetworkSettings();
  return {
    chainId: ethActiveNetworkSettings.value.chainId,
    nodeUrl: ethActiveNetworkSettings.value.nodeUrl,
  };
}

/** Of those the wallet answers, the ones that send or read on a chain */
const CHAIN_BOUND_METHODS: string[] = [
  ETH_RPC_METHODS.sendTransaction,
  ETH_RPC_METHODS.getBalance,
];

function getChainMismatchError(
  requestedChainId: string | bigint,
  activeChainId = getActiveEvmNetworkSettings(getActiveEvmProtocol()).chainId,
) {
  return {
    error: {
      code: -32602,
      message: `Provided chainId "${requestedChainId}" must match the active chainId "${activeChainId}"`,
    },
  };
}

async function sendToNode(
  nodeUrl: string,
  method: string,
  params: unknown[],
): Promise<EvmRpcResponse> {
  try {
    const response = await fetchJson(nodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      }),
    });
    return response?.error ? { error: response.error } : { result: response?.result ?? null };
  } catch (error: any) {
    return getUnknownError(error.message);
  }
}

export async function handleEvmRpcMethod(
  aepp: string,
  method: EthRpcSupportedMethods,
  params: IEthRpcMethodParameters,
  name?: string,
  caipChainId?: string,
  originSource?: AppOriginSource,
  /** Of the WalletConnect session the request came in */
  sessionTopic?: string,
): Promise<EvmRpcResponse> {
  const { checkPermission, checkOrAskPermission, removePermission } = usePermissions();
  const { getAccountByProtocolAndAddress, getLastActiveProtocolAccount } = useAccounts();
  const { activeNetwork, networks, switchNetwork } = useNetworks();

  const requestedChainId = parseCaipChainId(caipChainId) || parseCaipChainId(params?.chainId);
  const protocolOfChain = selectProtocolByChainId(requestedChainId);
  // The rest don't depend on the chain, e.g. a message signature, or name a chain to switch to
  if (!protocolOfChain && CHAIN_BOUND_METHODS.includes(method)) {
    return getChainMismatchError(requestedChainId!);
  }
  const protocol = protocolOfChain ?? getActiveEvmProtocol();
  const { chainId, nodeUrl } = getActiveEvmNetworkSettings(protocol);

  if (method === ETH_RPC_METHODS.requestPermissions) {
    return (await checkOrAskEvmPermission(aepp, protocol, originSource, sessionTopic))
      ? { result: { eth_accounts: true } }
      : ERROR_USER_REJECTED_REQUEST;
  }

  if (method === ETH_RPC_METHODS.getAccounts) {
    // A WalletConnect session already holds its accounts
    if (originSource === 'self-reported' || checkPermission(new URL(aepp).host, METHODS.connect)) {
      const evmAccount = getLastActiveProtocolAccount(protocol);

      return {
        result: evmAccount?.address
          ? [evmAccount?.address]
          : [],
      };
    }
    return { result: [] };
  }

  if (method === ETH_RPC_METHODS.requestAccounts) {
    if (await checkOrAskEvmPermission(aepp, protocol, originSource, sessionTopic)) {
      // ensure we emit connect event for EIP-1193 consumers
      const account = getLastActiveProtocolAccount(protocol)!;
      try {
        const preferredChainId = `0x${BigInt(chainId).toString(16)}`;
        // Guard browser for non-extension environments
        if (typeof browser !== 'undefined' && browser?.runtime?.sendMessage) {
          browser.runtime.sendMessage({
            superheroWalletApproved: true,
            method: ETH_RPC_WALLET_EVENTS.chainChanged,
            result: preferredChainId,
            type: 'result',
          });
        }
      } catch (_) { /* noop */ }
      return { result: [account.address] };
    }
    return ERROR_USER_REJECTED_REQUEST;
  }

  if (method === ETH_RPC_METHODS.revokePermissions) {
    if (sessionTopic) {
      approvedSessionTopics.delete(sessionTopic);
    }
    // The URL a WalletConnect dapp claims may be a site the user connected
    if (originSource !== 'self-reported') {
      removePermission(new URL(aepp).host);
    }
    return { result: null };
  }

  if (method === ETH_RPC_METHODS.getBalance) {
    let balance: string;
    const adapter = ProtocolAdapterFactory.getAdapter(protocol);
    try {
      balance = await adapter.fetchBalance(toChecksumAddress(params?.address!));
    } catch (error: any) {
      return getUnknownError(error.message);
    }
    return { result: numberToHex(toWei(balance || '0', 'ether')) };
  }
  if (method === ETH_RPC_METHODS.getChainId) {
    return {
      result: `0x${BigInt((networks.value[activeNetwork.value.name].protocols[protocol] as any).chainId).toString(16)}`,
    };
  }
  if (method === ETH_RPC_METHODS.switchNetwork) {
    if (!isConnectedApp(aepp, originSource)) return ERROR_UNAUTHORIZED;
    const network = Object.values(networks.value)
      .find(({ protocols }) => (
        (protocols[protocol] as any).chainId === Number(params?.chainId).toString()
      ));
    if (network) {
      switchNetwork(network.name);
      return { result: null };
    }
    return {
      error: {
        code: 4902,
        message: `Chain ${params?.chainId} is currently not supported`,
      },
    };
  }
  if (method === ETH_RPC_METHODS.sendTransaction) {
    if (!isConnectedApp(aepp, originSource)) return ERROR_UNAUTHORIZED;
    const evmAccount = getRequestedAccount(protocol, params.from, originSource);
    if (!evmAccount) return ERROR_UNAUTHORIZED;

    const { updateFeeList, maxFeePerGas } = useEthFeeCalculation(protocol);

    await updateFeeList();

    const adapter = ProtocolAdapterFactory.getAdapter(protocol);

    const url = aepp;

    let gasHex = params.gas;
    if (!gasHex) {
      const estimation = await sendToNode(nodeUrl, ETH_RPC_NODE_METHODS.estimateGas, [{
        from: params.from,
        to: params.to,
        value: params.value,
        data: params.data,
      }]);
      if (estimation.error) return estimation;
      gasHex = numberToHex(withGasHeadroom(BigInt(estimation.result)));
    }

    const gas = Number(gasHex);
    const senderId = evmAccount.address;
    const recipientId = toChecksumAddress(params.to!);
    const isCoinTransfer = !params.data;
    const tag = isCoinTransfer ? Tag.SpendTx : Tag.ContractCallTx;
    const modalProps: IModalProps = {
      protocol,
      app: {
        href: url,
        host: url ? new URL(url).hostname : '',
        name: name || url,
        originSource,
      },
      tx: {
        amount: params.value ? +fromWei(params.value, 'ether') : 0,
        fee: gas * +(maxFeePerGas.value || 0),
        gas,
        contractId: (isCoinTransfer) ? getProtocolCoinContractId(protocol) : recipientId,
        type: Tag[tag],
        tag,
        senderId,
        recipientId,
        data: params.data,
      },
      fromAccount: senderId,
    };

    const permitted = await checkOrAskPermission(
      METHODS.sign,
      url,
      modalProps,
    );
    if (permitted) {
      if (adapter?.transferPreparedTransaction) {
        try {
          const actionResult = await adapter.transferPreparedTransaction({
            ...params,
            from: senderId,
            gas: gasHex,
          });
          return actionResult?.hash
            ? { result: actionResult?.hash }
            : getUnknownError('Failed to sign and send transaction');
        } catch (error: any) {
          return getUnknownError(error.message);
        }
      }
    }
    return ERROR_USER_REJECTED_REQUEST;
  }
  if (method === ETH_RPC_METHODS.signPersonal) {
    if (!isConnectedApp(aepp, originSource)) return ERROR_UNAUTHORIZED;
    const { data } = params;
    if (typeof data !== 'string') {
      return { error: { code: -32602, message: 'Missing the message to sign' } };
    }
    // "0x…" or "0X…" is bytes as in MetaMask, anything else a text as ethers and viem verify it
    const isHexMessage = /^0x[\da-f]*$/i.test(data);
    if (isHexMessage && data.length % 2) {
      return { error: { code: -32602, message: 'Expected whole bytes in hex' } };
    }
    // `sign` would read any hex-like text as bytes, so a text goes in as its bytes
    const messageHex = isHexMessage ? `0x${data.slice(2)}` : bytesToHex(utf8ToBytes(data));
    const requestedAccount = getRequestedAccount(protocol, params.address, originSource);
    if (params.address && !requestedAccount) return ERROR_UNAUTHORIZED;

    let selectedAddress: string | undefined;
    const permitted = await checkOrAskPermission(
      METHODS.signMessage,
      aepp,
      {
        protocol,
        app: aepp ? createAppData(aepp, originSource) : undefined,
        message: isHexMessage ? getMessageText(messageHex) : data,
        fromAccount: requestedAccount?.address,
      },
      (resolution: ISignModalResolution) => { selectedAddress = resolution?.selectedAddress; },
    );
    // Without an address the dapp takes a signature of the account the user picked
    const evmAccount = requestedAccount
      ?? (selectedAddress ? getAccountByProtocolAndAddress(protocol, selectedAddress) : undefined)
      ?? getLastActiveProtocolAccount(protocol);
    if (permitted && evmAccount?.secretKey) {
      try {
        return { result: sign(messageHex, evmAccount.secretKey).signature };
      } catch (e: any) {
        return getUnknownError(e.message);
      }
    }
    return ERROR_USER_REJECTED_REQUEST;
  }

  if (method === ETH_RPC_METHODS.signTypedDataV4) {
    if (!isConnectedApp(aepp, originSource)) return ERROR_UNAUTHORIZED;
    let typedData: ITypedData;
    let hash: string;
    let domainChainId: bigint | undefined;
    try {
      typedData = JSON.parse(params.data!);
      hash = hashTypedData(typedData);
      if (typedData.domain?.chainId != null) {
        domainChainId = BigInt(typedData.domain.chainId as string);
      }
    } catch (e: any) {
      return { error: { code: -32602, message: e.message } };
    }
    // As in MetaMask: a signature for another chain could be replayed there
    if (domainChainId !== undefined && domainChainId !== BigInt(chainId)) {
      return getChainMismatchError(domainChainId, chainId);
    }

    const evmAccount = getRequestedAccount(protocol, params.address, originSource);
    if (!evmAccount) return ERROR_UNAUTHORIZED;

    const permitted = await checkOrAskPermission(
      METHODS.signTypedData,
      aepp,
      {
        protocol,
        app: aepp ? createAppData(aepp, originSource) : undefined,
        message: JSON.stringify(getSignedTypedData(typedData), null, 2),
        fromAccount: evmAccount.address,
      },
    );
    if (permitted && evmAccount.secretKey) {
      try {
        return { result: signMessageWithPrivateKey(hash, evmAccount.secretKey).signature };
      } catch (e: any) {
        return getUnknownError(e.message);
      }
    }
    return ERROR_USER_REJECTED_REQUEST;
  }

  if (method === ETH_RPC_METHODS.web3ClientVersion) {
    return { result: `Superhero Wallet/v${process.env.npm_package_version}` };
  }

  // EIP-5792: Wallet Capabilities – respond with empty object if queried
  if ((method as string) === 'wallet_getCapabilities') {
    return { result: {} };
  }

  // eslint-disable-next-line no-console
  console.warn(`Method ${method} is not supported.`);
  return { error: { code: -32004, message: `Method "${method}" is not supported` } };
}

const NODE_METHODS: string[] = Object.values(ETH_RPC_NODE_METHODS);

/**
 * Answer an EIP-1193 request: one that reads the chain on the node of the requested chain,
 * the rest by the wallet.
 */
export async function handleEvmRpcRequest(
  aepp: string,
  method: string,
  params: unknown,
  name?: string,
  caipChainId?: string,
  originSource?: AppOriginSource,
  sessionTopic?: string,
): Promise<EvmRpcResponse> {
  const positionalParams = Array.isArray(params) ? params : [];
  // A dapp waits for an answer, also when e.g. its address is malformed
  try {
    if (NODE_METHODS.includes(method)) {
      const requestedChainId = parseCaipChainId(caipChainId);
      const protocol = selectProtocolByChainId(requestedChainId);
      if (!protocol) {
        return getChainMismatchError(requestedChainId!);
      }
      const { nodeUrl } = getActiveEvmNetworkSettings(protocol);
      return await sendToNode(nodeUrl, method, positionalParams);
    }
    return await handleEvmRpcMethod(
      aepp,
      method as EthRpcSupportedMethods,
      toEvmRpcParams(method, positionalParams),
      name,
      caipChainId,
      originSource,
      sessionTopic,
    );
  } catch (error: any) {
    return getUnknownError(error.message);
  }
}
