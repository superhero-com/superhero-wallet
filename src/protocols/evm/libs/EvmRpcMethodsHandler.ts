import { ref } from 'vue';
import { METHODS, Tag } from '@aeternity/aepp-sdk';
import {
  fromWei,
  toChecksumAddress,
  toWei,
  hexToString,
} from 'web3-utils';
import { sign } from 'web3-eth-accounts';
import Web3Eth, { getBlock, getTransaction, getTransactionReceipt } from 'web3-eth';
import { FMT_BYTES, FMT_NUMBER } from 'web3-types';
import { isEmpty } from 'lodash-es';

import type { IModalProps, Protocol } from '@/types';
import type { IEthRpcMethodParameters, EthRpcSupportedMethods } from '@/protocols/ethereum/types';

import { watchUntilTruthy } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { EtherscanService, EtherscanDefaultResponse } from '@/protocols/ethereum/libs/EtherscanService';
import { useEthNetworkSettings } from '@/protocols/ethereum/composables/ethNetworkSettings';
import { useBnbNetworkSettings } from '@/protocols/bnb/composables/bnbNetworkSettings';
import { useEthFeeCalculation } from '@/protocols/ethereum/composables/ethFeeCalculation';
import { usePolygonNetworkSettings } from '@/protocols/polygonPos/composables/polygonPosNetworkSettings';
import {
  ETH_CONTRACT_ID,
  ETH_RPC_ETHERSCAN_PROXY_METHODS,
  ETH_RPC_METHODS,
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

async function checkOrAskEvmPermission(aepp: string, protocol: Protocol) {
  const { checkOrAskPermission } = usePermissions();
  const { activeAccount } = useAccounts();
  await watchUntilTruthy(() => !isCheckingPermissions.value);

  isCheckingPermissions.value = true;
  const permission = await checkOrAskPermission(
    METHODS.subscribeAddress,
    aepp,
    {
      protocol,
      access: [
        CONNECT_PERMISSIONS.address,
        CONNECT_PERMISSIONS.networks,
        CONNECT_PERMISSIONS.transactions,
      ],
    },
  );
  await watchUntilTruthy(() => !isEmpty(activeAccount.value));
  isCheckingPermissions.value = false;

  return permission;
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

function normalizeValueToHex(value?: unknown): string {
  try {
    if (value == null) return '0x0';
    if (typeof value === 'bigint') return `0x${(value as bigint).toString(16)}`;
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || value < 0) return '0x0';
      return `0x${(BigInt as any)(Math.trunc(value)).toString(16)}`;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return '0x0';
      if (/^0x[0-9a-fA-F]+$/.test(trimmed)) return trimmed;
      if (/^\d+$/.test(trimmed)) return `0x${(BigInt as any)(trimmed).toString(16)}`;
      const sci = trimmed.match(/^(\d+)e(\d+)$/i);
      if (sci) {
        const base = (BigInt as any)(sci[1]);
        const exp = (BigInt as any)(sci[2]);
        return `0x${(base * ((BigInt as any)(10) ** exp)).toString(16)}`;
      }
      return '0x0';
    }
    const anyVal: any = value as any;
    if (anyVal?.toHexString && typeof anyVal.toHexString === 'function') {
      const hex = anyVal.toHexString();
      return hex.startsWith('0x') ? hex : `0x${String(hex)}`;
    }
    if (anyVal?.toString && typeof anyVal.toString === 'function') {
      const str = anyVal.toString(10);
      if (/^\d+$/.test(str)) return `0x${(BigInt as any)(str).toString(16)}`;
    }
  } catch (_) { /* noop */ }
  return '0x0';
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
    const {
      bnbActiveNetworkSettings,
      bnbActiveNetworkPredefinedSettings,
    } = useBnbNetworkSettings();
    return {
      chainId: bnbActiveNetworkSettings.value.chainId,
      nodeUrl: bnbActiveNetworkSettings.value.nodeUrl,
      predefined: bnbActiveNetworkPredefinedSettings.value,
    };
  }
  if (protocol === PROTOCOLS.polygonPos) {
    const {
      polygonActiveNetworkSettings,
      polygonActiveNetworkPredefinedSettings,
    } = usePolygonNetworkSettings();
    return {
      chainId: polygonActiveNetworkSettings.value.chainId,
      nodeUrl: polygonActiveNetworkSettings.value.nodeUrl,
      predefined: polygonActiveNetworkPredefinedSettings.value,
    };
  }
  const { ethActiveNetworkSettings, ethActiveNetworkPredefinedSettings } = useEthNetworkSettings();
  return {
    chainId: ethActiveNetworkSettings.value.chainId,
    nodeUrl: ethActiveNetworkSettings.value.nodeUrl,
    predefined: ethActiveNetworkPredefinedSettings.value,
  };
}

