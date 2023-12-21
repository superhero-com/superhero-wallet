import { computed, ref } from 'vue';
import { AssetContractId, IToken, ITokenBalance } from '@/types';

interface ISharedAssetDetails {
  contractId?: AssetContractId;
  tokenPairs?: any; // TODO: replace any with TokenPair & resolve issues
  tokenData?: any; // TODO: replace any with IAsset & resolve issues
  tokenBalance?: ITokenBalance;
  tokens?: IToken[];
  isMultisig?: boolean;
}

const assetDetails = ref<ISharedAssetDetails | null>(null);

const sharedAssetDetails = computed((): ISharedAssetDetails => assetDetails.value || {});

/**
 * Share the asset (coin or token) details data between the asset details page
 * and the child pages: AssetDetailsTransactions and AssetDetailsInfo.
 */
export function useAssetDetails() {
  function setAssetDetails(details: ISharedAssetDetails | null) {
    assetDetails.value = details;
  }

  return {
    sharedAssetDetails,
    setAssetDetails,
  };
}
