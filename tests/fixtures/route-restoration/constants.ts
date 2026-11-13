export const IS_IOS = new URLSearchParams(window.location.search).get('platform') !== 'web';
export const IS_MOBILE_APP = IS_IOS;
export const RUNNING_IN_POPUP = false;
export const STORAGE_KEYS = { lastRoute: 'route-restoration-test:last-route' };
