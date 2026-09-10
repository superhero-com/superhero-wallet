import { Buffer } from 'buffer';
import type { Encoded } from '@aeternity/aepp-sdk';

import type { ChainName } from '@/types';
import type {
  AeAddressLinkClaimResponse,
  AeAddressLinkSubmitResponse,
  AeAddressLinkUnclaimResponse,
} from '@/protocols/aeternity/types';
import { postJson } from '@/utils';
import { useAeSdk } from '@/composables';
import { useAeNetworkSettings } from './aeNetworkSettings';

/**
 * Base path of the preferred-AENS-name address-link endpoints.
 * NOTE: the backend route is intentionally spelled `prefered-aens-name`.
 */
const PREFERRED_AENS_NAME_LINK_PATH = '/api/address-links/prefered-aens-name';

/**
 * Wraps the Superhero API (`api.superhero.com`) address-link flow used to set an
 * account's preferred (default) `.chain` name. Instead of the account paying for
 * an on-chain `link` transaction itself, the wallet signs a challenge message and
 * the backend verifies name ownership, then broadcasts and pays for the tx.
 */
export function useAeAddressLinkBackend() {
  const { getAeSdk } = useAeSdk();
  const { aeActiveNetworkPredefinedSettings } = useAeNetworkSettings();

  function getBaseUrl(): string {
    const baseUrl = aeActiveNetworkPredefinedSettings.value.superheroApiUrl;
    if (!baseUrl) {
      throw new Error('Superhero API URL is not configured for the active network');
    }
    return baseUrl.replace(/\/$/, '');
  }

  /** Sign a backend-provided challenge with the active account, hex-encoded. */
  async function signChallengeMessage(message: string): Promise<string> {
    const aeSdk = await getAeSdk();
    return Buffer.from(await aeSdk.signMessage(message)).toString('hex');
  }

  function claimPreferredAensName(
    address: Encoded.AccountAddress,
    value: ChainName,
  ): Promise<AeAddressLinkClaimResponse> {
    return postJson(`${getBaseUrl()}${PREFERRED_AENS_NAME_LINK_PATH}/claim`, {
      body: { address, value },
    });
  }

  function submitPreferredAensName(payload: {
    address: Encoded.AccountAddress;
    value: ChainName;
    nonce: number;
    signature: string;
    verification_token: string;
  }): Promise<AeAddressLinkSubmitResponse> {
    return postJson(`${getBaseUrl()}${PREFERRED_AENS_NAME_LINK_PATH}/submit`, {
      body: payload,
    });
  }

  function unclaimPreferredAensName(
    address: Encoded.AccountAddress,
  ): Promise<AeAddressLinkUnclaimResponse> {
    return postJson(`${getBaseUrl()}${PREFERRED_AENS_NAME_LINK_PATH}/unclaim`, {
      body: { address },
    });
  }

  function submitPreferredAensNameUnclaim(payload: {
    address: Encoded.AccountAddress;
    nonce: number;
    signature: string;
  }): Promise<AeAddressLinkSubmitResponse> {
    return postJson(`${getBaseUrl()}${PREFERRED_AENS_NAME_LINK_PATH}/unclaim/submit`, {
      body: payload,
    });
  }

  /**
   * Set `address`'s preferred `.chain` name: request a challenge, sign it, and let
   * the backend broadcast (and pay for) the on-chain link. Returns the tx hash.
   */
  async function linkPreferredAensName(
    address: Encoded.AccountAddress,
    name: ChainName,
  ): Promise<string> {
    const claim = await claimPreferredAensName(address, name);
    const signature = await signChallengeMessage(claim.message);
    const { txHash } = await submitPreferredAensName({
      address,
      value: claim.value as ChainName,
      nonce: claim.nonce,
      signature,
      verification_token: claim.verification_token,
    });
    return txHash;
  }

  /** Remove `address`'s preferred `.chain` name via the signed unclaim flow. */
  async function unlinkPreferredAensName(
    address: Encoded.AccountAddress,
  ): Promise<string> {
    const unclaim = await unclaimPreferredAensName(address);
    const signature = await signChallengeMessage(unclaim.message);
    const { txHash } = await submitPreferredAensNameUnclaim({
      address,
      nonce: unclaim.nonce,
      signature,
    });
    return txHash;
  }

  return {
    linkPreferredAensName,
    unlinkPreferredAensName,
  };
}
