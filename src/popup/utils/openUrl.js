/* globals cordova */

const openUrlWeb = (url, newTab) => window.open(url, newTab ? '_blank' : '_self');

export default (url, newTab) => {
  switch (process.env.PLATFORM) {
    case 'extension-chrome':
    case 'extension-firefox': {
      const isOpenedInTab = browser.extension.getViews({ type: 'tab' }).includes(window);
      if (isOpenedInTab) openUrlWeb(url, newTab);
      else browser.tabs.create({ url, active: true });
      break;
    }
    case 'cordova':
      document.addEventListener('deviceready', () => {
        cordova.InAppBrowser.open(url, '_system');
      });
      break;
    case 'web':
      openUrlWeb(url, newTab);
      break;
    default:
      throw new Error(`Unknown platform: ${process.env.PLATFORM}`);
  }
};
