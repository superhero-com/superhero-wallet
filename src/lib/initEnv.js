Object.assign(process.env, {
  ...(process.env.RUNNING_IN_POPUP === undefined && {
    RUNNING_IN_POPUP: !!window.opener && window.name.includes('popup'),
  }),
});
const url = new URL(window.location.href);
// window.RUNNING_IN_POPUP = !!window.opener && window.name.includes('popup');
window.RUNNING_IN_POPUP = url.searchParams.get('id') && window.location.pathname.includes('popup.html');
