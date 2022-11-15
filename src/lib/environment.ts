const userAgentLowerCase = navigator.userAgent.toLowerCase();
const url = new URL(window.location.href);
const platform = process.env.PLATFORM;

export const RUNNING_IN_POPUP = url.searchParams.get('id')
  && (window.location.pathname.includes('index.html') || process.env.RUNNING_IN_TESTS);

export const IN_POPUP = !!window.opener && window.name.startsWith('popup-');

export const POPUP_TYPE = url.searchParams.get('type') || null;

export const IN_FRAME = window.parent !== window;

/**
 * Running in a desktop or mobile browser
 */
export const IS_WEB = platform === 'web';

/**
 * Running as mobile app
 */
export const IS_CORDOVA = platform === 'cordova';

/**
 * Running as a browser extension
 */
export const IS_EXTENSION = platform === 'extension' && !process.env.RUNNING_IN_TESTS;

export const IS_EXTENSION_BACKGROUND = IS_EXTENSION && window.location.href.endsWith('_generated_background_page.html');

export const IS_IOS = /ipad|iphone|ipod/.test(userAgentLowerCase) && !(window as any).MSStream;

export const IS_ANDROID = !!(userAgentLowerCase.includes('android')
  || window.cordova?.platformId?.toLowerCase()?.includes('android'));

export const IS_MOBILE_DEVICE = userAgentLowerCase.includes('mobi');

/**
 * Chrome, Brave, Safari, Edge...
 */
export const IS_CHROME_BASED = userAgentLowerCase.includes('chrome');

export const IS_FIREFOX = userAgentLowerCase.includes('firefox');
