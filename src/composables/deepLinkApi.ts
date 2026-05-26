import { ref } from 'vue';
import { useRoute, RouteLocationNormalized as Route } from 'vue-router';
import { useIonRouter } from '@ionic/vue';

import { ROUTE_ACCOUNT } from '@/popup/router/routeNames';
import {
  checkIfSuperheroCallbackUrl,
  isTrustedCallbackUrl,
  validateCallbackUrl,
} from '@/utils';
import {
  IS_IOS,
  IS_MOBILE_APP,
  IS_WEB,
  MODAL_TRANSFER_SEND,
} from '@/constants';
import { useModals } from '@/composables/modals';
import Logger from '@/lib/logger';
import { tg } from '@/popup/plugins/i18n';

let isDeepLinkUsed = false;

function normalizeCallbackTemplate(rawTemplate: string): string | null {
  /**
   * Vue Router usually returns already-decoded query values. Decoding such
   * values again can turn intentional `%26` (data) into raw `&` (separator),
   * corrupting callback payloads. Decode only when the template still looks
   * URL-encoded (no visible scheme delimiter yet).
   */
  if (rawTemplate.includes('://')) {
    return rawTemplate;
  }
  try {
    return decodeURIComponent(rawTemplate);
  } catch {
    return null;
  }
}

function applyTemplateParams(template: string, templateParams: Record<string, string>): string {
  return Object.entries(templateParams).reduce(
    (url, [key, value]) => url.split(`{${key}}`).join(encodeURIComponent(value)),
    template,
  );
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
    const normalized = normalizeCallbackTemplate(String(xSuccess));
    if (!normalized) return null;
    try {
      return new URL(normalized);
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
    const decodedTemplate = normalizeCallbackTemplate(String(callbackUrlTemplate));
    if (!decodedTemplate) {
      router?.replace({ name: ROUTE_ACCOUNT });
      return;
    }
    const callbackUrl = applyTemplateParams(decodedTemplate, templateParams);

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
      await Logger.write({
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
            url: parsedCallback.toString(),
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
