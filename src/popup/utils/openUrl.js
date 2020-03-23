/* globals cordova */

export default url => {
  switch (process.env.PLATFORM) {
    case 'chrome':
    case 'firefox':
      browser.tabs.create({ url, active: true });
      break;
    case 'cordova':
      document.addEventListener('deviceready', () => {
        cordova.InAppBrowser.open(url, '_system');
      });
      break;
    case 'web':
      window.location = url;
      break;
    default:
      throw new Error(`Unknown platform: ${process.env.PLATFORM}`);
  }
};
