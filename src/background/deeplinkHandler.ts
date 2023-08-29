import { APP_LINK_WEB } from '@/constants';

export default () => browser.webRequest.onBeforeRequest.addListener(
  ({ url }) => ({
    redirectUrl: browser.runtime.getURL(`/index.html#${url.replace(APP_LINK_WEB, '')}`),
  }),
  {
    urls: [`${APP_LINK_WEB}/*`],
    types: ['main_frame'],
  },
  ['blocking'],
);
