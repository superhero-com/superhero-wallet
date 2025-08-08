import { Router } from 'vue-router';
import { Dictionary } from '@/types';
import { useAccounts, useModals } from '@/composables';
import {
  APP_LINK_WEB,
  MODAL_TRANSFER_SEND,
  PROTOCOL_LIST,
  PROTOCOLS,
} from '@/constants';
import { ROUTE_NETWORK_ADD } from '@/popup/router/routeNames';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

// Allowed action names
export type RouteQueryActionName = 'transferSend' | 'addNetwork';

// Returned state controls if the requested page should be opened.
export type RouteQueryActionMethod = (router: Router, query: Dictionary) => boolean;

/**
 * The query object key whose value determines which controller method to use.
 */
const ACTION_PROP = 'op';
const TOKEN_PROP = 'token';

/**
 * Function that handles URLs that has the `op` key present in the query string.
 * E.g.: wallet.superhero.com?op=<ACTION_NAME>
 * Each handler decides if requested page should be opened or blocked by returning bool value.
 */
export const RouteQueryActionsController = (() => {
  /**
   * @param path part of an URL after the wallet domain, e.g.: /account
   * @returns full URL, eg.: https://superhero.com/account?op=test&foo=23
   */
  function createUrl(path: string, actionName: RouteQueryActionName, payload: object = {}): string {
    return [
      APP_LINK_WEB,
      path,
      '?',
      new URLSearchParams({ [ACTION_PROP]: actionName, ...payload }).toString(),
    ].join('');
  }

  const availableActions: Record<RouteQueryActionName, RouteQueryActionMethod> = {
    /**
     * Take action after opening the link copied in the transfer receive modal.
     */
    transferSend: (_, query) => {
      const { openModal, closeAllModals } = useModals();
      const { setActiveAccountByProtocol } = useAccounts();

      // Determine the active protocol for the current transfer
      const token = query[TOKEN_PROP];

      const currentActionProtocol = PROTOCOL_LIST.find((protocol) => {
        if (protocol === PROTOCOLS.ethereum && token?.startsWith('0x')) {
          return true;
        }
        const adapter = ProtocolAdapterFactory.getAdapter(protocol);
        return adapter.getUrlTokenKey() === token;
      });

      /**
       * Default is Aeternity to support AEX9 token transfers.
       * Token key starts with the contract Id 'ct_...'.
       * Aeternity: https://wallet...?op=transferSend&token=AE&amount=1&account=
       * Bitcoin: https://wallet...?op=transferSend&token=bitcoin&amount=0.0002103&account=
       * AEX9 tokens: https://wallet...?op=transferSend&token=ct_mijZGKXeqQBS1dDmdJbbrDzKRrP58XLjJ2u5edkwafzfcXMsY&amount=1&account=
       * To support ETH tokens, a condition has been added to check if the token starts with '0x...'
       */
      setActiveAccountByProtocol(currentActionProtocol || PROTOCOLS.aeternity);

      closeAllModals();
      openModal(MODAL_TRANSFER_SEND);
      return true;
    },
    /**
     * Used by external apps to automate adding new networks to the wallet.
     */
    addNetwork: (router, query) => {
      router.push({ name: ROUTE_NETWORK_ADD, query });
      return false;
    },
  };

  /**
   * Monitor the action arguments in the query string and perform assigned action method.
   */
  function init(router: Router) {
    router.beforeResolve(({ query }, from, next) => {
      const action = query?.[ACTION_PROP] as null | RouteQueryActionName;

      if (action && typeof action === 'string' && availableActions[action]) {
        const queryWithoutAction = { ...query };
        delete queryWithoutAction[ACTION_PROP];

        const shouldOpenRequestedPage = availableActions[action](router, queryWithoutAction);
        if (shouldOpenRequestedPage) {
          next();
        }
      } else {
        next();
      }
    });
  }

  return {
    createUrl,
    init,
  };
})();
