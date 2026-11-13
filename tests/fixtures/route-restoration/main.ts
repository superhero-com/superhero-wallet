/* eslint-disable vue/one-component-per-file -- Minimal pages share this browser-only fixture. */
import {
  createApp, defineAsyncComponent, defineComponent, h,
} from 'vue';
import {
  IonicVue,
  IonApp,
  IonContent,
  IonPage,
  IonRouterOutlet,
  onIonViewDidEnter,
} from '@ionic/vue';
import { createRouter, createWebHashHistory } from '@ionic/vue-router';
import { useRouter, type Router } from 'vue-router';
import { RouteLastUsedRoutes } from '../../../src/lib/RouteLastUsedRoutes';
import {
  ROUTE_ACCOUNT, ROUTE_ACCOUNT_DETAILS, ROUTE_ACCOUNT_DETAILS_ASSETS, ROUTE_INDEX,
} from '../../../src/popup/router/routeNames';
import '@ionic/vue/css/core.css';
import '@ionic/vue/css/structure.css';

declare global {
  interface Window {
    routeRestoration: { router: Router; releaseAuth: () => void; releaseParent: () => void };
  }
}

function page(name: string, withOutlet = false) {
  return defineComponent({
    setup() {
      onIonViewDidEnter(() => { document.documentElement.dataset.entered = name; });
      return () => h(IonPage, { id: name }, () => (
        withOutlet ? h(IonRouterOutlet) : h(IonContent, {}, () => name)
      ));
    },
  });
}

const options = new URLSearchParams(window.location.search);
let releaseParent!: () => void;
// Held until the test releases it, otherwise loaded after a delay.
const parentHeld = options.get('holdParent') === 'true'
  ? new Promise<void>((resolve) => { releaseParent = resolve; })
  : undefined;
const useSlowParent = !!parentHeld || options.get('slowParent') === 'true';
const slowParent = defineComponent({
  setup() {
    onIonViewDidEnter(() => { document.documentElement.dataset.entered = 'more'; });
    // ProtocolSpecificView also mounts its IonPage through an async inner component.
    const inner = defineAsyncComponent(async () => {
      await (parentHeld ?? new Promise((resolve) => { setTimeout(resolve, 1200); }));
      return page('more');
    });
    return () => h(inner);
  },
});
const offline = options.get('offline') === 'true';
const protocol = options.get('protocol') || 'aeternity';
let loggedIn = options.get('locked') !== 'true';
let activeProtocol: string | undefined;
let loginTarget: string | undefined;
let releaseAuth!: () => void;
const authReady = options.get('deferAuth') === 'true'
  ? new Promise<void>((resolve) => { releaseAuth = resolve; })
  : Promise.resolve();
const hasTokensSupport = () => activeProtocol !== 'bitcoin';

const loginPage = defineComponent({
  setup() {
    const pageRouter = useRouter();
    onIonViewDidEnter(() => { document.documentElement.dataset.entered = 'index'; });
    return () => h(IonPage, { id: 'index' }, () => h(IonContent, {}, () => h('button', {
      id: 'unlock',
      onClick: () => {
        loggedIn = true;
        pageRouter.push(loginTarget || '/account');
      },
    }, 'Unlock')));
  },
});
const assetsPage = page('assets');
const protocolAssets = defineComponent({
  setup() {
    const pageRouter = useRouter();
    if (!hasTokensSupport()) pageRouter.replace({ name: ROUTE_ACCOUNT_DETAILS });
    return () => (hasTokensSupport() ? h(assetsPage) : null);
  },
});
const nestedParent = defineComponent({
  setup() {
    const inner = defineAsyncComponent(async () => {
      await new Promise((resolve) => { setTimeout(resolve, 1200); });
      return page('nested-names', !offline);
    });
    return () => h(inner);
  },
});

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: ROUTE_INDEX,
      component: loginPage,
      meta: { ifNotAuthOnly: true, notPersist: true },
    },
    { path: '/account', name: ROUTE_ACCOUNT, component: page('account') },
    { path: '/more', component: useSlowParent ? slowParent : page('more') },
    { path: '/more/about', component: page('about') },
    ...['terms', 'privacy'].map((name) => ({
      path: `/more/about/${name}`, component: page(name), meta: { ifNotAuth: true },
    })),
    {
      path: '/account-details',
      component: page('account-root', true),
      children: [
        { path: '', name: ROUTE_ACCOUNT_DETAILS, component: page('transactions') },
        {
          path: 'assets',
          name: ROUTE_ACCOUNT_DETAILS_ASSETS,
          component: protocolAssets,
          meta: { redirectIfNull: ROUTE_ACCOUNT_DETAILS },
        },
      ],
    },
    ...['/coins/:id', '/coins/:id/details'].map((path) => ({
      path, component: page('coin'), meta: { backRoute: { name: ROUTE_ACCOUNT_DETAILS_ASSETS } },
    })),
    {
      path: '/nested',
      component: page('nested-root', true),
      children: [{
        path: 'names',
        component: nestedParent,
        children: [
          { path: '', component: page('names') },
          { path: 'auctions', component: page('auctions') },
        ],
      }],
    },
  ],
});

const restoration = RouteLastUsedRoutes.init(router, () => {
  if (!activeProtocol) throw new Error('Tokens support checked before authentication');
  return hasTokensSupport();
});
// Match the app's auth-guard order.
router.beforeEach(async (to) => {
  document.documentElement.dataset.authPending = 'true';
  await authReady;
  document.documentElement.dataset.authPending = 'false';
  if (!loggedIn) {
    if (to.meta.ifNotAuthOnly || to.meta.ifNotAuth) return undefined;
    loginTarget = restoration?.waitForLogin(to) ?? to.fullPath;
    return { name: ROUTE_INDEX };
  }
  activeProtocol = protocol;
  if (to.meta.ifNotAuthOnly) return { name: ROUTE_ACCOUNT };
  return restoration?.restoreAfterAuth(to);
});

window.routeRestoration = {
  router,
  releaseAuth: () => releaseAuth?.(),
  releaseParent: () => releaseParent?.(),
};
const app = createApp({ render: () => h(IonApp, {}, () => h(IonRouterOutlet)) });
app.use(IonicVue, { mode: 'ios', swipeBackEnabled: true });
app.use(router);
app.mount('#app');
