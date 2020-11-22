if (navigator.userAgent.indexOf('Firefox') !== -1) {
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => {
        alert('You have allowed the firefox camera. Now, try again scan QR code');
      })
      .catch((err) => {
        alert(err);
      });
  } else {
    alert('Sorry, your browser does not support getUserMedia');
  }
} else if (navigator.userAgent.indexOf('Chrome') !== -1) {
  if (navigator.getUserMedia) {
    navigator.getUserMedia(
      {
        video: true,
      },

      () => {
        alert('You have allowed the chrome camera. Now, try again scan QR code');
        window.close();
      },

      (err) => {
        alert(`The following error occurred when trying to use getUserMedia: ${err}`);
        window.close();
      },
    );
  } else {
    alert('Sorry, your browser does not support getUserMedia');
    window.close();
  }
}
