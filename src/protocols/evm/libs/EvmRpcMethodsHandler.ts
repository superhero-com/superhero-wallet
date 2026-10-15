import { ref } from 'vue';
import { METHODS, Tag } from '@aeternity/aepp-sdk';
import {
  fromWei,
  numberToHex,
  toChecksumAddress,
  toWei,
  hexToString,
} from 'web3-utils';
import { sign } from 'web3-eth-accounts';
import { isEmpty } from 'lodash-es';

import type { AppOriginSource, IModalProps, Protocol } from '@/types';
import type { IEthRpcMethodParameters, EthRpcSupportedMethods } from '@/protocols/ethereum/types';

import { createAppData, fetchJson, watchUntilTruthy } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { withGasHeadroom } from '@/protocols/evm/helpers';
import { toEvmRpcParams } from '@/protocols/evm/helpers/toEvmRpcParams';
import { useEthNetworkSettings } from '@/protocols/ethereum/composables/ethNetworkSettings';
import { useBnbNetworkSettings } from '@/protocols/bnb/composables/bnbNetworkSettings';
import { useEthFeeCalculation } from '@/protocols/ethereum/composables/ethFeeCalculation';
import { usePolygonNetworkSettings } from '@/protocols/polygonPos/composables/polygonPosNetworkSettings';
import {
  ETH_CONTRACT_ID,
  ETH_RPC_METHODS,
  ETH_RPC_NODE_METHODS,
  ETH_RPC_WALLET_EVENTS,
} from '@/protocols/ethereum/config';
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

const isCheckingPermissions = ref(false);

async function checkOrAskEvmPermission(
  aepp: string,
  protocol: Protocol,
  originSource?: AppOriginSource,
) {
  const { checkOrAskPermission } = usePermissions();
  const { activeAccount } = useAccounts();
  await watchUntilTruthy(() => !isCheckingPermissions.value);

  isCheckingPermissions.value = true;
  try {
    const permission = await checkOrAskPermission(
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
    await watchUntilTruthy(() => !isEmpty(activeAccount.value));
    return permission;
  } finally {
    isCheckingPermissions.value = false;
  }
}

function getProtocolCoinContractId(protocol: Protocol) {
  if (protocol === PROTOCOLS.bnb) return BNB_CONTRACT_ID as any;
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

function selectProtocolByChainId(targetChainId?: string): Protocol {
  const { activeNetwork, networks } = useNetworks();
  const { activeAccount } = useAccounts();
  const network = networks.value[activeNetwork.value.name];
  if (targetChainId) {
    // eslint-disable-next-line no-restricted-syntax
    for (const protocol of EVM_PROTOCOLS) {
      const protoSettings: any = network.protocols[protocol];
      if (protoSettings?.chainId?.toString() === targetChainId.toString()) {
        return protocol;
      }
    }
  }
  // Fallback to currently active EVM protocol if available, otherwise ethereum
  return EVM_PROTOCOLS.includes(activeAccount.value.protocol)
    ? activeAccount.value.protocol
    : PROTOCOLS.ethereum;
}

function getActiveEvmNetworkSettings(protocol: Protocol) {
  if (protocol === PROTOCOLS.bnb) {
    const { bnbActiveNetworkSettings } = useBnbNetworkSettings();
    return {
      chainId: bnbActiveNetworkSettings.value.chainId,
      nodeUrl: bnbActiveNetworkSettings.value.nodeUrl,
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
): Promise<EvmRpcResponse> {
  const { checkPermission, checkOrAskPermission, removePermission } = usePermissions();
  const { getLastActiveProtocolAccount } = useAccounts();
  const { activeNetwork, networks, switchNetwork } = useNetworks();

  const requestedChainId = parseCaipChainId(caipChainId) || parseCaipChainId(params?.chainId);
  const protocol = selectProtocolByChainId(requestedChainId);
  const { chainId, nodeUrl } = getActiveEvmNetworkSettings(protocol);

  if (method === ETH_RPC_METHODS.requestPermissions) {
    return (await checkOrAskEvmPermission(aepp, protocol, originSource))
      ? { result: { eth_accounts: true } }
      : ERROR_USER_REJECTED_REQUEST;
  }

  if (method === ETH_RPC_METHODS.getAccounts) {
    const { host } = new URL(aepp);

    if (checkPermission(host, METHODS.connect)) {
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
    if (await checkOrAskEvmPermission(aepp, protocol, originSource)) {
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
    const { host } = new URL(aepp);
    removePermission(host);
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
    const senderId = toChecksumAddress(params.from!);
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
    const evmAccount = getLastActiveProtocolAccount(protocol);

    let rawMessage: string;

    try {
      rawMessage = hexToString(params.data!);
    } catch (e: any) {
      return { error: { code: -32602, message: e.message } };
    }

    const permitted = await checkOrAskPermission(
      METHODS.signMessage,
      aepp,
      {
        protocol,
        app: aepp ? createAppData(aepp, originSource) : undefined,
        message: rawMessage,
      },
    );
    if (permitted && evmAccount?.secretKey) {
      try {
        const signedMessage = await sign(rawMessage, `0x${Buffer.from(evmAccount.secretKey).toString('hex')}`);
        return { result: signedMessage.signature };
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
): Promise<EvmRpcResponse> {
  const positionalParams = Array.isArray(params) ? params : [];
  // A dapp waits for an answer, also when e.g. its address is malformed
  try {
    if (NODE_METHODS.includes(method)) {
      const { nodeUrl } = getActiveEvmNetworkSettings(
        selectProtocolByChainId(parseCaipChainId(caipChainId)),
      );
      return await sendToNode(nodeUrl, method, positionalParams);
    }
    return await handleEvmRpcMethod(
      aepp,
      method as EthRpcSupportedMethods,
      toEvmRpcParams(method, positionalParams),
      name,
      caipChainId,
      originSource,
    );
  } catch (error: any) {
    return getUnknownError(error.message);
  }
}
