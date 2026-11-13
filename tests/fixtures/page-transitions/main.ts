/* eslint-disable vue/one-component-per-file -- Minimal pages share this browser-only fixture. */
import { createApp, defineComponent, h } from 'vue';
import {
  IonicVue, IonContent, IonPage, onIonViewDidEnter,
} from '@ionic/vue';
import { createRouter, createWebHashHistory } from '@ionic/vue-router';
import { useRouter } from 'vue-router';
import { createI18n } from 'vue-i18n';
import App from '../../../src/popup/App.vue';
import DefaultPagesRouter from '../../../src/popup/components/DefaultPagesRouter.vue';
import {
  ROUTE_ACCOUNT, ROUTE_MULTISIG_ACCOUNT,
} from '../../../src/popup/router/routeNames';
import { IS_IOS } from './constants';

function page(name: string, forwardPath?: string, forwardId?: string) {
  return defineComponent({
    setup() {
      const router = useRouter();
      onIonViewDidEnter(() => { document.documentElement.dataset.entered = name; });
      return () => h(IonPage, { id: name }, () => h(IonContent, {}, () => [
        h('h1', name),
        forwardPath
          ? h('button', { id: forwardId, onClick: () => router.push(forwardPath) }, 'Open page')
          : h('button', { id: 'back', onClick: () => router.back() }, 'Back'),
      ]));
    },
  });
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/account' },
    {
      path: '/account',
      name: ROUTE_ACCOUNT,
      component: page('account', '/more', 'open-more'),
    },
    { path: '/more', component: page('more') },
    {
      path: '/multisig',
      component: DefaultPagesRouter,
      meta: { isMultisig: true },
      children: [
        {
          path: '',
          name: ROUTE_MULTISIG_ACCOUNT,
          component: page('multisig', '/multisig/details', 'open-multisig-details'),
        },
        { path: 'details', component: page('multisig-details') },
      ],
    },
  ],
});

const app = createApp(App);
app.use(IonicVue, { mode: IS_IOS ? 'ios' : 'md', swipeBackEnabled: IS_IOS });
app.use(createI18n({ legacy: false, locale: 'en', messages: { en: {} } }));
app.use(router);
app.mount('#app');
