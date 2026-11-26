// @ts-nocheck
import { handleSessionKeyMutation } from '@/lib/ExtensionSessionStorage';

/** One background owner shared by the simulated page module instances. */
export function installSessionMutationHandler() {
  const { sendMessage } = globalThis.browser.runtime;
  globalThis.browser.runtime.sendMessage = vi.fn((message, ...args) => (
    message.method === 'mutateSessionKey'
      ? handleSessionKeyMutation(message.payload)
      : sendMessage.call(globalThis.browser.runtime, message, ...args)
  ));
}
