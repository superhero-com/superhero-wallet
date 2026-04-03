import { Encoding, isAddressValid } from '@aeternity/aepp-sdk';
import { uniqBy } from 'lodash-es';

import type {
  IAsset,
  IPageableResponse,
  IToken,
  Protocol,
} from '@/types';
import { PROTOCOLS } from '@/constants';

export type AssetSelectorSearchMode = 'browse' | 'exact-contract' | 'remote-prefix';

export function getAssetIdentityKey(asset: IAsset): string {
  return `${asset.protocol}:${asset.contractId}`;
}

export function getAssetSelectorSearchMode(
  trimmedSearchTerm: string,
  protocol: Protocol | null,
  withBalanceOnly: boolean,
): AssetSelectorSearchMode {
  if (!trimmedSearchTerm || withBalanceOnly || protocol !== PROTOCOLS.aeternity) {
    return 'browse';
  }

  return isAddressValid(trimmedSearchTerm, Encoding.ContractAddress)
    ? 'exact-contract'
    : 'remote-prefix';
}

export function getAssetSelectorDisplayList(
  accountAssetsFiltered: IAsset[],
  remoteSearchResults: IAsset[],
  protocol: Protocol | null,
  mode: AssetSelectorSearchMode,
): IAsset[] {
  const filteredByProtocol = protocol
    ? accountAssetsFiltered.filter((asset) => asset.protocol === protocol)
    : accountAssetsFiltered;

  if (mode !== 'remote-prefix') {
    return filteredByProtocol;
  }

  return uniqBy(
    [...filteredByProtocol, ...remoteSearchResults],
    getAssetIdentityKey,
  );
}

export function getAssetSelectorListKey(
  protocol: Protocol | null,
  mode: AssetSelectorSearchMode,
  trimmedSearchTerm: string,
): string {
  const protocolKey = protocol || 'all';

  if (mode === 'remote-prefix') {
    return [protocolKey, mode, trimmedSearchTerm].join(':');
  }

  return [protocolKey, mode, trimmedSearchTerm || 'empty'].join(':');
}

export function resolveSearchNextPageUrl(
  response: IPageableResponse<IToken> | null | undefined,
  previousUrl: string | null | undefined,
  loadMore: boolean,
): string | null | undefined {
  if (response == null) {
    return loadMore ? previousUrl : undefined;
  }

  return response.next ?? null;
}
