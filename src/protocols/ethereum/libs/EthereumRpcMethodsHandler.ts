import { ref } from 'vue';
import { METHODS, Tag } from '@aeternity/aepp-sdk';
import { fromWei, toChecksumAddress, toWei } from 'web3-utils';
import Web3Eth, { getBlock } from 'web3-eth';
import { DEFAULT_RETURN_FORMAT } from 'web3-types';

import type { IModalProps } from '@/types';
import type { IEthRpcMethodParameters, EthRpcSupportedMethods } from '@/protocols/ethereum/types';

import { sleep, watchUntilTruthy } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { EtherscanService } from '@/protocols/ethereum/libs/EtherscanService';
import { useEthNetworkSettings } from '@/protocols/ethereum/composables/ethNetworkSettings';
import { useEthFeeCalculation } from '@/protocols/ethereum/composables/ethFeeCalculation';
import { ETH_CONTRACT_ID, ETH_RPC_ETHERSCAN_PROXY_METHODS, ETH_RPC_METHODS } from '@/protocols/ethereum/config';

import {
  CONNECT_PERMISSIONS,
  PERMISSION_DEFAULTS,
  PROTOCOLS,
} from '@/constants';
import {
  useAccounts,
  useNetworks,
  usePermissions,
} from '@/composables';

const isCheckingPermissions = ref(false);

async function checkOrAskEthPermission(aepp: string) {
  const {
    addPermission,
    checkOrAskPermission,
    permissions,
  } = usePermissions();

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
  const { hostname: host } = new URL(aepp);
  if (permission && !permissions.value[host]?.address) {
    // awaiting for default permissions to be synced
    // with background after being set in `checkOrAskPermission`
    await sleep(50);
    addPermission({
      ...PERMISSION_DEFAULTS,
      ...(permissions.value[host] || {}),
      address: true,
      addressList: true,
      host,
      name: host,
    });
  }
  isCheckingPermissions.value = false;

  return permission;
}

export async function handleEthereumRpcMethod(
  aepp: string,
  method: EthRpcSupportedMethods,
  params: IEthRpcMethodParameters,
  name?: string,
) {
  const { checkOrAskPermission, removePermission } = usePermissions();
  const { getLastActiveProtocolAccount } = useAccounts();
  const { activeNetwork, networks, switchNetwork } = useNetworks();
  const { ethActiveNetworkSettings, ethActiveNetworkPredefinedSettings } = useEthNetworkSettings();

  if (method === ETH_RPC_METHODS.requestPermissions) {
    return (await checkOrAskEthPermission(aepp)) ? { eth_accounts: true } : {};
  }

  if (method === ETH_RPC_METHODS.requestAccounts || method === ETH_RPC_METHODS.getAccounts) {
    return (await checkOrAskEthPermission(aepp))
      ? [getLastActiveProtocolAccount(PROTOCOLS.ethereum)!.address]
      : [];
  }

  if (method === ETH_RPC_METHODS.revokePermissions) {
    const { host } = new URL(aepp);
    removePermission(host);
    return null;
  }

  if (method === ETH_RPC_METHODS.getBalance) {
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.ethereum);
    const balance = await adapter.fetchBalance(toChecksumAddress(params?.address!));
    return balance ? toWei(balance, 'ether') : 0;
  }
  if (method === ETH_RPC_METHODS.getChainId) {
    return `0x${BigInt(networks.value[activeNetwork.value.name].protocols[PROTOCOLS.ethereum].chainId).toString(16)}`;
  }
  if (method === ETH_RPC_METHODS.switchNetwork) {
    const network = Object.values(networks.value)
      .find(({ protocols }) => (
        protocols[PROTOCOLS.ethereum].chainId === Number(params?.chainId).toString()
      ));
    if (network) {
      switchNetwork(network.name);
    }
    return null;
  }
  if (method === ETH_RPC_METHODS.getBlockNumber) {
    const { nodeUrl } = ethActiveNetworkSettings.value;
    const currentBlock = await getBlock(new Web3Eth(nodeUrl), 'latest', true, DEFAULT_RETURN_FORMAT);
    return currentBlock?.number;
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
      app: { url, host: url ? new URL(url).hostname : '', name: name || url },
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
        const actionResult = await adapter.transferPreparedTransaction({
          ...params,
          ...(params?.gas ? {} : { gas: estimatedGas }),
        });
        return actionResult?.hash ?? false;
      }
    }
    return false;
  }
  if (Object.values(ETH_RPC_ETHERSCAN_PROXY_METHODS).includes(method)) {
    const apiUrl = ethActiveNetworkPredefinedSettings.value.middlewareUrl;
    const result = await new EtherscanService(apiUrl)
      .fetchFromApi({
        module: 'proxy',
        action: method,
        ...params,
      });
    return result?.result;
  }

  // eslint-disable-next-line no-console
  console.warn(`Method ${method} is not supported.`);
  return null;
}
