if (navigator.userAgent.indexOf('Firefox') != -1) {
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(result => {
        browser.storage.local.set({ firefoxCameraAllowed: true }).then(() => {
          const extensionUrl = browser.extension.getURL('./');
          browser.tabs.create({ url: `${extensionUrl}/popup/popup.html#/qrCodeReader`, active: true });
        });
      })
      .catch(err => {
        alert('You have denied the access to camera.');
      });
  }
} else if (navigator.userAgent.indexOf('Chrome') != -1) {
  if (navigator.getUserMedia) {
    // Request the camera.
    navigator.getUserMedia(
      // Constraints
      {
        video: true,
      },

      // Success Callback
      localMediaStream => {
        alert('You have allowed the chrome camera. Now, try again to create a vault for AirGap! :)');
      },

      // Error Callback
      err => {
        // Log the error to the console.
        console.log(`The following error occurred when trying to use getUserMedia: ${err}`);
      }
    );
  } else {
    alert('Sorry, your browser does not support getUserMedia');
  }
}
