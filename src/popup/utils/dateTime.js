const parseDateParam = (time) => (!!time && ['number', 'string'].includes(typeof time) ? time : undefined);

const getDate = (time) => {
  const date = new Date(+parseDateParam(time));
  if (date.toString() !== 'Invalid Date') return date;
  return null;
};

// TODO: Use the current language from i18n module
export const formatDate = (time) => getDate(time)?.toLocaleDateString(navigator.language, {
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
});

export const formatTime = (time) => getDate(time)?.toLocaleTimeString(navigator.language, {
  timeStyle: 'short',
});
