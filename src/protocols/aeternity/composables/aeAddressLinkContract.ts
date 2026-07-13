import { computed } from 'vue';
import { Contract, Encoded } from '@aeternity/aepp-sdk';

import type { ChainName, NetworkTypeDefault } from '@/types';
import { NETWORK_TYPE_CUSTOM, NETWORK_TYPE_TESTNET } from '@/constants';
import { useAeSdk, useNetworks } from '@/composables';
import AddressLinkACI from '@/protocols/aeternity/aci/AddressLinkACI.json';
import type { AeAddressLinkContractApi } from '@/protocols/aeternity/types';
import {
  AE_ADDRESS_LINK_CONTRACTS,
  AE_ADDRESS_LINK_PREFERRED_NAME_PROVIDER,
} from '@/protocols/aeternity/config';

let addressLinkContract: Contract<AeAddressLinkContractApi> | undefined;
/**
 * In-flight initialization, shared so that resolving names for many accounts at
 * once (e.g. `Promise.all` over all local accounts) initializes the contract a
 * single time instead of once per concurrent caller.
 */
let addressLinkContractPromise: Promise<Contract<AeAddressLinkContractApi>> | null = null;
/**
 * The contract address the in-flight `addressLinkContractPromise` targets. Bound
 * so that a network switch mid-init does not hand a caller the previous network's
 * deployment - callers wanting a different address start their own init instead.
 */
let initializingAddress: Encoded.ContractAddress | undefined;

/**
 * Reads account data stored in the on-chain AddressLink contract.
 * Currently used to resolve an account's preferred (default) `.chain` name,
 * previously served by the tipping backend as `preferredChainName`.
 */
export function useAeAddressLinkContract() {
  const { activeNetwork } = useNetworks();
  const { getAeSdk } = useAeSdk();

  const addressLinkContractAddress = computed(
    (): Encoded.ContractAddress | undefined => {
      // Custom networks point at testnet infra (matching how the Superhero API URL
      // is resolved), so read the preferred name from the testnet deployment there.
      const networkType: NetworkTypeDefault = (activeNetwork.value.type === NETWORK_TYPE_CUSTOM)
        ? NETWORK_TYPE_TESTNET
        : activeNetwork.value.type;
      return AE_ADDRESS_LINK_CONTRACTS[networkType];
    },
  );

  async function getAddressLinkContract(): Promise<Contract<AeAddressLinkContractApi> | undefined> {
    const contractAddress = addressLinkContractAddress.value;
    if (!contractAddress) {
      return undefined;
    }
    // Reuse the cached instance while the active network's contract is unchanged.
    if (addressLinkContract?.$options.address === contractAddress) {
      return addressLinkContract;
    }
    // Reuse the in-flight init only when it targets the same deployment, so a
    // network switch mid-init doesn't return the previous network's contract.
    if (!addressLinkContractPromise || initializingAddress !== contractAddress) {
      initializingAddress = contractAddress;
      const promise = (async () => {
        const aeSdk = await getAeSdk();
        return Contract.initialize<AeAddressLinkContractApi>({
          ...aeSdk.getContext(),
          aci: AddressLinkACI,
          address: contractAddress,
        });
      })();
      addressLinkContractPromise = promise;
      promise
        .then((contract) => {
          // Cache for reuse only while the network hasn't moved on since.
          if (initializingAddress === contractAddress) {
            addressLinkContract = contract;
          }
        })
        .catch(() => {})
        .finally(() => {
          if (addressLinkContractPromise === promise) {
            addressLinkContractPromise = null;
          }
        });
    }
    return addressLinkContractPromise;
  }

  /**
   * Resolve the preferred (default) `.chain` name for an address from the
   * AddressLink contract. Returns `undefined` when the account has no preferred
   * name set or the contract is not available on the active network.
   */
  async function getPreferredName(
    address: Encoded.AccountAddress,
  ): Promise<ChainName | undefined> {
    const contract = await getAddressLinkContract();
    if (!contract) {
      return undefined;
    }
    const { decodedResult } = await contract.get_link(
      address,
      AE_ADDRESS_LINK_PREFERRED_NAME_PROVIDER,
    );
    return (decodedResult as ChainName) || undefined;
  }

  return {
    addressLinkContractAddress,
    getAddressLinkContract,
    getPreferredName,
  };
}
