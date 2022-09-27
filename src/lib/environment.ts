const windowTypeless = window as any;
const userAgentLowerCase = navigator.userAgent.toLowerCase();
const url = new URL(window.location.href);

export const RUNNING_IN_POPUP = url.searchParams.get('id')
  && (window.location.pathname.includes('index.html') || process.env.RUNNING_IN_TESTS);

export const IN_POPUP = !!window.opener && window.name.startsWith('popup-');

export const POPUP_TYPE = url.searchParams.get('type') || null;

export const IN_FRAME = window.parent !== window;

export const IS_EXTENSION_BACKGROUND = !!(process.env.IS_EXTENSION && window.location.href.endsWith('_generated_background_page.html'));

export const IS_IOS = /ipad|iphone|ipod/.test(userAgentLowerCase) && !windowTypeless.MSStream;

export const IS_ANDROID = !!(userAgentLowerCase.includes('android')
  || windowTypeless.cordova?.platformId?.toLowerCase()?.includes('android'));

export const IS_MOBILE_DEVICE = userAgentLowerCase.includes('mobi');

export const IS_FIREFOX = userAgentLowerCase.includes('firefox');

export const IS_CORDOVA = process.env.PLATFORM === 'cordova';
