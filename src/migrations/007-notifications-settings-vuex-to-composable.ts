import type { INotificationSettings, Migration, NotificationType } from '@/types';
import { NOTIFICATION_TYPES } from '@/constants';
import { collectVuexState } from './migrationHelpers';

const migration: Migration<INotificationSettings> = async (restoredValue) => {
  if (!restoredValue || !Object.keys(restoredValue).length) {
    const settings = (await collectVuexState())?.notificationSettings;
    if (settings?.length) {
      const notificationTypeValues = Object.values(NOTIFICATION_TYPES);
      return settings.reduce((acc: INotificationSettings, setting: any) => {
        if (notificationTypeValues.includes(setting.type)) {
          // eslint-disable-next-line no-param-reassign
          acc[setting.type as NotificationType] = !!setting.checked;
        }
        return acc;
      }, {});
    }
  }
  return restoredValue;
};

export default migration;
