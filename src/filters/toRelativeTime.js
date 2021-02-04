import { i18n } from '../store/plugins/languages';

export const secondsToRelativeTime = (seconds) => {
  const secondsPerMinute = 60;
  const secondsPerHour = secondsPerMinute * 60;
  const secondsPerDay = secondsPerHour * 24;

  if (seconds < secondsPerMinute) {
    return i18n.tc('seconds', Math.round(seconds));
  }
  if (seconds < secondsPerHour) {
    return i18n.tc('minutes', Math.round(seconds / secondsPerMinute));
  }
  if (seconds < secondsPerDay) {
    return i18n.tc('hours', Math.round(seconds / secondsPerHour));
  }
  return i18n.tc('days', Math.round(seconds / secondsPerDay));
};

export const blocksToRelativeTime = (blocks) => `in ~${secondsToRelativeTime(blocks * 3 * 60)}`;
