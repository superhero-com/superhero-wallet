/**
 * This function is used to set the redirect rules
 * so that the user is redirected to the extension's
 * popup page when they try to access wallet.superhero.com
 */
export function updateDynamicRules() {
  const extUrl = browser.runtime.getURL('./index.html');
  // @ts-ignore
  browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: [
      {
        id: 1,
        priority: 1,
        condition: {
          regexFilter: '^https://wallet.superhero.com/(.*)',
          resourceTypes: ['main_frame'],
        },
        action: {
          type: 'redirect',
          redirect: {
            regexSubstitution: `${extUrl}#/\\1`,
          },
        },
      },
    ],
  });
}
