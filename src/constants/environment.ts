import { isPlatform } from '@ionic/vue';
import type { PopupType } from '../types';

const userAgentLowerCase = navigator.userAgent.toLowerCase();
const url = new URL(window.location.href);

export const PLATFORM = process.env.PLATFORM as 'web' | 'extension' | 'ionic';

export const RUNNING_IN_TESTS = !!process.env.RUNNING_IN_TESTS;

export const RUNNING_IN_POPUP = !!(
  url.searchParams.get('id')
  && (window.location.pathname.includes('index.html') || RUNNING_IN_TESTS)
);

/**
 * Running in a popup window opened by the extension's background process
 * with the use of `popupHandler`.
 */
export const IN_POPUP = !!window.opener && window.name.startsWith('popup-');

export const POPUP_TYPE = url.searchParams.get('type') as PopupType || null;

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
export const IS_MOBILE_APP = PLATFORM === 'ionic';

/**
 * Running as a browser extension
 */
export const IS_EXTENSION = PLATFORM === 'extension' && !RUNNING_IN_TESTS;

export const IS_EXTENSION_BACKGROUND = IS_EXTENSION && window.location.href.endsWith('_generated_background_page.html');

/**
 * The Offscreen API allows the extension to use DOM APIs in a hidden document.
 * The runtime API is the only extensions API supported by offscreen documents.
 */
export const IS_OFFSCREEN_TAB = window.location.pathname === '/offscreen.html';

export const IS_IOS = isPlatform('ios');

export const IS_ANDROID = isPlatform('android');

export const IS_MOBILE_DEVICE = isPlatform('mobile');

/**
 * Chrome, Brave, Safari, Edge...
 */
export const IS_CHROME_BASED = userAgentLowerCase.includes('chrome');

export const IS_FIREFOX = userAgentLowerCase.includes('firefox');

export const IS_SAFARI = /Mozilla\/5.0 \((Macintosh|iPad|iPhone|iPod); [\s\S]+?\) AppleWebKit\/\S+ \(KHTML, like Gecko\)( (Version|Safari|Mobile)\/\S+)+/.test(navigator.userAgent);

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Features visible only to developers as they are most probably still in development.
 */
export const UNFINISHED_FEATURES = !!process.env.UNFINISHED_FEATURES;

export const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY!;

export const WALLET_CONNECT_PROJECT_ID = process.env.WALLET_CONNECT_PROJECT_ID!;
