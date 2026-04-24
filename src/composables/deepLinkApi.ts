import { ref } from 'vue';
import { useRoute, RouteLocationNormalized as Route } from 'vue-router';
import { useIonRouter } from '@ionic/vue';

import { ROUTE_ACCOUNT } from '@/popup/router/routeNames';
import { checkIfSuperheroCallbackUrl } from '@/utils';
import {
  AGGREGATOR_URL,
  IS_IOS,
  IS_MOBILE_APP,
  IS_WEB,
  MODAL_TRANSFER_SEND,
} from '@/constants';
import { useModals } from '@/composables/modals';
import Logger from '@/lib/logger';
import { tg } from '@/popup/plugins/i18n';

let isDeepLinkUsed = false;

/**
 * Hostname of the built-in Superhero aggregator — extracted so we can
 * also recognize its subdomains (e.g. `chat.superhero.com`,
 * `wallet.superhero.com`) as trusted destinations, keeping the existing
 * first-party flows (tipping, chat JWT sign, wallet web build) from
 * triggering the external-site confirmation prompt that third-party
 * dApps correctly see.
 */
const TRUSTED_CALLBACK_HOSTNAME = (() => {
  try {
    return new URL(AGGREGATOR_URL).hostname;
  } catch {
    return '';
  }
})();

/**
 * Returns true for callbacks pointing at the Superhero aggregator itself
 * or any of its HTTPS subdomains. The `https:` check is essential —
 * matching hostname alone would let `http://superhero.com` (downgrade
 * attack) and any attacker-controlled origin that aliases the host
 * locally (hosts file, DNS hijack over Wi-Fi) slip through without a
 * prompt. All other origins still require explicit user approval.
 */
function isTrustedCallbackUrl(url: URL): boolean {
  if (!TRUSTED_CALLBACK_HOSTNAME || url.protocol !== 'https:') {
    return false;
  }
  const { hostname } = url;
  return (
    hostname === TRUSTED_CALLBACK_HOSTNAME
    || hostname.endsWith(`.${TRUSTED_CALLBACK_HOSTNAME}`)
  );
}

/**
 * Callback redirects are only allowed back to ordinary web origins.
 * Opaque schemes (`myapp:`, `intent:`, `mailto:` and friends) are
 * intentionally rejected so signed data cannot be handed off to an
 * arbitrary native app / protocol handler.
 */
const ALLOWED_CALLBACK_PROTOCOLS = new Set([
  'http:',
  'https:',
]);

/**
 * Parse a deeplink callback URL string (already template-expanded) and
 * validate it is a well-formed URL with an allowed web scheme.
 * Returns the parsed URL or null when the input is unsafe.
 */
function validateCallbackUrl(rawUrl: string): URL | null {
  try {
    const url = new URL(rawUrl);
    if (!ALLOWED_CALLBACK_PROTOCOLS.has(url.protocol.toLowerCase())) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function openCallbackUrl(callbackUrl: string) {
  if (!IS_MOBILE_APP) {
    window.open(callbackUrl, '_self');
    return;
  }

  if (!IS_IOS) {
    window.open(callbackUrl, '_system');
    return;
  }

  // iOS Safari sometimes resumes on a previous tab when using `_self`.
  // Open externally first and use `_self` only if the page didn't background.
  let canUseSelfFallback = true;
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      canUseSelfFallback = false;
    }
  };
  const onPageHide = () => {
    canUseSelfFallback = false;
  };
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', onPageHide);

  window.open(callbackUrl, '_system');
  setTimeout(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pagehide', onPageHide);

    if (canUseSelfFallback && document.visibilityState === 'visible') {
      window.open(callbackUrl, '_self');
    }
  }, 150);
}

