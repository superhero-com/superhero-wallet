import { ref } from 'vue';
import { METHODS, Tag } from '@aeternity/aepp-sdk';
import {
  fromWei,
  toChecksumAddress,
  toWei,
  hexToString,
} from 'web3-utils';
import { sign } from 'web3-eth-accounts';
import Web3Eth, { getBlock } from 'web3-eth';
import { DEFAULT_RETURN_FORMAT } from 'web3-types';
import { isEmpty } from 'lodash-es';

import type { IModalProps } from '@/types';
import type { IEthRpcMethodParameters, EthRpcSupportedMethods } from '@/protocols/ethereum/types';

import { watchUntilTruthy } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { EtherscanService, EtherscanDefaultResponse } from '@/protocols/ethereum/libs/EtherscanService';
import { useEthNetworkSettings } from '@/protocols/ethereum/composables/ethNetworkSettings';
import { useEthFeeCalculation } from '@/protocols/ethereum/composables/ethFeeCalculation';
import {
  ETH_CONTRACT_ID,
  ETH_RPC_ETHERSCAN_PROXY_METHODS,
  ETH_RPC_METHODS,
  ETH_RPC_WALLET_EVENTS,
} from '@/protocols/ethereum/config';

import {
  CONNECT_PERMISSIONS,
  PROTOCOLS,
} from '@/constants';
import {
  useAccounts,
  useNetworks,
  usePermissions,
} from '@/composables';

function getUnknownError(message: string) {
  // ERROR_BLANKET_ERROR
  return { error: { code: -32603, message } };
}

const ERROR_USER_REJECTED_REQUEST = {
  error: {
    code: 4001,
    message: 'User have rejected the request',
  },
};

const isCheckingPermissions = ref(false);

