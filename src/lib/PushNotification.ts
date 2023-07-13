import webNotification from 'simple-web-notification';
import { PUSH_NOTIFICATION_AUTO_CLOSE_TIMEOUT, handleUnknownError } from '../popup/utils';
import { INotification } from '../types';
import { IS_CORDOVA, IS_EXTENSION, IS_WEB } from './environment';

export default class PushNotification {
  static init() {
    if (IS_WEB) {
      webNotification.requestPermission();
    }

    if (IS_CORDOVA) {
      try {
        if (window.cordova?.plugins?.notification) {
          window.cordova.plugins.notification.local.requestPermission(() => {});
        }
      } catch (error) {
        handleUnknownError(error);
      }
    }
  }

  static scheduleWebNotification(notification: Partial<INotification>) {
    webNotification.showNotification(notification.title, {
      body: notification.text,
      icon: '/favicons/favicon-128.png',
      actions: [],
      autoClose: PUSH_NOTIFICATION_AUTO_CLOSE_TIMEOUT,
    });
  }

  static scheduleCordovaNotification(notification: Partial<INotification>) {
    try {
      if (window.cordova?.plugins?.notification) {
        window.cordova.plugins.notification.local.schedule({
          title: notification.title,
          text: notification.text,
          foreground: true,
        });
      }
    } catch (error) {
      handleUnknownError(error);
    }
  }

  static send(notification: Partial<INotification>) {
    if (IS_CORDOVA) {
      PushNotification.scheduleCordovaNotification(notification);
    } else if (IS_WEB || IS_EXTENSION) {
      PushNotification.scheduleWebNotification(notification);
    }
  }
}
