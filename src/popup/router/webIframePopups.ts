import { Component, VNode, h } from 'vue';
import { WalletAppRouteConfig } from '../../types';
import { IN_POPUP, IS_WEB } from '../../lib/environment';
import {
  MODAL_CONFIRM_RAW_SIGN,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  MODAL_MESSAGE_SIGN,
} from '../utils';

import ConfirmConnect from '../pages/Popups/Connect.vue';
import ConfirmRawSign from '../components/Modals/ConfirmRawSign.vue';
import ConfirmTransactionSign from '../components/Modals/ConfirmTransactionSign.vue';
import MessageSign from '../pages/Popups/MessageSign.vue';

const iFrameComponent = (component: Component | VNode) => {
  const unloadHandler = () => window.popupProps.reject(new Error('Rejected by user'));
  window.addEventListener('beforeunload', unloadHandler);
  const closingWrapper = (f: any) => (...args: any) => {
    f(...args);
    window.removeEventListener('beforeunload', unloadHandler);
    window.close();
  };

  return h(component, {
    ...window.popupProps,
    resolve: closingWrapper(window.popupProps.resolve),
    reject: closingWrapper(window.popupProps.reject),
  }, {});
};

const webIframePopups: WalletAppRouteConfig[] = (IS_WEB && IN_POPUP)
  ? [
    { name: 'confirm-connect', component: ConfirmConnect },
    { name: MODAL_CONFIRM_RAW_SIGN, component: ConfirmRawSign },
    { name: MODAL_CONFIRM_TRANSACTION_SIGN, component: ConfirmTransactionSign },
    { name: MODAL_MESSAGE_SIGN, component: MessageSign },
  ].map(({ name, component }) => ({
    name: `web-iframe-popup-${name}`,
    path: `/web-iframe-popup/${name}`,
    component: iFrameComponent(component),
    meta: {
      notPersist: true,
      hideHeader: true,
    },
  }))
  : [];

export default webIframePopups;
