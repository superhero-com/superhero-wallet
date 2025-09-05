import { App, URLOpenListenerEvent } from '@capacitor/app';
import { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHashHistory, createWebHistory } from '@ionic/vue-router';
import { IPopupProps, WalletRouteMeta } from '@/types';
import {
  APP_LINK_WEB,
  APP_NAME,
  IS_MOBILE_APP,
  IS_WEB,
  POPUP_TYPE,
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_RAW_SIGN,
  POPUP_TYPE_UNSAFE_SIGN,
  POPUP_TYPE_ACCOUNT_LIST,
  RUNNING_IN_POPUP,
  UNFINISHED_FEATURES,
} from '@/constants';
import { watchUntilTruthy } from '@/utils';
import { getPopupProps } from '@/utils/getPopupProps';
import { RouteQueryActionsController } from '@/lib/RouteQueryActionsController';
import { RouteLastUsedRoutes } from '@/lib/RouteLastUsedRoutes';
import {
  useAccounts,
  useAuth,
  usePopupProps,
  useUi,
  useWalletConnect,
  type WalletConnectUri,
} from '@/composables';
import { routes } from './routes';
import {
  ROUTE_ACCOUNT,
  ROUTE_APPS_BROWSER,
  ROUTE_INDEX,
  ROUTE_NOT_FOUND,
  ROUTE_POPUP_ACCOUNT_LIST,
  ROUTE_POPUP_CONNECT,
  ROUTE_POPUP_MESSAGE_SIGN,
  ROUTE_POPUP_RAW_SIGN,
  ROUTE_POPUP_UNSAFE_SIGN,
  ROUTE_POPUP_SIGN_TX,
} from './routeNames';

const router = createRouter({
  routes: routes as RouteRecordRaw[],
  history: IS_WEB ? createWebHistory() : createWebHashHistory(),
  scrollBehavior: (to, from, savedPosition) => savedPosition || { left: 0, top: 0 },
});

const {
  isLoggedIn,
  areAccountsReady,
} = useAccounts();
const { setPopupProps } = usePopupProps();
const { setLoginTargetLocation } = useUi();
const { checkUserAuth } = useAuth();

RouteQueryActionsController.init(router);
RouteLastUsedRoutes.init(router);

router.beforeEach(async (to, from, next) => {
  let popupProps: IPopupProps | null = null;

  if (RUNNING_IN_POPUP && to.name !== ROUTE_NOT_FOUND && !Object.keys(to.params).length) {
    popupProps = await getPopupProps();
  }

  await checkUserAuth();

  await watchUntilTruthy(areAccountsReady);

  const meta = to.meta as WalletRouteMeta;

  if (!isLoggedIn.value) {
    if (meta?.ifNotAuthOnly || meta?.ifNotAuth) {
      next();
    } else {
      setLoginTargetLocation(to);
      next({ name: ROUTE_INDEX });
    }
    return;
  }

  if (to.name === ROUTE_APPS_BROWSER) {
    // In-app browser is mobile-only
    if (!IS_MOBILE_APP && !UNFINISHED_FEATURES) {
      next({ name: ROUTE_NOT_FOUND });
      return;
    }
  }

  if (RUNNING_IN_POPUP && to.name !== ROUTE_NOT_FOUND) {
    const name = {
      [POPUP_TYPE_CONNECT]: ROUTE_POPUP_CONNECT,
      [POPUP_TYPE_ACCOUNT_LIST]: ROUTE_POPUP_ACCOUNT_LIST,
      [POPUP_TYPE_SIGN]: ROUTE_POPUP_SIGN_TX,
      [POPUP_TYPE_RAW_SIGN]: ROUTE_POPUP_RAW_SIGN,
      [POPUP_TYPE_MESSAGE_SIGN]: ROUTE_POPUP_MESSAGE_SIGN,
      [POPUP_TYPE_UNSAFE_SIGN]: ROUTE_POPUP_UNSAFE_SIGN,
    }[POPUP_TYPE];

    if (!Object.keys(to.params).length) {
      if (!popupProps?.app) {
        next({ name: ROUTE_NOT_FOUND, params: { hideHomeButton: true as any } });
        return;
      }
    }

    if (name !== to.name) {
      setPopupProps(popupProps);
      next({ name });
      return;
    }
  }

  if (meta?.ifNotAuthOnly) next({ name: ROUTE_ACCOUNT });
  else next();
});

