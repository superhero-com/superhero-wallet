/* globals cordova */

export default url => {
  if (process.env.IS_EXTENSION) browser.tabs.create({ url, active: true });
  else {
    document.addEventListener('deviceready', () => {
      cordova.InAppBrowser.open(url, '_system');
    });
  }
};