async function checkOrAskEthPermission(aepp: string) {
  const { checkOrAskPermission } = usePermissions();
  const { activeAccount } = useAccounts();
  await watchUntilTruthy(() => !isCheckingPermissions.value);

  isCheckingPermissions.value = true;
  const permission = await checkOrAskPermission(
    METHODS.subscribeAddress,
    aepp,
    {
      protocol: PROTOCOLS.ethereum,
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

export async function handleEthereumRpcMethod(
  aepp: string,
  method: EthRpcSupportedMethods,
  params: IEthRpcMethodParameters,
  name?: string,
): Promise<{ result?: any; error?: { code: number; message: string } }> {
  const { checkPermission, checkOrAskPermission, removePermission } = usePermissions();
  const { getLastActiveProtocolAccount } = useAccounts();
  const { activeNetwork, networks, switchNetwork } = useNetworks();
  const { ethActiveNetworkSettings, ethActiveNetworkPredefinedSettings } = useEthNetworkSettings();

  if (method === ETH_RPC_METHODS.requestPermissions) {
    return (await checkOrAskEthPermission(aepp))
      ? { result: { eth_accounts: true } }
      : ERROR_USER_REJECTED_REQUEST;
  }

  if (method === ETH_RPC_METHODS.getAccounts) {
    const { host } = new URL(aepp);

    if (checkPermission(host, METHODS.connect)) {
      const ethereumAccount = getLastActiveProtocolAccount(PROTOCOLS.ethereum);

      return {
        result: ethereumAccount?.address
          ? [ethereumAccount?.address]
          : [],
      };
    }
    return { result: [] };
  }

  if (method === ETH_RPC_METHODS.requestAccounts) {
    if (await checkOrAskEthPermission(aepp)) {
      return { result: [getLastActiveProtocolAccount(PROTOCOLS.ethereum)!.address] };
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
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.ethereum);
    try {
      balance = await adapter.fetchBalance(toChecksumAddress(params?.address!));
    } catch (error: any) {
      return getUnknownError(error.message);
    }
    return { result: balance ? toWei(balance, 'ether') : 0 };
  }
  if (method === ETH_RPC_METHODS.getChainId) {
    return { result: `0x${BigInt(networks.value[activeNetwork.value.name].protocols[PROTOCOLS.ethereum].chainId).toString(16)}` };
  }
  if (method === ETH_RPC_METHODS.switchNetwork) {
    const network = Object.values(networks.value)
      .find(({ protocols }) => (
        protocols[PROTOCOLS.ethereum].chainId === Number(params?.chainId).toString()
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
  if (method === ETH_RPC_METHODS.getBlockNumber) {
    let currentBlock;
    const { nodeUrl } = ethActiveNetworkSettings.value;

    try {
      currentBlock = await getBlock(new Web3Eth(nodeUrl), 'latest', true, DEFAULT_RETURN_FORMAT);
    } catch (error: any) {
      return getUnknownError(error.message);
    }
    return { result: currentBlock?.number };
  }
  if (method === ETH_RPC_METHODS.sendTransaction) {
    const { updateFeeList, maxFeePerGas } = useEthFeeCalculation();

    await updateFeeList();

    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.ethereum);

    const url = aepp;

    const estimatedGas = params?.gas ? null : (await new EtherscanService(
      ethActiveNetworkPredefinedSettings.value.middlewareUrl,
    )
      .fetchFromApi({
        module: 'proxy',
        action: 'eth_estimateGas',
        to: params.to,
        // Etherscan will fail to fetch something if there is a leading 0 after 0x
        value: `0x${Number(params.value).toString(16)}`,
        data: params.data || '0x',
      }))?.result;

    const gas = Number(params?.gas ? params?.gas : estimatedGas);
    const senderId = toChecksumAddress(params.from!);
    const recipientId = toChecksumAddress(params.to!);
    const isCoinTransfer = !params.data;
    const tag = isCoinTransfer ? Tag.SpendTx : Tag.ContractCallTx;
    const modalProps: IModalProps = {
      protocol: PROTOCOLS.ethereum,
      app: { href: url, host: url ? new URL(url).hostname : '', name: name || url },
      tx: {
        amount: params.value ? +fromWei(params.value, 'ether') : 0,
        fee: gas * +(maxFeePerGas.value || 0),
        gas,
        contractId: (isCoinTransfer) ? ETH_CONTRACT_ID : recipientId,
        type: Tag[tag],
        tag,
        senderId,
        recipientId,
        data: params.data,
      },
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
            ...(params?.gas ? {} : { gas: estimatedGas }),
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
    const ethereumAccount = getLastActiveProtocolAccount(PROTOCOLS.ethereum);

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
        protocol: PROTOCOLS.ethereum,
        message: rawMessage,
      },
    );
    if (permitted && ethereumAccount?.secretKey) {
      try {
        const signedMessage = await sign(rawMessage, `0x${Buffer.from(ethereumAccount.secretKey).toString('hex')}`);
        return { result: signedMessage.signature };
      } catch (e: any) {
        return getUnknownError(e.message);
      }
    }
    return ERROR_USER_REJECTED_REQUEST;
  }
  if (
    method !== ETH_RPC_WALLET_EVENTS.chainChanged
    && Object.values(ETH_RPC_ETHERSCAN_PROXY_METHODS).includes(method)
  ) {
    const apiUrl = ethActiveNetworkPredefinedSettings.value.middlewareUrl;
    let response: EtherscanDefaultResponse | null;
    try {
      response = await new EtherscanService(apiUrl)
        .fetchFromApi({
          module: 'proxy',
          action: method,
          ...params,
        });
      if (!response?.message?.startsWith('OK')) {
        getUnknownError(response?.result || 'Unknown error');
      }
      return { result: response?.result };
    } catch (error: any) {
      return getUnknownError(error.message);
    }
  }

  // eslint-disable-next-line no-console
  console.warn(`Method ${method} is not supported.`);
  return { error: { code: -32004, message: 'Method is not supported' } };
}
