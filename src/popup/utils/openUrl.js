/* globals cordova */

export default (url, newTab) => {
  switch (process.env.PLATFORM) {
    case 'extension-chrome':
    case 'extension-firefox':
      browser.tabs.create({ url, active: true });
      break;
    case 'cordova':
      document.addEventListener('deviceready', () => {
        cordova.InAppBrowser.open(url, '_system');
      });
      break;
    case 'web':
      if (newTab || window.parent) {
        window.open(url);
      } else {
        window.location = url;
      }
      break;
    default:
      throw new Error(`Unknown platform: ${process.env.PLATFORM}`);
  }
};