export async function handleEvmRpcMethod(
  aepp: string,
  method: EthRpcSupportedMethods,
  params: IEthRpcMethodParameters,
  name?: string,
  caipChainId?: string,
): Promise<{ result?: any; error?: { code: number; message: string } }> {
  const { checkPermission, checkOrAskPermission, removePermission } = usePermissions();
  const { getLastActiveProtocolAccount } = useAccounts();
  const { activeNetwork, networks, switchNetwork } = useNetworks();

  const requestedChainId = parseCaipChainId(caipChainId) || parseCaipChainId(params?.chainId);
  const protocol = selectProtocolByChainId(requestedChainId);
  const { chainId, nodeUrl, predefined } = getActiveEvmNetworkSettings(protocol);

  if (method === ETH_RPC_METHODS.requestPermissions) {
    return (await checkOrAskEvmPermission(aepp, protocol))
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
    if (await checkOrAskEvmPermission(aepp, protocol)) {
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
    const addressParam = Array.isArray(params) ? (params as any)[0] : (params as any)?.address;
    try {
      balance = await adapter.fetchBalance(toChecksumAddress(addressParam!));
    } catch (error: any) {
      return getUnknownError(error.message);
    }
    try {
      const weiStr = balance ? toWei(balance, 'ether') : '0';
      const hex = Number.isSafeInteger(Number(weiStr))
        ? `0x${Number(weiStr).toString(16)}`
        : `0x${(BigInt as any)(weiStr).toString(16)}`;
      return { result: hex };
    } catch (e: any) {
      return getUnknownError(e.message || 'Failed to format balance');
    }
  }
  if (method === ETH_RPC_METHODS.getChainId) {
    return {
      result: `0x${BigInt((networks.value[activeNetwork.value.name].protocols[protocol] as any).chainId).toString(16)}`,
    };
  }
  if (method === ETH_RPC_METHODS.switchNetwork) {
    // Support both EIP-3326 param shapes and hex/decimal chainIds
    const requestedParam = (params as any)?.chainId
      ?? (Array.isArray(params) ? (params as any)?.[0]?.chainId : undefined);
    if (!requestedParam) {
      return { error: { code: -32602, message: 'Invalid params: chainId is required' } };
    }
    const requestedDec = parseCaipChainId(String(requestedParam));
    const network = requestedDec && Object.values(networks.value)
      .find(({ protocols }) => (
        (protocols[protocol] as any).chainId === String(requestedDec)
      ));
    if (network) {
      switchNetwork(network.name);
      return { result: null };
    }
    return {
      error: {
        code: 4902,
        message: `Chain ${requestedDec ?? requestedParam} is currently not supported`,
      },
    };
  }
  if (method === ETH_RPC_METHODS.getBlockNumber) {
    let currentBlock;

    try {
      currentBlock = await getBlock(
        new Web3Eth(nodeUrl),
        'latest',
        true,
        { number: FMT_NUMBER.HEX, bytes: FMT_BYTES.HEX },
      );
    } catch (error: any) {
      return getUnknownError(error.message);
    }
    let hex = '0x0';
    if (currentBlock && currentBlock.number != null) {
      const blockNumber: any = currentBlock.number as any;
      if (typeof blockNumber === 'string') {
        hex = blockNumber.startsWith('0x') ? blockNumber : `0x${blockNumber}`;
      } else {
        const integerBlockNumber = Math.trunc(blockNumber as number);
        hex = `0x${(BigInt as any)(integerBlockNumber).toString(16)}`;
      }
    }
    return { result: hex };
  }
  if (method === ETH_RPC_METHODS.sendTransaction) {
    const { updateFeeList, maxFeePerGas } = useEthFeeCalculation(protocol);

    await updateFeeList();

    const adapter = ProtocolAdapterFactory.getAdapter(protocol);

    const url = aepp;

    const p = (Array.isArray(params) ? (params as any)[0] : (params as any)) || ({} as any);
    let estimatedGas = null as any;
    try {
      if (!p?.gas) {
        const valueHex = normalizeValueToHex(p?.value);
        const estimateResp = await new EtherscanService(
          predefined.middlewareUrl,
          chainId,
        ).fetchFromApi({
          module: 'proxy',
          action: 'eth_estimateGas',
          from: toChecksumAddress(p.from!),
          to: p.to,
          value: valueHex,
          data: p.data || '0x',
        });
        if (!estimateResp || !String(estimateResp.message || '').startsWith('OK') || !estimateResp.result) {
          throw new Error(typeof estimateResp?.result === 'string' ? estimateResp.result : 'Failed to estimate gas');
        }
        estimatedGas = estimateResp.result;
      }
    } catch (_) {
      // fall back to a conservative gas limit if estimation API fails
      const isContractCall = !!(p?.data && p.data !== '0x');
      estimatedGas = isContractCall ? '0x493e0' : '0x5208'; // 300000 for contract calls, 21000 for transfers
    }

    const gasHexOrNum = p?.gas ?? estimatedGas;
    const gas = Number(gasHexOrNum);
    const senderId = toChecksumAddress(p.from!);
    const recipientId = toChecksumAddress(p.to!);
    const isCoinTransfer = !p.data;
    const tag = isCoinTransfer ? Tag.SpendTx : Tag.ContractCallTx;
    const modalProps: IModalProps = {
      protocol,
      app: { href: url, host: url ? new URL(url).hostname : '', name: name || url },
      tx: {
        amount: p.value ? +fromWei(p.value, 'ether') : 0,
        fee: gas * +(maxFeePerGas.value || 0),
        gas,
        contractId: (isCoinTransfer) ? getProtocolCoinContractId(protocol) : recipientId,
        type: Tag[tag],
        tag,
        senderId,
        recipientId,
        data: p.data,
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
          const actionParams = { ...p, gas: gasHexOrNum } as any;
          const actionResult = await adapter.transferPreparedTransaction(actionParams);
          if (!actionResult?.hash) return getUnknownError('Failed to sign and send transaction');
          return { result: actionResult.hash };
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

  if (
    method !== ETH_RPC_WALLET_EVENTS.chainChanged
    && method !== ETH_RPC_WALLET_EVENTS.accountsChanged
    && Object.values(ETH_RPC_ETHERSCAN_PROXY_METHODS).includes(method)
  ) {
    const apiUrl = predefined.middlewareUrl;
    let response: EtherscanDefaultResponse | null;
    try {
      // If we can, serve directly from node to avoid Etherscan limitations
      // eth_getTransactionByHash
      if (method === ETH_RPC_ETHERSCAN_PROXY_METHODS.getTransactionByHash) {
        const txhash = Array.isArray(params)
          ? (params as any)[0]
          : (params as any)?.txhash || (params as any)?.hash;
        const web3 = new Web3Eth(nodeUrl);
        const tx = txhash
          ? await getTransaction(web3, txhash, { number: FMT_NUMBER.HEX, bytes: FMT_BYTES.HEX })
          : null;
        if (tx) return { result: tx };
      }
      // eth_getTransactionReceipt
      if (method === ETH_RPC_ETHERSCAN_PROXY_METHODS.getTransactionReceipt) {
        const txhash = Array.isArray(params)
          ? (params as any)[0]
          : (params as any)?.txhash || (params as any)?.hash;
        const web3 = new Web3Eth(nodeUrl);
        const rc = txhash
          ? await getTransactionReceipt(
            web3,
            txhash,
            { number: FMT_NUMBER.HEX, bytes: FMT_BYTES.HEX },
          )
          : null;
        if (rc) return { result: rc };
      }
      // Fallback to Etherscan for other proxy calls
      response = await new EtherscanService(apiUrl, chainId)
        .fetchFromApi({
          module: 'proxy',
          action: method,
          ...(Array.isArray(params) ? {} : (params as any)),
        });
      if (!response || !String(response.message || '').startsWith('OK')) {
        // For estimateGas, provide a safe fallback instead of erroring
        if (method === ETH_RPC_ETHERSCAN_PROXY_METHODS.estimateGas) {
          return { result: '0x493e0' }; // 300000
        }
        return getUnknownError(typeof response?.result === 'string' ? response.result : 'Unknown error');
      }
      return { result: response.result };
    } catch (error: any) {
      return getUnknownError(error.message);
    }
  }

  // EIP-5792: Wallet Capabilities – respond with empty object if queried
  if ((method as string) === 'wallet_getCapabilities') {
    return { result: {} };
  }

  // eslint-disable-next-line no-console
  console.warn(`Method ${method} is not supported.`);
  return { error: { code: -32004, message: `Method "${method}" is not supported` } };
}
