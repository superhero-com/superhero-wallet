import { ref } from 'vue';
import { useRoute, RouteLocationNormalized as Route } from 'vue-router';
import { useIonRouter } from '@ionic/vue';

import { ROUTE_ACCOUNT } from '@/popup/router/routeNames';
import { checkIfSuperheroCallbackUrl } from '@/utils';
import { IS_MOBILE_APP, MODAL_TRANSFER_SEND } from '@/constants';
import { useModals } from '@/composables/modals';

export function useDeepLinkApi() {
  const router = useIonRouter();
  const route = useRoute();

  const callbackOrigin = ref<URL | null>(
    route.query['x-success']
      ? (new URL(decodeURIComponent(route.query['x-success'] as string)))
      : null,
  );

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

  function openCallbackOrGoHome(
    isSuccess: boolean,
    templateParams: Record<string, string> = {},
  ) {
    const callbackUrlTemplate = route.query[isSuccess ? 'x-success' : 'x-cancel'];
    if (!callbackUrlTemplate) {
      router.replace({ name: ROUTE_ACCOUNT });
      return;
    }
    const callbackUrl = Object.entries(templateParams).reduce(
      (url, [key, value]) => url.replace(new RegExp(`{${key}}`, 'g'), encodeURIComponent(value)),
      decodeURIComponent(String(route.query[isSuccess ? 'x-success' : 'x-cancel'])),
    ) as string;
    router.replace({ name: ROUTE_ACCOUNT });
    if (IS_MOBILE_APP) {
      window.open(callbackUrl, '_system');
    } else {
      window.open(callbackUrl, '_self');
    }
  }

  return {
    checkIfOpenTransferSendModal,
    callbackOrigin,
    openCallbackOrGoHome,
  };
}
