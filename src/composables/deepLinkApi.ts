import { ref } from 'vue';
import { Router, RouteLocationNormalized as Route } from 'vue-router';

export interface UseDeepLinkApiOptions {
  router: Router
}
/**
 * TODO: refactor once upgrade to vue-router: 4.x.x
 * @param { router: Router }
 */
export function useDeepLinkApi({ router }: UseDeepLinkApiOptions) {
  const route: Route = router.currentRoute.value;
  const callbackOrigin = ref<URL | null>(
    route.query['x-success']
      ? (new URL(route.query['x-success'] as string))
      : null,
  );

  function openCallbackOrGoHome(
    isSuccess: boolean,
    templateParams: Record<string, string> = {},
  ) {
    const callbackUrlTemplate = route.query[isSuccess ? 'x-success' : 'x-cancel'];
    if (!callbackUrlTemplate) {
      router.push({ name: 'account' });
      return;
    }
    const callbackUrl = Object.entries(templateParams).reduce(
      (url, [key, value]) => String(url).replace(new RegExp(`{${key}}`, 'g'), encodeURIComponent(value)),
      route.query[isSuccess ? 'x-success' : 'x-cancel'],
    ) as string;
    router.push({ name: 'account' });
    window.open(callbackUrl, '_self');
  }

  return {
    callbackOrigin,
    openCallbackOrGoHome,
  };
}
