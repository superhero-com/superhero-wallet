import {
  AeSdkWallet,
  METHODS,
  Node,
  RpcInternalError,
  RpcNoNetworkById,
  RpcRejectedByUserError,
} from '@aeternity/aepp-sdk';
import { cloneDeep } from 'lodash-es';
import type { IApprovalSourceTab, INetwork } from '@/types';
import {
  NETWORK_NAME_MAINNET,
  NETWORK_NAME_MAX_LENGTH,
  NETWORK_NAME_TESTNET,
  NETWORK_TYPE_CUSTOM,
  PROTOCOLS,
} from '@/constants';
import { isUrlValid, sleep } from '@/utils';
import { useNetworks } from '@/composables/networks';
import { usePermissions } from '@/composables/permissions';
import { AE_NETWORK_MAINNET_ID, AE_NETWORK_TESTNET_ID } from '@/protocols/aeternity/config';

type NetworkToSelect = Parameters<
  ConstructorParameters<typeof AeSdkWallet>[0]['onAskToSelectNetwork']
>[1];

export interface IAeppNetworkSelection {
  name: string;
  networkId?: string;
  /** Switches back, and removes the network if the request added it */
  revert?: () => void;
}

const NODE_STATUS_TIMEOUT = 5000;

/** E.g. `ae_mainnet`, `ae_uat` and the ids of hyperchains */
const NETWORK_ID_REGEX = /^[\w.-]{1,64}$/;

/** The wallet's own networks, known without asking their nodes */
const DEFAULT_NETWORK_NAMES: Record<string, string> = {
  [AE_NETWORK_MAINNET_ID]: NETWORK_NAME_MAINNET,
  [AE_NETWORK_TESTNET_ID]: NETWORK_NAME_TESTNET,
};

function normalizeNodeUrl(value: string): string {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new RpcInternalError();
    }
    return url.href.replace(/\/+$/, '');
  } catch {
    throw new RpcInternalError();
  }
}

async function getNetworkId(nodeUrl: string): Promise<string> {
  const node = new Node(nodeUrl, { retryCount: 0 });
  // The SDK's version check asks for the status first, without the request's timeout
  const { networkId } = await Promise.race([
    node.getStatus({ requestOptions: { timeout: NODE_STATUS_TIMEOUT } }),
    sleep(NODE_STATUS_TIMEOUT).then(() => { throw new RpcInternalError(); }),
  ]);
  if (typeof networkId !== 'string' || !networkId) throw new RpcInternalError();
  return networkId;
}

/** Of the saved networks, the first one whose node reports the id. */
function findNetworkById(networks: INetwork[], networkId: string): Promise<INetwork> {
  // An unrelated offline node must not delay selecting a reachable network.
  return new Promise((resolve, reject) => {
    Promise.all(networks.map(async (network) => {
      try {
        if (await getNetworkId(network.protocols.aeternity.nodeUrl) === networkId) {
          resolve(network);
        }
      } catch {
        // Unavailable nodes cannot identify the requested network.
      }
    })).then(() => reject(new RpcNoNetworkById(networkId)));
  });
}

function isSameNodeUrl(first: string, second: string): boolean {
  try {
    return normalizeNodeUrl(first) === normalizeNodeUrl(second);
  } catch {
    return false;
  }
}

export async function selectAeppNetwork(
  params: NetworkToSelect,
  origin: string,
  currentNetworkId?: string,
  sourceTab?: IApprovalSourceTab,
): Promise<IAeppNetworkSelection> {
  const {
    activeNetwork,
    networks,
    addCustomNetwork,
    removeCustomNetwork,
    switchNetwork,
  } = useNetworks();
  const { askPermission } = usePermissions();
  if (!params || typeof params !== 'object') throw new RpcInternalError();
  if (('networkId' in params) === ('nodeUrl' in params)) throw new RpcInternalError();

  let target: INetwork | undefined;
  let nodeUrl: string;
  let networkId: string;
  if ('networkId' in params && typeof params.networkId === 'string' && params.networkId) {
    ({ networkId } = params);
    if (networkId === currentNetworkId) return { name: activeNetwork.value.name, networkId };
    target = networks.value[DEFAULT_NETWORK_NAMES[networkId]]
      ?? await findNetworkById(Object.values(networks.value), networkId);
    nodeUrl = target.protocols.aeternity.nodeUrl;
  } else if ('nodeUrl' in params && typeof params.nodeUrl === 'string' && params.nodeUrl) {
    // The rule of the network form, e.g. no IP address
    if (!isUrlValid(params.nodeUrl)) throw new RpcInternalError();
    nodeUrl = normalizeNodeUrl(params.nodeUrl);
    target = Object.values(networks.value).find(
      (network) => isSameNodeUrl(network.protocols.aeternity.nodeUrl, nodeUrl),
    );
    if (isSameNodeUrl(activeNetwork.value.protocols.aeternity.nodeUrl, nodeUrl)) {
      return { name: activeNetwork.value.name, networkId: currentNetworkId };
    }
    try {
      networkId = await getNetworkId(nodeUrl);
    } catch {
      throw new RpcInternalError();
    }
    // Shown, and it names the network to add
    if (!target && !NETWORK_ID_REGEX.test(networkId)) throw new RpcInternalError();
  } else {
    throw new RpcInternalError();
  }

  function getUniqueName() {
    const baseName = networkId.slice(0, NETWORK_NAME_MAX_LENGTH);
    let name = baseName;
    let index = 2;
    while (networks.value[name]) {
      const suffix = ` (${index})`;
      name = `${baseName.slice(0, NETWORK_NAME_MAX_LENGTH - suffix.length)}${suffix}`;
      index += 1;
    }
    return name;
  }

  const isNewNetwork = !target;
  const name = target?.name ?? getUniqueName();
  if (!await askPermission(METHODS.updateNetwork, origin, {
    protocol: PROTOCOLS.aeternity,
    ...sourceTab,
    networkName: name,
    nodeUrl,
    networkId,
    isNewNetwork,
  })) {
    throw new RpcRejectedByUserError();
  }

  if (target) {
    // The saved network may have been edited or deleted while approval was open.
    if (!isSameNodeUrl(networks.value[name]?.protocols.aeternity.nodeUrl, nodeUrl)) {
      throw new RpcNoNetworkById(networkId);
    }
  } else {
    target = {
      name: getUniqueName(),
      type: NETWORK_TYPE_CUSTOM,
      protocols: {
        ...cloneDeep(activeNetwork.value.protocols),
        aeternity: {
          nodeUrl,
          middlewareUrl: '',
          backendUrl: '',
          explorerUrl: '',
        },
      },
    };
    addCustomNetwork(target);
  }
  const previousName = activeNetwork.value.name;
  const targetName = target.name;
  switchNetwork(targetName);
  return {
    name: targetName,
    networkId,
    revert: (previousName === targetName) ? undefined : () => {
      switchNetwork(networks.value[previousName] ? previousName : NETWORK_NAME_MAINNET);
      if (isNewNetwork) removeCustomNetwork(targetName);
    },
  };
}
