import { Router } from 'vue-router';
import { Dictionary } from '@/types';
import { useModals } from '@/composables';
import { APP_LINK_WEB, MODAL_TRANSFER_SEND } from '@/constants';
import { ROUTE_NETWORK_ADD } from '@/popup/router/routeNames';

// Allowed action names
export type RouteQueryActionName = 'transferSend' | 'addNetwork';

// Returned state controls if the requested page should be opened.
export type RouteQueryActionMethod = (router: Router, query: Dictionary) => boolean;

/**
 * The query object key whose value determines which controller method to use.
 */
const ACTION_PROP = 'op';

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
    transferSend: () => {
      const { openModal } = useModals();
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
    const unbind = router.beforeResolve(({ query }, from, next) => {
      const action = query?.[ACTION_PROP] as null | RouteQueryActionName;

      if (action && typeof action === 'string' && availableActions[action]) {
        const queryWithoutAction = { ...query };
        delete queryWithoutAction[ACTION_PROP];

        const shouldOpenRequestedPage = availableActions[action](router, queryWithoutAction);
        if (shouldOpenRequestedPage) {
          next();
        }
        unbind();
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
