import createSuperheroTipAction from './tipButton';

let timeout = null;

const getTweetId = tweet => {
  const status = tweet.querySelector("a[href*='/status/']");
  if (!status || !status.href) {
    return null;
  }

  return status.href.match('.*/status/[0-9]+')[0];
};

const configureSuperheroTipAction = async () => {
  clearTimeout(timeout);
  const check = await browser.runtime.sendMessage({ method: 'checkHasAccount' });
  const tweets = document.querySelectorAll(
    '[data-testid="tweet"], [data-testid="tweetDetail"], [data-testid="tweet"] + div, [data-testid="tweetDetail"] + div',
  );

  let bigTweetSkipped = !document.querySelectorAll('div[aria-label="Timeline: Conversation"]')
    .length;
  tweets.forEach(tweet => {
    const tweetId = getTweetId(tweet);
    if (!tweetId) return;
    const actions = tweet.querySelector('[role="group"]');
    if (!actions) return;
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
  });
  timeout = setTimeout(configureSuperheroTipAction, 3000);
};

document.addEventListener('visibilitychange', () => {
  clearTimeout(timeout);
  if (!document.hidden) {
    timeout = setTimeout(configureSuperheroTipAction, 3000);
  }
});

configureSuperheroTipAction();
