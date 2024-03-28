import { ref } from 'vue';
import type { UrlStatus } from '@/types';
import { fetchJson, handleUnknownError, isUrlValid } from '@/utils';
import { useAeNetworkSettings } from './aeNetworkSettings';

function getTwitterAccountUrl(url: string) {
  const match = url.match(/https:\/\/twitter.com\/[a-zA-Z0-9_]+/g);
  return match ? match[0] : false;
}

const verifiedUrls = ref<string[]>([]);
const blacklistedUrls = ref<string[]>([]);

export function useAeTippingUrls({ ensureFetchedOnInit } = { ensureFetchedOnInit: true }) {
  function setVerified(verified: string[]) {
    verifiedUrls.value = verified;
  }

  function setBlacklisted(blacklisted: string[]) {
    blacklistedUrls.value = blacklisted;
  }

  async function ensureFetched() {
    if (verifiedUrls.value.length && blacklistedUrls.value.length) {
      return;
    }

    const { aeActiveNetworkSettings } = useAeNetworkSettings();

    try {
      const [verified, graylist] = await Promise.all([
        fetchJson(`${aeActiveNetworkSettings.value.backendUrl}/verified`),
        fetchJson(`${aeActiveNetworkSettings.value.backendUrl}/static/wallet/graylist`),
      ]);

      setVerified(verified);
      setBlacklisted(graylist);
    } catch (error: any) {
      handleUnknownError(error);
    }
  }

  function getTippingUrlStatus(tipUrl?: string): UrlStatus {
    if (!tipUrl) {
      return 'default';
    }
    const twitterProfile = getTwitterAccountUrl(tipUrl);
    const url = twitterProfile || tipUrl;

    if (blacklistedUrls.value.some((u) => url.includes(u))) {
      return 'blacklisted';
    }
    if (verifiedUrls.value.includes(url)) {
      return 'verified';
    }
    if (isUrlValid(url) && url.startsWith('http:')) {
      return 'not-secure';
    }
    return 'not-verified';
  }

  if (ensureFetchedOnInit) {
    ensureFetched();
  }

  return {
    getTippingUrlStatus,
  };
}
