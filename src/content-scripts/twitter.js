/* eslint-disable no-continue */
import icon from '../icons/twitter-icon-tip.svg';

global.browser = require('webextension-polyfill');

let timeout = null;
const isInContent = !window.location.href.includes(browser.extension.getURL('./'));
const buttonContentStyle = `color: rgb(101, 119, 134);
font-size: 12px;
font-weight: bold;
margin-left: 6px;
position: relative;
top:-4px`;

const buttonStyles = `background: transparent; 
border:none; cursor: pointer;
color:rgb(101, 119, 134);
outline:none;`;

const getTweetId = tweet => {
  const status = tweet.querySelector("a[href*='/status/']");
  if (!status || !status.href) {
    return null;
  }

  return status.href;
};

const createSuperheroTipAction = (tweet, tweetId, numActions) => {
  // Create the tip action
  const hasUserActions = numActions > 3;
  const superheroTipAction = document.createElement('div');
  superheroTipAction.className = 'action-superhero-tip';
  superheroTipAction.style.display = 'inline-block';
  superheroTipAction.style.minWidth = '80px';
  superheroTipAction.style.textAlign = hasUserActions ? 'right' : 'start';
  superheroTipAction.setAttribute('role', 'button');
  superheroTipAction.setAttribute('tabindex', '0');

  // Create the tip button icon
  const buttonIcon = document.createElement('img');
  buttonIcon.src = icon;
  buttonIcon.setAttribute('style', `height: 16px;`);

  // Creaate the tip button content
  const buttonContent = document.createElement('span');
  buttonContent.innerHTML = 'Tip';
  buttonContent.setAttribute('style', buttonContentStyle);

  // Create the tip button
  const superheroTipButton = document.createElement('button');
  superheroTipButton.setAttribute('style', buttonStyles);
  superheroTipButton.appendChild(buttonIcon);
  superheroTipButton.appendChild(buttonContent);
  superheroTipButton.onclick = e => {
    browser.runtime.sendMessage({ from: 'content', type: 'openTipPopup', url: tweetId });
    e.stopPropagation();
  };
  const shadowRoot = superheroTipAction.attachShadow({ mode: 'open' });
  shadowRoot.appendChild(superheroTipButton);

  return superheroTipAction;
};

const configureSuperheroTipAction = async () => {
  clearTimeout(timeout);
  const check = await browser.runtime.sendMessage({ method: 'checkHasAccount' });
  const tweets = document.querySelectorAll('[data-testid="tweet"], [data-testid="tweetDetail"]');

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < tweets.length; ++i) {
    const tweetId = getTweetId(tweets[i]);
    if (!tweetId) continue;
    const actions = tweets[i].querySelector('[role="group"]');
    if (!actions) continue;
    const numActions = actions.querySelectorAll(':scope > div').length || 0;
    const superheroTipActions = actions.getElementsByClassName('action-superhero-tip');

    if (check && superheroTipActions.length === 0) {
      actions.appendChild(createSuperheroTipAction(tweets[i], tweetId, numActions));
    } else if (!check && superheroTipActions.length === 1) {
      actions.removeChild(superheroTipActions[0]);
    }
  }
  timeout = setTimeout(configureSuperheroTipAction, 3000);
};

if (isInContent) {
  document.addEventListener('visibilitychange', () => {
    clearTimeout(timeout);
    if (!document.hidden) {
      timeout = setTimeout(configureSuperheroTipAction, 3000);
    }
  });

  configureSuperheroTipAction();
}
