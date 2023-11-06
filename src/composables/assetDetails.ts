import { reactive } from 'vue';
import {
  AssetContractId,
  IToken,
  ITokenBalance,
} from '@/types';

interface ISharedAssetDetails {
  contractId?: AssetContractId;
  tokenPairs?: any; // TODO: replace any with TokenPair & resolve issues
  tokenData?: any; // TODO: replace any with IAsset & resolve issues
  tokenBalance?: ITokenBalance;
  tokens?: IToken[];
  isMultisig?: boolean;
}

const sharedAssetDetails = reactive<ISharedAssetDetails>({});

/**
 * Share the asset (coin or token) details data between the asset details page
 * and the child pages: AssetDetailsTransactions and AssetDetailsInfo.
 */
export function useAssetDetails() {
  function setSharedAssetDetails(details: ISharedAssetDetails) {
    Object.keys(details).forEach((key: keyof ISharedAssetDetails) => {
      sharedAssetDetails[key] = details[key];
    });
  }

  function resetSharedAssetDetails() {
    Object.keys(sharedAssetDetails).forEach((key: keyof ISharedAssetDetails) => {
      sharedAssetDetails[key] = undefined;
    });
  }

  return {
    sharedAssetDetails,
    setSharedAssetDetails,
    resetSharedAssetDetails,
  };
}
