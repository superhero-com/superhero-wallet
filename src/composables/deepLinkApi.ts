import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ROUTE_ACCOUNT } from '../popup/router/routeNames';

export function useDeepLinkApi() {
  const router = useRouter();
  const route = useRoute();
  const callbackOrigin = ref<URL | null>(
    route.query['x-success']
      ? (new URL(decodeURIComponent(route.query['x-success'] as string)))
      : null,
  );

  async function openCallbackOrGoHome(
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
    );
    router.replace({ name: ROUTE_ACCOUNT });

    window.open(callbackUrl, '_self');
  }

  return {
    callbackOrigin,
    openCallbackOrGoHome,
  };
}
