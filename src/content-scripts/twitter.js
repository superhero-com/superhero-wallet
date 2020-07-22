/* eslint-disable no-continue */
import iconHover from '../icons/twitter-icon-tip-hover.svg';
import icon from '../icons/twitter-icon-tip.svg';

global.browser = require('webextension-polyfill');

let timeout = null;
const isInContent = !window.location.href.includes(browser.extension.getURL('./'));
const buttonContentStyle = `color: rgb(101, 119, 134);
font-size: 12px;
font-weight: bold;
margin-left: 6px;
position: relative;`;

const buttonContentStyleHover = `color: #2a9cff;
font-size: 12px;
font-weight: bold;
margin-left: 6px;
position: relative;`;

const buttonStyles = `background: transparent; 
border:none; cursor: pointer; padding: 0px;
color:rgb(101, 119, 134);
outline:none;`;

const buttonStylesHover = `background: transparent; 
border:none; cursor: pointer;
color: #2a9cff;
outline:none;`;

const getTweetId = tweet => {
  const status = tweet.querySelector("a[href*='/status/']");
  if (!status || !status.href) {
    return null;
  }

  return status.href.split('/retweets')[0];
};

const createSuperheroTipAction = tweetId => {
  // Create the tip action
  const superheroTipAction = document.createElement('div');
  superheroTipAction.className = 'action-superhero-tip';
  superheroTipAction.style.alignSelf = 'center';
  superheroTipAction.setAttribute('role', 'button');
  superheroTipAction.setAttribute('tabindex', '0');

  // Create the tip button icon
  const buttonIcon = document.createElement('img');
  buttonIcon.src = icon;
  buttonIcon.setAttribute('style', `height: 16px; vertical-align: middle;`);

  // Create the tip button content
  const buttonContent = document.createElement('span');
  buttonContent.innerHTML = 'Tip';
  buttonContent.setAttribute('style', buttonContentStyle);

  // Create the tip button
  const superheroTipButton = document.createElement('button');
  superheroTipButton.setAttribute('style', buttonStyles);
  superheroTipButton.appendChild(buttonIcon);
  superheroTipButton.appendChild(buttonContent);

  // Events
  // On click send postMessage for invoking tip with the tweetId
  superheroTipButton.onclick = e => {
    browser.runtime.sendMessage({ from: 'content', type: 'openTipPopup', url: tweetId });
    e.stopPropagation();
  };

  const hoverEnter = () => {
    buttonIcon.src = iconHover;
    superheroTipButton.setAttribute('style', buttonStylesHover);
    buttonContent.setAttribute('style', buttonContentStyleHover);
  };

  const hoverLeave = () => {
    buttonIcon.src = icon;
    superheroTipButton.setAttribute('style', buttonStyles);
    buttonContent.setAttribute('style', buttonContentStyle);
  };

  // Change style on mouseenter and mouseleave
  superheroTipButton.onmouseenter = e => {
    hoverEnter();
    e.stopPropagation();
  };
  superheroTipButton.onmouseleave = e => {
    hoverLeave();
    e.stopPropagation();
  };

  buttonContent.onmouseenter = e => {
    hoverEnter();
    e.stopPropagation();
  };
  buttonContent.onmouseleave = e => {
    hoverLeave();
    e.stopPropagation();
  };

  const shadowRoot = superheroTipAction.attachShadow({ mode: 'open' });
  shadowRoot.appendChild(superheroTipButton);

  return superheroTipAction;
};

const configureSuperheroTipAction = async () => {
  clearTimeout(timeout);
  const check = await browser.runtime.sendMessage({ method: 'checkHasAccount' });
  const tweets = document.querySelectorAll(
    '[data-testid="tweet"], [data-testid="tweetDetail"], [data-testid="tweet"] + div, [data-testid="tweetDetail"] + div',
  );

  let bigTweetSkipped = !document.querySelectorAll('div[aria-label="Timeline: Conversation"]')
    .length;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < tweets.length; ++i) {
    const tweetId = getTweetId(tweets[i]);
    if (!tweetId) continue;
    const actions = tweets[i].querySelector('[role="group"]');
    if (!actions) continue;
    const lastActionNode = actions.querySelector(
      ':scope > div:not(.action-superhero-tip):last-child',
    );
    if (check && bigTweetSkipped && lastActionNode) {
      lastActionNode.style.flexBasis = '0px';
      lastActionNode.style.flexGrow = '1';
    }
    const superheroTipActions = actions.getElementsByClassName('action-superhero-tip');

    if (check && superheroTipActions.length === 0) {
      actions.appendChild(createSuperheroTipAction(tweetId));
    } else if (!check && superheroTipActions.length === 1) {
      actions.removeChild(superheroTipActions[0]);
    }
    bigTweetSkipped = true;
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
