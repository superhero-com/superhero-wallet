import { Component, VNode, h } from 'vue';
import type { WalletAppRouteConfig } from '@/types';
import {
  IN_POPUP,
  IS_WEB,
  MODAL_CONFIRM_CONNECT,
  MODAL_CONFIRM_ACCOUNT_LIST,
  MODAL_CONFIRM_RAW_SIGN,
  MODAL_CONFIRM_UNSAFE_SIGN,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  MODAL_MESSAGE_SIGN,
} from '@/constants';
import { usePopupProps } from '@/composables';
import { RejectedByUserError } from '@/lib/errors';
import { ROUTE_WEB_IFRAME_POPUP } from './routeNames';

import ConfirmConnect from '../pages/Popups/Connect.vue';
import ConfirmAccountList from '../pages/Popups/AccountList.vue';
import ConfirmRawSign from '../components/Modals/ConfirmRawSign.vue';
import ConfirmUnsafeSign from '../components/Modals/ConfirmUnsafeSign.vue';
import ConfirmTransactionSign from '../components/Modals/ConfirmTransactionSign.vue';
import ConfirmMessageSign from '../pages/Popups/MessageSign.vue';

const createIframeComponent = (component: Component | VNode) => {
  const unloadHandler = () => window.popupProps?.reject?.(new RejectedByUserError());
  window.addEventListener('beforeunload', unloadHandler);
  const closingWrapper = (f: any) => (...args: any) => {
    f(...args);
    window.removeEventListener('beforeunload', unloadHandler);
    window.close();
  };

  const wrappedPopupProps = {
    ...window.popupProps,
    resolve: closingWrapper(window.popupProps?.resolve),
    reject: closingWrapper(window.popupProps?.reject),
  };

  const { setPopupProps } = usePopupProps();
  setPopupProps(wrappedPopupProps);

  return h(component);
};

/**
 * If external DAPP want's to connect or sign something with the use of the extension
 * the extension's background process by using the `popupHandler` is opening popup window
 * and one of the following modals are opened as a page.
 */
const webIframePopups: WalletAppRouteConfig[] = (IS_WEB && IN_POPUP)
  ? [
    { name: MODAL_CONFIRM_CONNECT, component: ConfirmConnect },
    { name: MODAL_CONFIRM_ACCOUNT_LIST, component: ConfirmAccountList },
    { name: MODAL_CONFIRM_RAW_SIGN, component: ConfirmRawSign },
    { name: MODAL_CONFIRM_UNSAFE_SIGN, component: ConfirmUnsafeSign },
    { name: MODAL_CONFIRM_TRANSACTION_SIGN, component: ConfirmTransactionSign },
    { name: MODAL_MESSAGE_SIGN, component: ConfirmMessageSign },
  ].map(({ name, component }): WalletAppRouteConfig => ({
    name: `${ROUTE_WEB_IFRAME_POPUP}-${name}`,
    path: `/${ROUTE_WEB_IFRAME_POPUP}/${name}`,
    component: createIframeComponent(component),
    meta: {
      notPersist: true,
      hideHeader: true,
    },
  }))
  : [];

export default webIframePopups;
