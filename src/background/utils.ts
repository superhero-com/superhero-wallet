/**
 * This function is used to set the redirect rules
 * so that the user is redirected to the extension's
 * popup page when they try to access wallet.superhero.com
 */
export function updateDynamicRules() {
  const extUrl = browser.runtime.getURL('./index.html');
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

export async function registerInPageContentScript() {
  try {
    await browser?.scripting.registerContentScripts([
      {
        id: 'inpage',
        matches: ['file://*/*', 'http://*/*', 'https://*/*'],
        js: ['js/inpage.js'],
        runAt: 'document_start',
        world: 'MAIN',
        allFrames: true,
      },
    ]);
  } catch (err) {
    /**
     * An error occurs when app-init.js is reloaded. Attempts to avoid the duplicate script error:
     * 1. registeringContentScripts inside runtime.onInstalled - This caused a race condition
     *    in which the provider might not be loaded in time.
     * 2. await chrome.scripting.getRegisteredContentScripts() to check for an existing
     *    inpage script before registering - The provider is not loaded on time.
     */
    // eslint-disable-next-line no-console
    console.warn(`Dropped attempt to register inpage content script. ${err}`);
  }
}
