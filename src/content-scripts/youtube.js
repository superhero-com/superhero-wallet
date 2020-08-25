import createSuperheroTipAction from './tipButton';

setTimeout(async () => {
  const buttons = document.querySelector(
    'ytd-menu-renderer.style-scope.ytd-video-primary-info-renderer #top-level-buttons',
  );
  const superheroTipActions = buttons.querySelectorAll('.action-superhero-tip');
  if (
    !(await browser.runtime.sendMessage({ method: 'checkHasAccount' })) ||
    !buttons ||
    superheroTipActions.length
  )
    return;
  const superheroTipAction = createSuperheroTipAction(window.location.href);
  superheroTipAction.classList.add('youtube');
  buttons.append(superheroTipAction);
}, 5000);
