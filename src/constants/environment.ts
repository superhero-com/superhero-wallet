import type { IPopupType } from '../types';

const userAgentLowerCase = navigator.userAgent.toLowerCase();
const url = new URL(window.location.href);

export const PLATFORM = process.env.PLATFORM as 'web' | 'cordova' | 'extension';

export const RUNNING_IN_TESTS = !!process.env.RUNNING_IN_TESTS;

export const RUNNING_IN_POPUP = !!(
  url.searchParams.get('id')
  && (window.location.pathname.includes('index.html') || RUNNING_IN_TESTS)
);

export const IN_POPUP = !!window.opener && window.name.startsWith('popup-');

export const POPUP_TYPE = url.searchParams.get('type') as IPopupType || null;

/**
 * Running in a web frame, eg.: as a widget on the Superhero.com or in the Dex.
 * In this case we need to handle some UI actions differently.
 */
export const IN_FRAME = window.parent !== window;

/**
 * Running in a desktop or mobile browser
 */
export const IS_WEB = PLATFORM === 'web';

/**
 * Running as mobile app
 */
export const IS_CORDOVA = PLATFORM === 'cordova';

/**
 * Running as a browser extension
 */
export const IS_EXTENSION = PLATFORM === 'extension' && !RUNNING_IN_TESTS;

export const IS_EXTENSION_BACKGROUND = IS_EXTENSION && window.location.href.endsWith('_generated_background_page.html');

export const IS_IOS = (
  (/ipad|iphone|ipod/.test(userAgentLowerCase) && !(window as any).MSStream)
  || !!window.cordova?.platformId?.toLowerCase()?.includes('ios')
);

export const IS_ANDROID = !!(
  userAgentLowerCase.includes('android')
  || window.cordova?.platformId?.toLowerCase()?.includes('android')
);

export const IS_MOBILE_DEVICE = userAgentLowerCase.includes('mobi');

/**
 * Chrome, Brave, Safari, Edge...
 */
export const IS_CHROME_BASED = userAgentLowerCase.includes('chrome');

export const IS_FIREFOX = userAgentLowerCase.includes('firefox');

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const UNFINISHED_FEATURES = !!process.env.UNFINISHED_FEATURES;