export function useDeepLinkApi(
  { doNotInitializeRouter }: { doNotInitializeRouter?: boolean } = {},
) {
  // `useIonRouter` breaks if it is not run in `IonPage` context
  const router = doNotInitializeRouter ? null : useIonRouter();
  const route = useRoute();

  const callbackOrigin = ref<URL | null>((() => {
    const xSuccess = route?.query['x-success'];
    if (!xSuccess) return null;
    try {
      return new URL(decodeURIComponent(xSuccess as string));
    } catch {
      return null;
    }
  })());

  /**
   * Function needed to support legacy tipping from superhero.com
   */
  async function checkIfOpenTransferSendModal(currentRoute: Route) {
    if (
      currentRoute.path.slice(1) === ROUTE_ACCOUNT
      && checkIfSuperheroCallbackUrl(currentRoute.query)
    ) {
      const { openModal } = useModals();

      openModal(MODAL_TRANSFER_SEND);
    }
  }

  async function openCallbackOrGoHome(
    isSuccess: boolean,
    templateParams: Record<string, string> = {},
  ) {
    const callbackUrlTemplate = route.query[isSuccess ? 'x-success' : 'x-cancel'];
    if (!callbackUrlTemplate) {
      router?.replace({ name: ROUTE_ACCOUNT });
      return;
    }
    /**
     * `decodeURIComponent` throws `URIError` on malformed percent-encoded
     * input (e.g. a stray `%ZZ`). Since every caller in the codebase —
     * `SignTransaction.vue`, `SignMessage.vue`, `JwtSign.vue`, `Address.vue`,
     * `CommentNew.vue`, `Retip.vue`, `TransferReview.vue` — invokes this
     * function fire-and-forget (no `await`, no `.catch`), an uncaught
     * URIError would surface as an unhandled promise rejection and leave
     * the user stuck on the signing page with no feedback. Treat a
     * malformed template the same as a missing one: redirect home.
     */
    let decodedTemplate: string;
    try {
      decodedTemplate = decodeURIComponent(String(callbackUrlTemplate));
    } catch {
      router?.replace({ name: ROUTE_ACCOUNT });
      return;
    }
    const callbackUrl = Object.entries(templateParams).reduce(
      (url, [key, value]) => url.replace(new RegExp(`{${key}}`, 'g'), encodeURIComponent(value)),
      decodedTemplate,
    ) as string;

    /**
     * Validate the (template-expanded) callback URL before handing it
     * to `window.open`. Rejects malformed URLs and dangerous schemes outright,
     * and requires explicit user confirmation before redirecting signed data
     * to any origin other than the trusted Superhero aggregator. This blocks
     * silent exfiltration of `{signature}`, `{transaction}`, `{signed-payload}`
     * substitutions to attacker-controlled destinations while preserving
     * legitimate third-party dApp deeplink flows (the user explicitly approves
     * each unknown destination).
     */
    const parsedCallback = validateCallbackUrl(callbackUrl);
    if (!parsedCallback) {
      Logger.write({
        title: tg('pages.deepLink.invalidCallbackTitle'),
        message: tg('pages.deepLink.invalidCallbackMsg', {
          url: callbackUrl,
        }),
        type: 'api-response',
        modal: true,
      });
      router?.replace({ name: ROUTE_ACCOUNT });
      return;
    }

    if (!isTrustedCallbackUrl(parsedCallback)) {
      const { openConfirmModal } = useModals();
      try {
        await openConfirmModal({
          title: tg('pages.deepLink.externalCallbackTitle'),
          msg: tg('pages.deepLink.externalCallbackMsg', {
            origin: parsedCallback.origin,
          }),
        });
      } catch {
        router?.replace({ name: ROUTE_ACCOUNT });
        return;
      }
    }

    router?.replace({ name: ROUTE_ACCOUNT });
    /**
     * When auto-sign is enabled (daily spend limit),
     * there are cases (mostly on iOS) where it's not redirecting back to the callback URL.
     * This might be due to the time it takes for iOS to animate the navigation.
     * Adding a small delay fixes this
     * TODO some more research to figure out the exact reason
     */
    setTimeout(() => {
      openCallbackUrl(parsedCallback.toString());
    }, IS_WEB ? 0 : 300);
  }

  function setIsDeepLinkUsed(value: boolean) {
    isDeepLinkUsed = value;
  }

  return {
    checkIfOpenTransferSendModal,
    callbackOrigin,
    openCallbackOrGoHome,
    setIsDeepLinkUsed,
    isDeepLinkUsed,
  };
}
