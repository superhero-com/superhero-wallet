import { ref } from 'vue';
import BigNumber from 'bignumber.js';
import { defaultProtocolParameters, getCachedProtocolParameters, type ProtocolParameters } from '@aeternity/aepp-sdk';

import { handleUnknownError } from '@/utils';
import { useAeSdk } from '@/composables/aeSdk';
import { useNetworks } from '@/composables/networks';
import { AE_GA_META_TX_FEE_GAS } from '@/protocols/aeternity/config';

export interface IAeGaMetaParams {
  /** Fee of the wrapping `GaMetaTx`, in aettos */
  fee: string;
  /** Gas price of the wrapping `GaMetaTx`, in aettos */
  gasPrice: string;
}

function buildGaMetaParams(gasPrice: string): IAeGaMetaParams {
  return {
    gasPrice,
    fee: new BigNumber(gasPrice).times(AE_GA_META_TX_FEE_GAS).toFixed(),
  };
}

/**
 * The lowest gas price a transaction gets mined at. The consensus minimum alone is not it: a node
 * also refuses to pool anything under the minimum its miner is configured with, and on mainnet
 * and testnet that miner minimum is a thousand times the consensus one. This is the same floor
 * the SDK prices every other transaction against.
 */
function minedGasPrice({ minGasPrice, minMinerGasPrice }: ProtocolParameters): string {
  return (minMinerGasPrice > minGasPrice ? minMinerGasPrice : minGasPrice).toString();
}

/**
 * Values of a network running the consensus parameters the SDK was released with. Shown until the
 * connected node has answered, and used on a node that doesn't report its parameters.
 */
const defaultGaMetaParams = buildGaMetaParams(minedGasPrice(defaultProtocolParameters));

const gaMetaParams = ref<IAeGaMetaParams>(defaultGaMetaParams);

/** Bumped on every network change, so a request still in flight can tell it was left behind */
let networkGeneration = 0;

let composableInitialized = false;

/**
 * Fee and gas price of the `GaMetaTx` a multisig transaction is wrapped into.
 *
 * Both go into the authentication hash a proposal is stored under in the multisig contract, and
 * the transaction that is eventually sent has to reproduce that hash exactly - by then the
 * proposal may be days old and sent by a co-signer from another device. That rules out pricing
 * them by the recent demand of the network, however much cheaper that would be at a quiet moment:
 * the value has to be one every signer arrives at independently. The minimums the node reports
 * are such values - they belong to the network rather than to the moment. The pair is also sent
 * along with the proposal to the multisig backend, so the values a proposal was hashed with are
 * on record whatever a co-signer's node reports later.
 */
export function useAeGaMetaParams() {
  const { getAeSdk } = useAeSdk();

  /**
   * Resolve the parameters against the connected node. Cheap to call repeatedly: the SDK caches
   * the protocol parameters per node instance, and the wallet builds one node per network.
   */
  async function getGaMetaParams(): Promise<IAeGaMetaParams> {
    const generation = networkGeneration;
    const aeSdk = await getAeSdk();
    const params = buildGaMetaParams(minedGasPrice(await getCachedProtocolParameters(aeSdk.api)));
    // The user switched networks while this was in flight - these values belong to the one left
    if (generation === networkGeneration) {
      gaMetaParams.value = params;
    }
    return params;
  }

  if (!composableInitialized) {
    composableInitialized = true;
    const { onNetworkChange } = useNetworks();
    onNetworkChange(() => {
      // Another network may run another minimum, and the value shown for it must not be the one
      // of the network the user just left.
      networkGeneration += 1;
      gaMetaParams.value = defaultGaMetaParams;
      getGaMetaParams().catch(handleUnknownError);
    });
    getGaMetaParams().catch(handleUnknownError);
  }

  return {
    /** Last resolved parameters, the ones of the SDK release until the node has answered */
    gaMetaParams,
    getGaMetaParams,
  };
}
