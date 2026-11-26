const options = new URLSearchParams(window.location.search);

export const IS_IOS = options.get('platform') === 'ios';
export const IS_FIREFOX = options.get('firefox') === 'true';
export const RUNNING_IN_TESTS = options.get('runningInTests') === 'true';
export const IS_MOBILE_APP = false;
export const IS_EXTENSION = false;
export const IS_WEB = true;
export const IS_ANDROID = false;
export const IS_MOBILE_DEVICE = IS_IOS;
export const IS_CHROME_BASED = false;
export const RUNNING_IN_POPUP = false;
export const APP_LINK_FIREFOX = '';
export const APP_LINK_CHROME = '';