const deviceReadyPromise = new Promise((resolve) => document.addEventListener('deviceready', resolve));

const routerReadyPromise = new Promise((resolve) => {
  const unbindAfterEach = router.afterEach(() => {
    resolve(true);
    setTimeout(unbindAfterEach);
  });
});

if (IS_MOBILE_APP) {
  (async () => {
    await Promise.all([deviceReadyPromise, routerReadyPromise]);

    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      const { connect, setIsOpenUsingDeeplink, wcSession } = useWalletConnect();

      const deepLinkUrl = new URL(event.url);
      if (deepLinkUrl.origin === 'wc://' || event.url.startsWith('superhero://wc')) {
        setIsOpenUsingDeeplink(true);
        router.push({ name: ROUTE_ACCOUNT });

        if (!wcSession.value) {
          connect(deepLinkUrl.searchParams.get('uri') as WalletConnectUri, true);
        }
        return;
      }
      const prefix = ['superhero:', APP_LINK_WEB].find((p) => deepLinkUrl.origin === p);
      if (!prefix) throw new Error(`Unknown url: ${deepLinkUrl.origin}`);

      try {
        router.push({
          path: deepLinkUrl.pathname,
          hash: deepLinkUrl.hash,
          query: Object.fromEntries(deepLinkUrl.searchParams.entries()),
        });
      } catch (error: any) {
        if (error.name !== 'NavigationDuplicated') throw error;
      }
    });

    // TODO establish if we still need this
    router.afterEach((to) => {
      if (to.path === '/') {
        document.body.classList.remove('color-bg-app');
      } else {
        document.body.classList.add('color-bg-app');
      }
    });
  })();
}

// Basic SEO: set title/canonical/OG/Twitter tags on navigation (web only)
if (IS_WEB) {
  const DEFAULT_DESCRIPTION = 'Superhero is a multi-blockchain wallet to manage crypto assets and navigate the web3 and DeFi space. Currently supporting Bitcoin, Ethereum, Solana, Dogecoin, Polygon PoS, Avalanche, BNB and æternity blockchains.';

  const ensureTag = <K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    attributes: Record<string, string>,
  ): HTMLElementTagNameMap[K] => {
    const selector = Object.entries(attributes)
      .map(([key, value]) => `${tagName}[${key}="${value}"]`).join('');
    let el = document.head.querySelector(selector) as HTMLElementTagNameMap[K] | null;
    if (!el) {
      el = document.createElement(tagName) as HTMLElementTagNameMap[K];
      Object.entries(attributes).forEach(([key, value]) => el!.setAttribute(key, value));
      document.head.appendChild(el);
    }
    return el;
  };

  const setMeta = (name: string, content: string) => {
    const el = ensureTag('meta', { name });
    el.setAttribute('content', content);
  };

  const setOg = (property: string, content: string) => {
    const el = ensureTag('meta', { property });
    el.setAttribute('content', content);
  };

  router.afterEach((to) => {
    const meta = to.meta as WalletRouteMeta;
    const titleKey = meta?.title as string | undefined;
    const translatedTitle = titleKey ? tg(`pages.titles.${titleKey}`) : '';
    const title = translatedTitle ? `${APP_NAME} — ${translatedTitle}` : APP_NAME;
    document.title = title;

    const canonicalHref = `${APP_LINK_WEB}${to.fullPath}`;
    const canonical = ensureTag('link', { rel: 'canonical' });
    canonical.setAttribute('href', canonicalHref);

    const description = DEFAULT_DESCRIPTION;
    setMeta('description', description);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', `${APP_LINK_WEB}/icons/icon-512.webp`);

    setOg('og:type', 'website');
    setOg('og:title', title);
    setOg('og:description', description);
    setOg('og:url', canonicalHref);
    setOg('og:image', `${APP_LINK_WEB}/icons/icon-512.webp`);
  });
}

export default router;
